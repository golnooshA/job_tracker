import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  LayoutChangeEvent,
  Image,
  ActivityIndicator,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";

import { useDesign } from "../../design/DesignProvider";
import { rs } from "../../utils/responsive";

import { Job } from "../../models/job/Job";
import { Company } from "../../models/company/Company";
import { companyConverter } from "../../models/company/company.converter";
import { jobConverter } from "../../models/job/job.converter";

import { app } from "../../lib/firebase";
import { getFirestore, doc, getDoc } from "firebase/firestore";

import {
  applyToJob,
  bookmarkJob,
  unbookmarkJob,
  isBookmarked,
  isApplied,
} from "../../services/activity";

type JobDetailParams = { jobId: string; companyId?: string | null };
type ParamList = { JobDetail: JobDetailParams };

const JobDetailScreen: React.FC = () => {
  const { theme: t } = useDesign();
  const s = useMemo(() => makeStyles(t), [t]);
  const nav = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const db = getFirestore(app);

  const { params } = useRoute<RouteProp<ParamList, "JobDetail">>();
  const { jobId, companyId } = params;

  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    []
  );

  const [job, setJob] = useState<Job | null>(null);
  const [company, setCompany] = useState<Company | undefined>();
  const [loading, setLoading] = useState<boolean>(true);
  const [tab, setTab] = useState<"job" | "company">("job");
  const [applied, setApplied] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [tabBarW, setTabBarW] = useState(0);
  const onTabBarLayout = (e: LayoutChangeEvent) =>
    setTabBarW(e.nativeEvent.layout.width);

  // fetch job
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(
          doc(db, "jobs", jobId).withConverter(jobConverter)
        );
        if (!alive.current) return;
        setJob(snap.exists() ? (snap.data() as Job) : null);
      } finally {
        if (alive.current) setLoading(false);
      }
    })();
  }, [db, jobId]);

  // fetch company
  useEffect(() => {
    const cid =
      companyId ?? (job?.companyId != null ? String(job.companyId) : undefined);
    if (!cid || company) return;
    (async () => {
      try {
        const snap = await getDoc(
          doc(db, "companies", cid).withConverter(companyConverter)
        );
        if (alive.current && snap.exists()) setCompany(snap.data() as Company);
      } catch {}
    })();
  }, [db, companyId, job?.companyId, company]);

  // applied/bookmarked flags
  useEffect(() => {
    if (!job?.id) return;
    (async () => {
      try {
        const [bk, ap] = await Promise.all([
          isBookmarked(job.id),
          isApplied(job.id),
        ]);
        if (!alive.current) return;
        setBookmarked(!!bk);
        setApplied(!!ap);
      } catch {}
    })();
  }, [job?.id]);

  const bottomOffset = rs.ms(50) + insets.bottom + rs.ms(12);

  const { city, country } = useMemo(() => {
    const loc = job?.location ?? "";
    const [c1 = "", c2 = ""] = loc.split(",").map((s) => s.trim());
    return { city: c1, country: c2 };
  }, [job?.location]);

  const applyUrl = job?.jobLink || "";

  const openApply = useCallback(async () => {
    if (!job?.id) return;
    try {
      await applyToJob(job.id);
      if (alive.current) setApplied(true);
    } catch {}
    if (applyUrl) nav.navigate("WebView", { title: job.role, url: applyUrl });
  }, [applyUrl, job?.id, job?.role, nav]);

  const toggleBookmark = useCallback(async () => {
    if (!job?.id) return;
    try {
      if (bookmarked) {
        await unbookmarkJob(job.id);
        if (alive.current) setBookmarked(false);
      } else {
        await bookmarkJob(job.id);
        if (alive.current) setBookmarked(true);
      }
    } catch {}
  }, [bookmarked, job?.id]);

  if (loading) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator
          style={{ marginTop: rs.ms(24) }}
          color={t.primaryColor}
        />
      </SafeAreaView>
    );
  }
  if (!job) {
    return (
      <SafeAreaView style={s.container}>
        <View style={{ padding: rs.ms(16) }}>
          <Text style={{ color: t.textColor }}>Job not found.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Pressable
          onPress={() => (nav.canGoBack() ? nav.goBack() : null)}
          hitSlop={10}
          style={s.backBtn}
        >
          <Ionicons name="arrow-back" size={rs.ms(22)} color={t.textColor} />
        </Pressable>
        <Text style={[s.headerTitle, { opacity: 0 }]}>hidden</Text>
        <View style={{ width: rs.ms(26) }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomOffset + rs.ms(64) }}
      >
        {/* Hero */}
        <View style={s.hero}>
          {company?.logoUrl ? (
            <Image
              source={{ uri: company.logoUrl }}
              style={s.logoImg}
              resizeMode="cover"
            />
          ) : (
            <View style={s.logoCircle}>
              <Text style={s.logoInitial}>
                {(company?.name?.[0] ?? "J").toUpperCase()}
              </Text>
            </View>
          )}

          <Text style={s.jobTitle}>{job.role}</Text>

          <View style={s.metaRow}>
            <Text style={s.companyText}>{company?.name ?? "Unknown"}</Text>
            <Text style={s.dot}> • </Text>
            <Text style={[s.typeText, { color: t.appColor || t.primaryColor }]}>
              {job.jobType}
            </Text>
          </View>

          <View style={[s.statsRow, { marginTop: rs.ms(10) }]}>
            <View style={s.statItem}>
              <Ionicons
                name="location"
                size={rs.ms(18)}
                color={t.appColor || t.primaryColor}
              />
              <Text style={s.statText}>
                {country ? `${city}, ${country}` : job.location ?? "-"}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View
          style={s.tabsRow}
          onLayout={(e: LayoutChangeEvent) =>
            setTabBarW(e.nativeEvent.layout.width)
          }
        >
          <Pressable style={s.tabBtn} onPress={() => setTab("job")}>
            <Text style={[s.tabText, tab === "job" && s.tabTextActive]}>
              Job Details
            </Text>
          </Pressable>
          <Pressable style={s.tabBtn} onPress={() => setTab("company")}>
            <Text style={[s.tabText, tab === "company" && s.tabTextActive]}>
              Company
            </Text>
          </Pressable>
        </View>
        <View style={s.tabIndicatorWrap}>
          <View
            style={[
              s.tabIndicator,
              { transform: [{ translateX: tab === "job" ? 0 : tabBarW / 2 }] },
            ]}
          />
        </View>

        {/* Content */}
        {tab === "job" ? (
          <View style={s.sectionWrap}>
            <Text style={s.sectionTitle}>Description</Text>
            <Text style={s.paragraph}>{job.description || "-"}</Text>

            <Text style={[s.sectionTitle, { marginTop: rs.ms(18) }]}>
              Skills Needed
            </Text>
            <View style={{ marginTop: rs.ms(10) }}>
              {Array.isArray(job.skills) && job.skills.length > 0 ? (
                job.skills.map((sk) => (
                  <View
                    key={sk}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: rs.ms(10),
                    }}
                  >
                    <View style={s.bullet} />
                    <Text style={s.bulletText}>{sk}</Text>
                  </View>
                ))
              ) : (
                <Text style={s.bulletText}>No skills provided.</Text>
              )}
            </View>
          </View>
        ) : (
          <View style={s.sectionWrap}>
            <Text style={s.sectionTitle}>About</Text>
            <Text style={s.paragraph}>
              {company?.about ?? "No company description provided."}
            </Text>

            <Text style={[s.sectionTitle, { marginTop: rs.ms(18) }]}>
              More Information
            </Text>
            <View style={{ marginTop: rs.ms(8) }}>
              <Text style={s.bulletText}>
                Industry:{" "}
                <Text style={{ color: t.subtextColor }}>
                  {company?.specialization ?? "-"}
                </Text>
              </Text>
              <Text style={[s.bulletText, { marginTop: rs.ms(8) }]}>
                Location:{" "}
                <Text style={{ color: t.subtextColor }}>
                  {company?.location ?? "-"}
                </Text>
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom actions */}
      <View style={[s.bottomBar, { bottom: bottomOffset }]}>
        <Pressable
          onPress={openApply}
          disabled={!applyUrl || applied}
          style={[
            s.applyBtn,
            (!applyUrl || applied) && { backgroundColor: t.dividerColor },
          ]}
          accessibilityRole="button"
        >
          <Text
            style={[
              s.applyText,
              (!applyUrl || applied) && { color: t.subtextColor },
            ]}
          >
            {applied ? "Applied" : "Apply Now"}
          </Text>
        </Pressable>

        <Pressable
          style={s.bookmarkBtn}
          onPress={toggleBookmark}
          accessibilityRole="button"
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

    hero: {
      alignItems: "center",
      paddingTop: rs.ms(6),
      paddingBottom: rs.ms(8),
    },
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
    logoInitial: {
      color: t.textColor,
      fontWeight: t.bold,
      fontSize: rs.ms(28),
    },
    jobTitle: {
      color: t.textColor,
      fontSize: rs.ms(28),
      fontWeight: t.bold,
      textAlign: "center",
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: rs.ms(6),
    },
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
    tabIndicator: {
      width: "50%",
      height: rs.ms(2),
      backgroundColor: t.appColor || t.primaryColor,
    },

    sectionWrap: { paddingHorizontal: rs.ms(16), marginTop: rs.ms(14) },
    sectionTitle: { color: t.textColor, fontSize: t.h4, fontWeight: t.bold },
    paragraph: {
      color: t.subtextColor,
      fontSize: t.h6,
      lineHeight: rs.ms(22),
      marginTop: rs.ms(8),
    },
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
