import React, { useMemo, useState, useEffect } from "react";
import { View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useDesign } from "../../design/DesignProvider";
import { rs } from "../../utils/responsive";
import CompanyHeader from "../../components/CompanyHeader";
import InfoBlock from "../../components/InfoBlock";
import JobCard, { JobCardVM } from "../../components/JobCard";

import { CompaniesStackParamList } from "../../navigation/RootNavigator";
import { Company } from "../../models/company/Company";
import { companyConverter } from "../../models/company/company.converter";
import { Job } from "../../models/job/Job";
import { jobConverter } from "../../models/job/job.converter";

import {
  doc,
  getFirestore,
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { app } from "../../lib/firebase";
import { useBookmarks } from "../../hooks/useBookmarks";

type Nav = NativeStackNavigationProp<CompaniesStackParamList>;
type R = RouteProp<CompaniesStackParamList, "CompanyDetail">;

type Row = { vm: JobCardVM; job: Job };

const CompanyDetailScreen: React.FC = () => {
  const { theme: t } = useDesign();
  const styles = useMemo(() => makeStyles(t), [t]);
  const nav = useNavigation<Nav>();
  const route = useRoute<R>();

  const { key } = route.params;
  const db = getFirestore(app);

  const [company, setCompany] = useState<Company | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<"about" | "jobs">("about");
  const [loading, setLoading] = useState(true);
  const [jobsLoading, setJobsLoading] = useState(true);

  const { isBookmarked, toggleBookmark } = useBookmarks();

  // company
  useEffect(() => {
    setLoading(true);
    const ref = doc(db, "companies", key).withConverter(companyConverter);
    const unsub = onSnapshot(ref, (snap) => {
      setCompany(snap.exists() ? (snap.data() as Company) : null);
      setLoading(false);
    });
    return () => unsub();
  }, [db, key]);

  // jobs of this company
  useEffect(() => {
    setJobsLoading(true);
    const q = query(
      collection(db, "jobs").withConverter(jobConverter),
      where("companyId", "==", Number(key)),
      orderBy("publishedDate", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const next: Row[] = snap.docs.map((d) => {
        const j = d.data() as Job;
        const [city = "", country = ""] = (j.location ?? "").split(",").map((s) => s.trim());
        const companyName = company?.name ?? "Unknown";
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
        return { vm, job: j };
      });
      setRows(next);
      setJobsLoading(false);
    });
    return () => unsub();
  }, [db, key, company, isBookmarked]);

  if (loading || !company) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ padding: rs.ms(16) }}>
          {loading ? (
            <ActivityIndicator color={t.primaryColor} />
          ) : (
            <Text style={{ color: t.textColor }}>Company not found.</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable
          style={styles.backBtn}
          onPress={() => (nav.canGoBack() ? nav.goBack() : null)}
          hitSlop={10}
        >
          <Ionicons name="arrow-back" size={rs.ms(22)} color={t.textColor} />
        </Pressable>
        <Text style={styles.title}>{company.name}</Text>
        <View style={{ width: rs.ms(26) }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: rs.ms(24) }}>
        {/* Company header */}
        <CompanyHeader
          name={company.name}
          industry={company.specialization}
          location={company.location}
          logoUri={company.logoUrl}
          fallbackInitial={company.name?.[0]}
        />

        {/* Tabs */}
        <View style={styles.tabsRow}>
          <Pressable onPress={() => setTab("about")} style={styles.tabBtn}>
            <Text style={[styles.tabText, tab === "about" && styles.tabActiveText]}>About</Text>
          </Pressable>
          <Pressable onPress={() => setTab("jobs")} style={styles.tabBtn}>
            <Text style={[styles.tabText, tab === "jobs" && styles.tabActiveText]}>Jobs</Text>
          </Pressable>
        </View>
        <View style={styles.tabIndicatorWrap}>
          <View
            style={[
              styles.tabIndicator,
              { transform: [{ translateX: tab === "about" ? 0 : ("100%" as any) }] },
            ]}
          />
        </View>

        {/* Content */}
        {tab === "about" ? (
          <View style={styles.aboutWrap}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>{company.about || "-"}</Text>

            <Text style={[styles.sectionTitle, { marginTop: rs.ms(18) }]}>More Information</Text>
            <InfoBlock label="Address" value={company.location} />
            <InfoBlock label="Facility" value={company.facility} />
            <InfoBlock label="Company Size" value={company.size} />
            <InfoBlock label="Specialization" value={company.specialization} />
          </View>
        ) : (
          <View style={{ marginTop: rs.ms(8) }}>
            {jobsLoading ? (
              <ActivityIndicator style={{ marginTop: rs.ms(12) }} color={t.primaryColor} />
            ) : rows.length === 0 ? (
              <Text style={{ color: t.subtextColor, marginHorizontal: rs.ms(16) }}>
                No jobs from this company.
              </Text>
            ) : null}

            {rows.map(({ vm, job }) => (
              <JobCard
                key={vm.id}
                job={{ ...vm, bookmarked: isBookmarked(vm.id) }}
                onPress={() => nav.navigate("JobDetail", { job, company })}
                onBookmark={(id, next) => toggleBookmark(id, next)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default CompanyDetailScreen;

/* ---------------- styles ---------------- */
type Themed = ReturnType<typeof useDesign>["theme"];
const makeStyles = (t: Themed) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.backgroundColor },

    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: rs.ms(16),
      paddingTop: rs.ms(4),
      paddingBottom: rs.ms(6),
    },
    backBtn: { padding: rs.ms(4) },
    title: { color: t.textColor, fontSize: t.h4, fontWeight: t.bold },

    tabsRow: {
      marginTop: rs.ms(12),
      paddingHorizontal: rs.ms(16),
      flexDirection: "row",
      justifyContent: "space-between",
    },
    tabBtn: { paddingVertical: rs.ms(6), flex: 1, alignItems: "center" },
    tabText: { color: t.subtextColor, fontSize: t.h5, fontWeight: t.semiBold },
    tabActiveText: { color: t.appColor || t.primaryColor },

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

    aboutWrap: { paddingHorizontal: rs.ms(16), marginTop: rs.ms(14) },
    sectionTitle: { color: t.textColor, fontSize: t.h4, fontWeight: t.bold },
    aboutText: { color: t.subtextColor, fontSize: t.h6, lineHeight: rs.ms(22), marginTop: rs.ms(8) },
  });
