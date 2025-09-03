import React, { useMemo, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";

import { useDesign } from "../../design/DesignProvider";
import { rs } from "../../utils/responsive";
import JobCard, { JobCardVM } from "../../components/JobCard";
import type { HomeStackParamList } from "../../navigation/RootNavigator";

import { Job } from "../../models/job/Job";
import { jobConverter } from "../../models/job/job.converter";
import { Company } from "../../models/company/Company";
import { companyConverter } from "../../models/company/company.converter";

import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
  getFirestore,
  orderBy,
  Unsubscribe,
} from "firebase/firestore";
import { app } from "../../lib/firebase";
import { useBookmarks } from "../../hooks/useBookmarks";

// map key -> numeric categoryId used in Firestore
const CATEGORY_ID_MAP: Record<string, number> = {
  design: 1,
  developer: 2,
  network: 3,
  quality: 4,
  marketing: 5,
  secretary: 6,
  analysis: 7,
};

type R = RouteProp<HomeStackParamList, "CategoryJobs">;
type Row = { vm: JobCardVM; job: Job; company?: Company };

const CategoryJobsScreen: React.FC = () => {
  const nav = useNavigation();
  const route = useRoute<R>();
  const { key, label } = route.params;

  const { theme: t } = useDesign();
  const styles = useMemo(() => makeStyles(t), [t]);

  const db = getFirestore(app);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // bookmarks (shared)
  const { isBookmarked, toggleBookmark } = useBookmarks();

  useEffect(() => {
    setLoading(true);

    const categoryId = CATEGORY_ID_MAP[key];
    if (categoryId == null) {
      setRows([]);
      setError("Unknown category key.");
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, "jobs").withConverter(jobConverter),
      where("categoryId", "==", categoryId),
      orderBy("publishedDate", "desc")
    );

    const unsub: Unsubscribe = onSnapshot(
      q,
      async (snap) => {
        const companyCache = new Map<string, Company>();
        const next: Row[] = [];

        for (const d of snap.docs) {
          const j = d.data() as Job;

          // fetch & cache company
          let company: Company | undefined;
          if (j.companyId != null) {
            const k = String(j.companyId);
            if (companyCache.has(k)) {
              company = companyCache.get(k);
            } else {
              const cRef = doc(db, "companies", k).withConverter(companyConverter);
              const cSnap = await getDoc(cRef);
              if (cSnap.exists()) {
                company = cSnap.data() as Company;
                companyCache.set(k, company);
              }
            }
          }

          const companyName = company?.name ?? "Unknown";
          const [city = "", country = ""] = (j.location ?? "").split(",").map((s) => s.trim());

          const vm: JobCardVM = {
            id: j.id,
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
            postedAt: j.publishedDate.toDateString(),
            bookmarked: isBookmarked(j.id),
          };

          next.push({ vm, job: j, company });
        }

        setRows(next);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(
          (err as any)?.code === "failed-precondition"
            ? "This query needs a Firestore composite index. Open the console link from your logs to create it, then retry."
            : "Failed to load jobs. Please try again."
        );
        setLoading(false);
      }
    );

    return () => unsub();
  }, [db, key, isBookmarked]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs.ms(22)} color={t.textColor} />
        </Pressable>
        <Text style={styles.title}>{label}</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={{ paddingVertical: rs.ms(24) }}>
            <ActivityIndicator color={t.primaryColor} />
          </View>
        ) : error ? (
          <Text style={[styles.count, { color: t.dangerColor ?? "#f55" }]}>{error}</Text>
        ) : (
          <Text style={styles.count}>{rows.length} Jobs Found</Text>
        )}

        {rows.map(({ vm, job, company }) => (
          <JobCard
            key={vm.id}
            job={{ ...vm, bookmarked: isBookmarked(vm.id) }}
            onPress={() => nav.navigate("JobDetail", { job, company })}
            onBookmark={(id, next) => toggleBookmark(id, next)}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CategoryJobsScreen;

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
      paddingBottom: rs.ms(10),
      backgroundColor: t.backgroundColor,
    },
    backBtn: { padding: rs.ms(4) },
    title: { color: t.textColor, fontSize: t.h4, fontWeight: t.bold },
    headerRightSpacer: { width: rs.ms(26) },
    listContainer: { paddingBottom: rs.ms(24) },
    count: {
      marginBottom: rs.ms(12),
      marginLeft: rs.ms(16),
      color: t.textColor,
      fontSize: t.h6,
      fontWeight: t.semiBold,
    },
  });
