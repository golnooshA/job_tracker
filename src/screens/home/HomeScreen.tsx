// screens/home/HomeScreen.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import PromoImageCard from "../../components/PromoImageCard";
import SectionHeader from "../../components/SectionHeader";
import CategoryItem from "../../components/CategoryItem";
import JobCard, { JobCardVM } from "../../components/JobCard";

import { useDesign } from "../../design/DesignProvider";
import { rs } from "../../utils/responsive";
import type { HomeStackParamList } from "../../navigation/RootNavigator";

import { categories } from "../../models/category/categories";
import { CategoryIcon } from "../../ui/CategoryIcon";
import type { Category } from "../../models/category/Category";

import { Job } from "../../models/job/Job";
import { jobConverter } from "../../models/job/job.converter";
import { Company } from "../../models/company/Company";
import { companyConverter } from "../../models/company/company.converter";

import {
  collection,
  onSnapshot,
  orderBy,
  limit,
  query,
  doc,
  getDoc,
  getFirestore,
  setDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { app, auth } from "../../lib/firebase";
import { useBookmarks } from "../../hooks/useBookmarks";

type Row = { vm: JobCardVM; job: Job & { id: string }; company?: Company };

const HomeScreen: React.FC = () => {
  const { theme: t } = useDesign();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const styles = useMemo(() => makeStyles(t), [t]);
  const db = getFirestore(app);

  // ---------- auth ----------
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUid(user?.uid ?? null);

      if (!user) {
        setDisplayName("");
        return;
      }

      // 1) prefer auth displayName
      let name = user.displayName?.trim();

      // 2) try users/{uid}.fullName
      if (!name) {
        try {
          const uref = doc(db, "users", user.uid);
          const usnap = await getDoc(uref);
          const fullName = (
            usnap.exists() ? (usnap.data() as any)?.fullName : ""
          )?.trim?.();
          if (fullName) name = fullName;
        } catch {}
      }

      // 3) fallback to email prefix
      if (!name) {
        const em = user.email ?? "";
        name = em.includes("@") ? em.split("@")[0] : "Friend";
      }
      setDisplayName(name);
    });
    return () => unsub();
  }, [db]);

  // bookmarks per user
  const { isBookmarked, toggleBookmark } = useBookmarks({
    userId: uid ?? "__guest__",
  });

  // ---------- notifications settings & badge ----------
  const [notifyNewJobs, setNotifyNewJobs] = useState(false);
  const [notifySince, setNotifySince] = useState<Date | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!uid) return;
    const uref = doc(db, "users", uid);
    const unsub = onSnapshot(uref, (snap) => {
      const data = snap.data() as any;
      setNotifyNewJobs(!!data?.notifyNewJobs);
      const ns = data?.notifySince?.toDate
        ? data.notifySince.toDate()
        : data?.notifySince instanceof Date
        ? data.notifySince
        : null;
      setNotifySince(ns);
    });
    return () => unsub();
  }, [db, uid]);

  useEffect(() => {
    if (!uid) return;
    const qUnread = query(
      collection(db, "users", uid, "notifications"),
      where("read", "==", false)
    );
    const unsub = onSnapshot(qUnread, (snap) => setUnreadCount(snap.size));
    return () => unsub();
  }, [db, uid]);

  // ---------- jobs feed (UI list) ----------
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);

    const qy = query(
      collection(db, "jobs").withConverter(jobConverter),
      orderBy("publishedDate", "desc"),
      limit(10)
    );

    const unsub = onSnapshot(
      qy,
      async (snap) => {
        const companyCache = new Map<string, Company>();
        const built: Row[] = [];

        for (const d of snap.docs) {
          const jobId = d.id;
          const j = d.data() as Job;

          // fetch company (with small cache)
          let company: Company | undefined;
          const cid = j.companyId != null ? String(j.companyId) : undefined;

          if (cid) {
            if (companyCache.has(cid)) {
              company = companyCache.get(cid);
            } else {
              const cRef = doc(db, "companies", cid).withConverter(
                companyConverter
              );
              const cSnap = await getDoc(cRef);
              if (cSnap.exists()) {
                company = cSnap.data() as Company;
                companyCache.set(cid, company);
              }
            }
          }

          const companyName = company?.name ?? "Unknown";
          const [city = "", country = ""] = (j.location ?? "")
            .split(",")
            .map((s) => s.trim());

          const vm: JobCardVM = {
            id: jobId, // ✅ از doc.id
            company: companyName,
            companyLogoText: companyName.charAt(0),
            companyLogoUrl: company?.logoUrl ?? undefined,
            title: j.role,
            city,
            country,
            type: j.jobType,
            summary: j.description,
            applicants: 0,
            views: 0,
            postedAt:
              (j as any)?.publishedDate?.toDateString?.() ??
              String((j as any)?.publishedDate ?? ""),
            bookmarked: isBookmarked(jobId),
          };

          built.push({ vm, job: { ...j, id: jobId }, company });
        }

        setRows(built);
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.warn(err);
        setError("Failed to load jobs.");
        setLoading(false);
      }
    );

    return () => unsub();
  }, [db, isBookmarked]);

  // ---------- real-time notifications (only after notifySince) ----------
  const notifListenerAttached = useRef(false);
  useEffect(() => {
    if (!uid || !notifyNewJobs || !notifySince || notifListenerAttached.current)
      return;

    // فقط جاب‌هایی که پس از notifySince منتشر شده‌اند
    const qNew = query(
      collection(db, "jobs").withConverter(jobConverter),
      where("publishedDate", ">", notifySince),
      orderBy("publishedDate", "asc")
    );

    const unsub = onSnapshot(qNew, async (snap) => {
      for (const change of snap.docChanges()) {
        if (change.type !== "added") continue;

        const jobId = change.doc.id; // ✅ id درست
        const j = change.doc.data() as Job;

        try {
          // هر شغل فقط یکبار نوتیف می‌گیرد (id = jobId)
          await setDoc(
            doc(db, "users", uid, "notifications", jobId),
            {
              type: "job_added",
              jobId,
              companyId: j.companyId ?? null,
              title: j.role ?? "New Job",
              createdAt: serverTimestamp(),
              read: false,
            },
            { merge: true }
          );
          Alert.alert("New job posted", j.role ?? "New job");
        } catch (e) {
          console.warn("failed to create notification", e);
        }
      }
    });

    notifListenerAttached.current = true;
    return () => {
      notifListenerAttached.current = false;
      unsub();
    };
  }, [db, uid, notifyNewJobs, notifySince]);

  // ---------- UI helpers ----------
  const PROMO_IMAGES = [
    require("../../../assets/images/banner_1.png"),
    require("../../../assets/images/banner_2.png"),
  ];
  const iconSize = rs.ms(22);
  const columns = rs.isTablet ? 6 : 4;
  const itemWidth = `${100 / columns}%`;

  const handleCategoryPress = (c: Category) => {
    if (c.key === "more") navigation.navigate("Categories");
    else navigation.navigate("CategoryJobs", { key: c.key, label: c.label });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: t.backgroundColor }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.helloText}>Hello,</Text>
            <Text style={styles.nameText}>{displayName || "Friend"}</Text>
          </View>

          <Pressable
            style={styles.bellBtn}
            onPress={() => navigation.navigate("Notifications")}
          >
            <Ionicons
              name="notifications-outline"
              size={rs.ms(24)}
              color={t.textColor}
            />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {/* Promo carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.promoScroll}
          contentContainerStyle={{ paddingRight: rs.ms(16) }}
        >
          {PROMO_IMAGES.map((src, i) => (
            <PromoImageCard key={i} source={src} />
          ))}
        </ScrollView>

        {/* Categories */}
        <View style={styles.categoriesWrap}>
          {categories.map((c) => (
            <View
              key={c.key}
              style={{ width: itemWidth, alignItems: "center" }}
            >
              <CategoryItem
                label={c.label}
                icon={
                  <CategoryIcon
                    icon={c.icon}
                    size={iconSize}
                    color={t.primaryColor}
                  />
                }
                onPress={() => handleCategoryPress(c)}
              />
            </View>
          ))}
        </View>

        {/* Recently Job Opening */}
        <SectionHeader
          title="Recently Job Opening"
          onPress={() => navigation.navigate("RecentJobs")}
        />

        {loading ? (
          <View style={{ paddingVertical: rs.ms(24) }}>
            <ActivityIndicator color={t.primaryColor} />
          </View>
        ) : error ? (
          <Text
            style={{
              color: t.dangerColor ?? "#f55",
              marginHorizontal: rs.ms(16),
              marginBottom: rs.ms(8),
            }}
          >
            {error}
          </Text>
        ) : null}

        <View style={styles.jobsWrap}>
          {rows.map(({ vm, job }) => (
            <JobCard
              key={vm.id}
              job={{ ...vm, bookmarked: isBookmarked(vm.id) }}
              onPress={() =>
                navigation.navigate("JobDetail", {
                  jobId: job.id,
                  companyId:
                    job.companyId != null ? String(job.companyId) : null,
                })
              }
              onBookmark={(id, next) => toggleBookmark(id, next)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: rs.ms(24) },
    header: {
      paddingHorizontal: rs.ms(16),
      paddingTop: rs.ms(8),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    helloText: {
      color: t.subtextColor,
      fontSize: t.h5,
      marginBottom: rs.ms(4),
    },
    nameText: { color: t.textColor, fontSize: rs.ms(24), fontWeight: t.bold },
    bellBtn: { position: "relative" },
    badge: {
      position: "absolute",
      top: -rs.ms(6),
      right: -rs.ms(6),
      minWidth: rs.ms(18),
      height: rs.ms(18),
      paddingHorizontal: rs.ms(4),
      borderRadius: rs.ms(9),
      backgroundColor: t.primaryColor,
      alignItems: "center",
      justifyContent: "center",
    },
    badgeText: { color: "#fff", fontSize: rs.ms(10), fontWeight: t.bold },
    promoScroll: { paddingHorizontal: rs.ms(16), marginTop: rs.ms(16) },
    categoriesWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: rs.ms(16),
      marginTop: rs.ms(10),
    },
    jobsWrap: { marginTop: rs.ms(4) },
  });
