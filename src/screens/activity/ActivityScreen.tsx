import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
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
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { app, auth } from "../../lib/firebase";

import { Job } from "../../models/job/Job";
import { jobConverter } from "../../models/job/job.converter";
import { Company } from "../../models/company/Company";
import { companyConverter } from "../../models/company/company.converter";

import type { ActivityStackParamList } from "../../navigation/RootNavigator";

type Nav = NativeStackNavigationProp<ActivityStackParamList, "ActivityHome">;
type Row = { vm: JobCardVM; job: Job; company?: Company };

const ActivityScreen: React.FC = () => {
  const { theme: t } = useDesign();
  const styles = useMemo(() => makeStyles(t), [t]);
  const db = getFirestore(app);
  const nav = useNavigation<Nav>();

  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);

  const [tab, setTab] = useState<"applied" | "saved">("applied");
  const [appliedRows, setAppliedRows] = useState<Row[]>([]);
  const [savedRows, setSavedRows] = useState<Row[]>([]);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    []
  );

  // keep uid synced
  useEffect(() => onAuthStateChanged(auth, (u) => setUid(u?.uid ?? null)), []);

  // ----- helpers -----
  const toVM = async (j: Job): Promise<Row> => {
    let company: Company | undefined;
    let companyName = "Unknown";
    let companyLogoUrl: string | undefined;

    if (j.companyId != null) {
      const cRef = doc(db, "companies", String(j.companyId)).withConverter(
        companyConverter
      );
      const cSnap = await getDoc(cRef);
      if (cSnap.exists()) {
        company = cSnap.data() as Company;
        companyName = company.name;
        companyLogoUrl = company.logoUrl || undefined;
      }
    }

    const [city = "", country = ""] = (j.location ?? "")
      .split(",")
      .map((s) => s.trim());

    const vm: JobCardVM = {
      id: j.id,
      company: companyName,
      companyLogoText: companyName.charAt(0),
      companyLogoUrl,
      title: j.role,
      city,
      country,
      type: j.jobType,
      summary: j.description,
      applicants: 0,
      views: 0,
      postedAt: j.publishedDate.toDateString(),
      bookmarked: savedIds.has(j.id),
    };
    return { vm, job: j, company };
  };

  const loadRowsForJobIds = async (jobIds: string[]) => {
    const uniqueIds = [...new Set(jobIds)].filter(Boolean);
    const jobSnaps = await Promise.all(
      uniqueIds.map((id) =>
        getDoc(doc(db, "jobs", id).withConverter(jobConverter))
      )
    );
    const jobs = jobSnaps.filter((s) => s.exists()).map((s) => s.data() as Job);
    const rows = await Promise.all(jobs.map(toVM));
    const byId = new Map(rows.map((r) => [r.job.id, r]));
    return uniqueIds
      .map((id) => byId.get(id))
      .filter((x): x is Row => Boolean(x));
  };

  // ----- subscriptions -----
  useEffect(() => {
    if (!uid) {
      setSavedIds(new Set());
      setSavedRows([]);
      setAppliedRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    // saved
    const unsubSaved = onSnapshot(
      query(collection(db, "bookmarked_jobs"), where("userId", "==", uid)),
      async (snap) => {
        const ids = snap.docs.map((d) => String(d.get("jobId")));
        const nextSet = new Set(ids);
        if (!alive.current) return;
        setSavedIds(nextSet);

        const saved = await loadRowsForJobIds(ids);
        if (!alive.current) return;
        setSavedRows(
          saved.map((r) => ({ ...r, vm: { ...r.vm, bookmarked: true } }))
        );
      },
      () => alive.current && setLoading(false)
    );

    // applied
    const unsubApplied = onSnapshot(
      query(collection(db, "applied_jobs"), where("userId", "==", uid)),
      async (snap) => {
        const ids = snap.docs.map((d) => String(d.get("jobId")));
        const rows = await loadRowsForJobIds(ids);
        if (!alive.current) return;
        setAppliedRows(
          rows.map((r) => ({
            ...r,
            vm: { ...r.vm, bookmarked: savedIds.has(r.vm.id) },
          }))
        );
        if (alive.current) setLoading(false);
      },
      () => alive.current && setLoading(false)
    );

    return () => {
      unsubSaved();
      unsubApplied();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, uid]);

  // sync bookmark flags when savedIds changes
  useEffect(() => {
    setAppliedRows((prev) =>
      prev.map((r) => ({
        ...r,
        vm: { ...r.vm, bookmarked: savedIds.has(r.vm.id) },
      }))
    );
    setSavedRows((prev) =>
      prev.map((r) => ({ ...r, vm: { ...r.vm, bookmarked: true } }))
    );
  }, [savedIds]);

  // ----- actions -----
  const toggleBookmark = async (jobId: string, next: boolean) => {
    if (!uid) return;

    // optimistic
    setSavedIds((prev) => {
      const n = new Set(prev);
      next ? n.add(jobId) : n.delete(jobId);
      return n;
    });

    const ref = doc(db, "bookmarked_jobs", `${uid}_${jobId}`);
    try {
      if (next) {
        await setDoc(
          ref,
          { userId: uid, jobId, createdAt: serverTimestamp() },
          { merge: true }
        );
      } else {
        await deleteDoc(ref);
      }
    } catch (e) {
      console.warn("Bookmark toggle failed:", e);
      // revert
      setSavedIds((prev) => {
        const n = new Set(prev);
        next ? n.delete(jobId) : n.add(jobId);
        return n;
      });
    }
  };

  const rows = tab === "applied" ? appliedRows : savedRows;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          style={styles.backBtn}
          onPress={() => nav.canGoBack() && nav.goBack()}
        >
          <Ionicons name="arrow-back" size={rs.ms(22)} color={t.textColor} />
        </Pressable>
        <Text style={styles.title}>Activity</Text>
        <View style={{ width: rs.ms(26) }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        <Pressable style={styles.tabBtn} onPress={() => setTab("applied")}>
          <Text
            style={[styles.tabText, tab === "applied" && styles.tabTextActive]}
          >
            Applied
          </Text>
        </Pressable>
        <Pressable style={styles.tabBtn} onPress={() => setTab("saved")}>
          <Text
            style={[styles.tabText, tab === "saved" && styles.tabTextActive]}
          >
            Saved
          </Text>
        </Pressable>
      </View>
      <View style={styles.tabIndicatorWrap}>
        <View
          style={[
            styles.tabIndicator,
            {
              transform: [
                { translateX: tab === "applied" ? 0 : ("100%" as any) },
              ],
            },
          ]}
        />
      </View>

      {/* List */}
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: rs.ms(16),
          paddingTop: rs.ms(12),
          paddingBottom: rs.ms(24),
        }}
        showsVerticalScrollIndicator={false}
      >
        {!uid ? (
          <Text style={{ color: t.subtextColor, marginTop: rs.ms(12) }}>
            Please sign in to see your activity.
          </Text>
        ) : loading ? (
          <ActivityIndicator
            style={{ marginTop: rs.ms(24) }}
            color={t.primaryColor}
          />
        ) : rows.length === 0 ? (
          <Text style={{ color: t.subtextColor, marginTop: rs.ms(12) }}>
            {tab === "applied" ? "No applied jobs yet." : "No saved jobs yet."}
          </Text>
        ) : null}

        {rows.map(({ vm, job }) => (
          <View key={vm.id} style={{ marginBottom: rs.ms(12) }}>
            <JobCard
              job={{ ...vm, bookmarked: savedIds.has(vm.id) }}
              onPress={() =>
                nav.navigate("JobDetail", {
                  jobId: job.id,
                  companyId:
                    job.companyId != null ? String(job.companyId) : null,
                })
              }
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
    tabIndicator: {
      width: "50%",
      height: rs.ms(2),
      backgroundColor: t.appColor || t.primaryColor,
    },
  });
