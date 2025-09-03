import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useDesign } from "../../design/DesignProvider";
import { rs } from "../../utils/responsive";
import JobCard, { JobCardVM } from "../../components/JobCard";

import {
  getFirestore,
  collection,
  onSnapshot,
  query,
  where,
  orderBy,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { app } from "../../lib/firebase";

import { Job } from "../../models/job/Job";
import { jobConverter } from "../../models/job/job.converter";
import { Company } from "../../models/company/Company";
import { companyConverter } from "../../models/company/company.converter";

import type { ActivityStackParamList } from "../../navigation/RootNavigator";

type Nav = NativeStackNavigationProp<ActivityStackParamList, "ActivityHome">;

type Row = { vm: JobCardVM; job: Job; company?: Company };

const CURRENT_USER_ID = "1";

const ActivityScreen: React.FC = () => {
  const { theme: t } = useDesign();
  const styles = useMemo(() => makeStyles(t), [t]);
  const db = getFirestore(app);
  const nav = useNavigation<Nav>();

  const [tab, setTab] = useState<"applied" | "saved">("applied");
  const [appliedRows, setAppliedRows] = useState<Row[]>([]);
  const [savedRows, setSavedRows] = useState<Row[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set()); // ← source of truth for bookmarks
  const [loading, setLoading] = useState(true);

  const alive = useRef(true);
  useEffect(() => {
    return () => {
      alive.current = false;
    };
  }, []);

  // ---- helpers ----
  const toVM = async (j: Job): Promise<Row> => {
    let company: Company | undefined;
    let companyName = "Unknown";
    let companyLogoUrl: string | undefined;

    if (j.companyId != null) {
      const cRef = doc(db, "companies", String(j.companyId)).withConverter(companyConverter);
      const cSnap = await getDoc(cRef);
      if (cSnap.exists()) {
        company = cSnap.data() as Company;
        companyName = company.name;
        companyLogoUrl = company.logoUrl || undefined;
      }
    }

    const [city = "", country = ""] = (j.location ?? "").split(",").map((s) => s.trim());

    const vm: JobCardVM = {
      id: j.id,
      company: companyName,
      companyLogoText: companyName.charAt(0),
      companyLogoUrl, // ✅ show logo if available
      title: j.role,
      city,
      country,
      type: j.jobType,
      summary: j.description,
      applicants: 0,
      views: 0,
      postedAt: j.publishedDate.toDateString(),
      bookmarked: savedIds.has(j.id), // ✅ reflect saved state
    };
    return { vm, job: j, company };
  };

  const loadRowsForJobIds = async (jobIds: string[]) => {
    const uniqueIds = [...new Set(jobIds)].filter(Boolean);
    const jobSnaps = await Promise.all(
      uniqueIds.map((id) => getDoc(doc(db, "jobs", id).withConverter(jobConverter)))
    );
    const jobs = jobSnaps.filter((s) => s.exists()).map((s) => s.data() as Job);
    // build in the same order as incoming ids
    const rows = await Promise.all(jobs.map(toVM));
    const byId = new Map(rows.map((r) => [r.job.id, r]));
    return uniqueIds.map((id) => byId.get(id)).filter((x): x is Row => Boolean(x));
  };

  // ---- subscriptions ----
  useEffect(() => {
    setLoading(true);

    // 1) Listen to saved bookmarks for current user (drives 'bookmarked' state everywhere)
    const unsubSavedIds = onSnapshot(
      query(
        collection(db, "bookmarked_jobs"),
        where("userId", "==", CURRENT_USER_ID),
        orderBy("createdAt", "desc")
      ),
      async (snap) => {
        const ids = snap.docs.map((d) => String(d.get("jobId")));
        const set = new Set(ids);
        if (!alive.current) return;
        setSavedIds(set);

        // Build Saved rows (with latest savedIds)
        const saved = await loadRowsForJobIds(ids);
        if (!alive.current) return;
        // ensure each vm.bookmarked = true on saved tab
        setSavedRows(saved.map((r) => ({ ...r, vm: { ...r.vm, bookmarked: true } })));
      }
    );

    // 2) Listen to applied jobs (independent from bookmarks, but we mark bookmarked if intersect)
    const unsubApplied = onSnapshot(
      query(
        collection(db, "applied_jobs"),
        where("userId", "==", CURRENT_USER_ID),
        orderBy("createdAt", "desc")
      ),
      async (snap) => {
        const ids = snap.docs.map((d) => String(d.get("jobId")));
        const rows = await loadRowsForJobIds(ids);
        if (!alive.current) return;
        // set bookmarked based on savedIds
        setAppliedRows(rows.map((r) => ({ ...r, vm: { ...r.vm, bookmarked: savedIds.has(r.vm.id) } })));
        if (alive.current) setLoading(false);
      },
      () => alive.current && setLoading(false)
    );

    return () => {
      unsubSavedIds();
      unsubApplied();
    };
    // savedIds intentionally omitted here; we refresh 'appliedRows' bookmarked flags below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db]);

  // keep appliedRows' bookmark flags in sync when savedIds changes
  useEffect(() => {
    setAppliedRows((prev) => prev.map((r) => ({ ...r, vm: { ...r.vm, bookmarked: savedIds.has(r.vm.id) } })));
    setSavedRows((prev) => prev.map((r) => ({ ...r, vm: { ...r.vm, bookmarked: true } })));
  }, [savedIds]);

  // ---- actions ----
  const toggleBookmark = async (jobId: string, next: boolean) => {
    // optimistic update
    setSavedIds((prev) => {
      const nextSet = new Set(prev);
      next ? nextSet.add(jobId) : nextSet.delete(jobId);
      return nextSet;
    });

    const ref = doc(db, "bookmarked_jobs", `${CURRENT_USER_ID}_${jobId}`);
    try {
      if (next) {
        await setDoc(ref, { userId: CURRENT_USER_ID, jobId, createdAt: new Date() });
      } else {
        await deleteDoc(ref);
      }
    } catch (e) {
      console.warn("Bookmark toggle failed:", e);
      // revert on failure
      setSavedIds((prev) => {
        const revert = new Set(prev);
        next ? revert.delete(jobId) : revert.add(jobId);
        return revert;
      });
    }
  };

  const rows = tab === "applied" ? appliedRows : savedRows;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => nav.canGoBack() && nav.goBack()}>
          <Ionicons name="arrow-back" size={rs.ms(22)} color={t.textColor} />
        </Pressable>
        <Text style={styles.title}>Activity</Text>
        <View style={{ width: rs.ms(26) }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <Pressable style={styles.tabBtn} onPress={() => setTab("applied")}>
          <Text style={[styles.tabText, tab === "applied" && styles.tabTextActive]}>Applied</Text>
        </Pressable>
        <Pressable style={styles.tabBtn} onPress={() => setTab("saved")}>
          <Text style={[styles.tabText, tab === "saved" && styles.tabTextActive]}>Saved</Text>
        </Pressable>
      </View>
      <View style={styles.tabIndicatorWrap}>
        <View
          style={[
            styles.tabIndicator,
            { transform: [{ translateX: tab === "applied" ? 0 : ("100%" as any) }] },
          ]}
        />
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: rs.ms(16), paddingTop: rs.ms(12), paddingBottom: rs.ms(24) }}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator style={{ marginTop: rs.ms(24) }} color={t.primaryColor} />
        ) : rows.length === 0 ? (
          <Text style={{ color: t.subtextColor, marginTop: rs.ms(12) }}>
            {tab === "applied" ? "No applied jobs yet." : "No saved jobs yet."}
          </Text>
        ) : null}

        {rows.map(({ vm, job, company }) => (
          <View key={vm.id} style={{ marginBottom: rs.ms(12) }}>
            <JobCard
              job={{ ...vm, bookmarked: savedIds.has(vm.id) }}
              onPress={() => nav.navigate("JobDetail", { job, company })}
              onBookmark={(id, next) => toggleBookmark(id, next)}
            />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default ActivityScreen;

/* ---------------- styles ---------------- */
type Themed = ReturnType<typeof useDesign>["theme"];
const makeStyles = (t: Themed) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.backgroundColor },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: rs.ms(16),
      paddingTop: rs.ms(4),
      paddingBottom: rs.ms(8),
    },
    backBtn: { padding: rs.ms(4) },
    title: { color: t.textColor, fontSize: t.h4, fontWeight: t.bold },

    tabsRow: {
      marginTop: rs.ms(8),
      paddingHorizontal: rs.ms(16),
      flexDirection: "row",
      justifyContent: "space-between",
    },
    tabBtn: { paddingVertical: rs.ms(6), flex: 1, alignItems: "center" },
    tabText: { color: t.subtextColor, fontSize: t.h5, fontWeight: t.semiBold },
    tabTextActive: { color: t.appColor || t.primaryColor },
    tabIndicatorWrap: {
      marginTop: rs.ms(4),
      height: rs.ms(2),
      backgroundColor: t.dividerColor,
      marginHorizontal: rs.ms(16),
      overflow: "hidden",
    },
    tabIndicator: { width: "50%", height: rs.ms(2), backgroundColor: t.appColor || t.primaryColor },
  });
