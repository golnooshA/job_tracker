// src/screens/jobs/JobDetailScreen.tsx
import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  LayoutChangeEvent,
  Image,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

import { useDesign } from "../../design/DesignProvider";
import { rs } from "../../utils/responsive";

import { Job } from "../../models/job/Job";
import { Company } from "../../models/company/Company";
import { companyConverter } from "../../models/company/company.converter";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { app } from "../../lib/firebase";

// activity services (writes so Activity tabs get data)
import {
  applyToJob,
  bookmarkJob,
  unbookmarkJob,
  isBookmarked,
  isApplied,
} from "../../services/activity";

type JobDetailParamList = {
  JobDetail: {
    job: Job;
    company?: Company;
  };
};

const JobDetailScreen: React.FC = () => {
  const { theme: t } = useDesign();
  const styles = useMemo(() => makeStyles(t), [t]);
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { params } = useRoute<RouteProp<JobDetailParamList, "JobDetail">>();

  // ----- guards -----
  const job = params?.job;
  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{ color: t.textColor, padding: rs.ms(16) }}>Job not found.</Text>
      </SafeAreaView>
    );
  }

  // prevent setState on unmounted
  const alive = useRef(true);
  useEffect(() => {
    return () => {
      alive.current = false;
    };
  }, []);

  // ----- company (from route or fetch by id) -----
  const [company, setCompany] = useState<Company | undefined>(params?.company);
  useEffect(() => {
    (async () => {
      if (!company && job.companyId != null) {
        try {
          const db = getFirestore(app);
          const ref = doc(db, "companies", String(job.companyId)).withConverter(companyConverter);
          const snap = await getDoc(ref);
          if (alive.current && snap.exists()) setCompany(snap.data() as Company);
        } catch {
          // ignore
        }
      }
    })();
  }, [company, job.companyId]);

  // ----- derived -----
  const { city, country } = useMemo(() => {
    const [c1 = "", c2 = ""] = (job.location ?? "").split(",").map((s) => s.trim());
    return { city: c1, country: c2 };
  }, [job.location]);

  const [tab, setTab] = useState<"job" | "company">("job");
  const [applied, setApplied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [tabBarW, setTabBarW] = useState(0);
  const onTabBarLayout = (e: LayoutChangeEvent) => setTabBarW(e.nativeEvent.layout.width);

  // pre-check states so Activity tabs reflect current status
  useEffect(() => {
    (async () => {
      try {
        const [bk, ap] = await Promise.all([isBookmarked(job.id), isApplied(job.id)]);
        if (!alive.current) return;
        setBookmarked(!!bk);
        setApplied(!!ap);
      } catch {
        // ignore
      }
    })();
  }, [job.id]);

  // bottom safe offset
  const bottomOffset = rs.ms(50) + insets.bottom + rs.ms(12);

  const applyUrl = job.jobLink || "";
  const openApply = useCallback(async () => {
    try {
      await applyToJob(job.id); // write to Firestore so Activity > Applied shows it
      if (alive.current) setApplied(true);
    } catch {
      // optionally show a toast/snackbar
    }
    if (applyUrl) {
      nav.navigate("WebView", { title: job.role, url: applyUrl });
    }
  }, [applyUrl, job.id, job.role, nav]);

  const toggleBookmark = useCallback(async () => {
    try {
      if (bookmarked) {
        await unbookmarkJob(job.id);
        if (alive.current) setBookmarked(false);
      } else {
        await bookmarkJob(job.id);
        if (alive.current) setBookmarked(true);
      }
    } catch {
      // optionally show a toast/snackbar
    }
  }, [bookmarked, job.id]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => (nav.canGoBack() ? nav.goBack() : null)}
          hitSlop={10}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={rs.ms(22)} color={t.textColor} />
        </Pressable>
        <Text style={[styles.headerTitle, { opacity: 0 }]}>hidden</Text>
        <View style={{ width: rs.ms(26) }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomOffset + rs.ms(64) }}
      >
        {/* Hero */}
        <View style={styles.hero}>
          {company?.logoUrl ? (
            <Image source={{ uri: company.logoUrl }} style={styles.logoImg} resizeMode="cover" />
          ) : (
            <View style={styles.logoCircle}>
              <Text style={styles.logoInitial}>{(company?.name?.[0] ?? "J").toUpperCase()}</Text>
            </View>
          )}

          <Text style={styles.jobTitle}>{job.role}</Text>

          <View style={styles.metaRow}>
            <Text style={styles.companyText}>{company?.name ?? "Unknown"}</Text>
            <Text style={styles.dot}> • </Text>
            <Text style={[styles.typeText, { color: t.appColor || t.primaryColor }]}>
              {job.jobType}
            </Text>
          </View>

          <View style={[styles.statsRow, { marginTop: rs.ms(10) }]}>
            <View style={styles.statItem}>
              <Ionicons name="location" size={rs.ms(18)} color={t.appColor || t.primaryColor} />
              <Text style={styles.statText}>
                {country ? `${city}, ${country}` : job.location ?? "-"}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsRow} onLayout={onTabBarLayout}>
          <Pressable style={styles.tabBtn} onPress={() => setTab("job")}>
            <Text style={[styles.tabText, tab === "job" && styles.tabTextActive]}>Job Details</Text>
          </Pressable>
          <Pressable style={styles.tabBtn} onPress={() => setTab("company")}>
            <Text style={[styles.tabText, tab === "company" && styles.tabTextActive]}>Company</Text>
          </Pressable>
        </View>
        <View style={styles.tabIndicatorWrap}>
          <View
            style={[
              styles.tabIndicator,
              { transform: [{ translateX: tab === "job" ? 0 : tabBarW / 2 }] },
            ]}
          />
        </View>

        {/* Content */}
        {tab === "job" ? (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.paragraph}>{job.description || "-"}</Text>

            <Text style={[styles.sectionTitle, { marginTop: rs.ms(18) }]}>Skills Needed</Text>
            <View style={{ marginTop: rs.ms(10) }}>
              {Array.isArray(job.skills) && job.skills.length > 0 ? (
                job.skills.map((s) => (
                  <View
                    key={s}
                    style={{ flexDirection: "row", alignItems: "center", marginTop: rs.ms(10) }}
                  >
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>{s}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.bulletText}>No skills provided.</Text>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.sectionWrap}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.paragraph}>
              {company?.about ?? "No company description provided."}
            </Text>

            <Text style={[styles.sectionTitle, { marginTop: rs.ms(18) }]}>
              More Information
            </Text>
            <View style={{ marginTop: rs.ms(8) }}>
              <Text style={styles.bulletText}>
                Industry:{" "}
                <Text style={{ color: t.subtextColor }}>
                  {company?.specialization ?? "-"}
                </Text>
              </Text>
              <Text style={[styles.bulletText, { marginTop: rs.ms(8) }]}>
                Location:{" "}
                <Text style={{ color: t.subtextColor }}>{company?.location ?? "-"}</Text>
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View style={[styles.bottomBar, { bottom: bottomOffset }]}>
        <Pressable
          onPress={openApply}
          disabled={!applyUrl || applied}
          style={[styles.applyBtn, (!applyUrl || applied) && { backgroundColor: t.dividerColor }]}
          accessibilityRole="button"
          accessibilityLabel="Apply to this job"
        >
          <Text style={[styles.applyText, (!applyUrl || applied) && { color: t.subtextColor }]}>
            {applied ? "Applied" : "Apply Now"}
          </Text>
        </Pressable>

        <Pressable
          style={styles.bookmarkBtn}
          onPress={toggleBookmark}
          accessibilityRole="button"
          accessibilityLabel={bookmarked ? "Remove bookmark" : "Save job"}
        >
          <Ionicons
            name={bookmarked ? "bookmark" : "bookmark-outline"}
            size={rs.ms(22)}
            color={t.appColor || t.primaryColor}
          />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default JobDetailScreen;

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
      paddingBottom: rs.ms(6),
    },
    backBtn: { padding: rs.ms(4) },
    headerTitle: {
      color: t.textColor,
      fontSize: t.h5,
      fontWeight: t.bold,
      maxWidth: "70%",
    },

    hero: { alignItems: "center", paddingTop: rs.ms(6), paddingBottom: rs.ms(8) },
    logoImg: {
      width: rs.ms(96),
      height: rs.ms(96),
      borderRadius: rs.ms(48),
      marginBottom: rs.ms(8),
      backgroundColor: t.chipColor,
    },
    logoCircle: {
      width: rs.ms(96),
      height: rs.ms(96),
      borderRadius: rs.ms(48),
      backgroundColor: t.chipColor,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: rs.ms(8),
    },
    logoInitial: { color: t.textColor, fontWeight: t.bold, fontSize: rs.ms(28) },
    jobTitle: { color: t.textColor, fontSize: rs.ms(28), fontWeight: t.bold, textAlign: "center" },
    metaRow: { flexDirection: "row", alignItems: "center", marginTop: rs.ms(6) },
    companyText: { color: t.subtextColor, fontSize: t.h5 },
    dot: { color: t.subtextColor, fontSize: t.h5 },
    typeText: { fontSize: t.h5, fontWeight: t.semiBold },

    statsRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: rs.ms(18),
    },
    statItem: { flexDirection: "row", alignItems: "center" },
    statText: { color: t.textColor, marginLeft: rs.ms(6), fontSize: t.h6 },

    tabsRow: {
      flexDirection: "row",
      justifyContent: "space-around",
      marginTop: rs.ms(12),
      paddingHorizontal: rs.ms(16),
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

    sectionWrap: { paddingHorizontal: rs.ms(16), marginTop: rs.ms(14) },
    sectionTitle: { color: t.textColor, fontSize: t.h4, fontWeight: t.bold },
    paragraph: { color: t.subtextColor, fontSize: t.h6, lineHeight: rs.ms(22), marginTop: rs.ms(8) },
    bullet: {
      width: rs.ms(6),
      height: rs.ms(6),
      borderRadius: rs.ms(3),
      backgroundColor: t.subtextColor,
      marginRight: rs.ms(10),
    },
    bulletText: { color: t.textColor, fontSize: t.h6 },

    bottomBar: {
      position: "absolute",
      left: rs.ms(16),
      right: rs.ms(16),
      flexDirection: "row",
      alignItems: "center",
      gap: rs.ms(10),
    },
    applyBtn: {
      flex: 1,
      height: rs.ms(48),
      borderRadius: rs.ms(14),
      backgroundColor: t.appColor || t.primaryColor,
      alignItems: "center",
      justifyContent: "center",
    },
    applyText: { color: "#fff", fontSize: t.h5, fontWeight: t.bold },
    bookmarkBtn: {
      width: rs.ms(52),
      height: rs.ms(48),
      borderRadius: rs.ms(14),
      backgroundColor: t.cardColor,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: t.dividerColor,
    },
  });
