import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from "react-native";
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
} from "firebase/firestore";
import { app } from "../../lib/firebase";
import { useBookmarks } from "../../hooks/useBookmarks";

type Row = { vm: JobCardVM; job: Job; company?: Company };

const HomeScreen: React.FC = () => {
  const { theme: t } = useDesign();
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const styles = useMemo(() => makeStyles(t), [t]);

  const db = getFirestore(app);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isBookmarked, toggleBookmark } = useBookmarks();

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, "jobs").withConverter(jobConverter),
      orderBy("publishedDate", "desc"),
      limit(10)
    );

    const unsub = onSnapshot(
      q,
      async (snap) => {
        const companyCache = new Map<string, Company>();
        const built: Row[] = [];

        for (const d of snap.docs) {
          const j = d.data() as Job;

          // fetch company (with cache)
          let company: Company | undefined;
          if (j.companyId != null) {
            const key = String(j.companyId);
            if (companyCache.has(key)) {
              company = companyCache.get(key);
            } else {
              const cRef = doc(db, "companies", key).withConverter(companyConverter);
              const cSnap = await getDoc(cRef);
              if (cSnap.exists()) {
                company = cSnap.data() as Company;
                companyCache.set(key, company);
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

          built.push({ vm, job: j, company });
        }

        setRows(built);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        setError("Failed to load jobs.");
        console.warn(err);
      }
    );

    return () => unsub();
  }, [db, isBookmarked]);

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
    <SafeAreaView style={[styles.container, { backgroundColor: t.backgroundColor }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.helloText}>Hello,</Text>
            <Text style={styles.nameText}>Jack Fisher</Text>
          </View>
          <Pressable style={styles.bellBtn} onPress={() => {}}>
            <Ionicons name="notifications-outline" size={rs.ms(24)} color={t.textColor} />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>1</Text>
            </View>
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
            <View key={c.key} style={{ width: itemWidth, alignItems: "center" }}>
              <CategoryItem
                label={c.label}
                icon={<CategoryIcon icon={c.icon} size={iconSize} color={t.primaryColor} />}
                onPress={() => handleCategoryPress(c)}
              />
            </View>
          ))}
        </View>

        {/* Recently Job Opening */}
        <SectionHeader title="Recently Job Opening" onPress={() => navigation.navigate("RecentJobs")} />

        {loading ? (
          <View style={{ paddingVertical: rs.ms(24) }}>
            <ActivityIndicator color={t.primaryColor} />
          </View>
        ) : error ? (
          <Text style={{ color: t.dangerColor ?? "#f55", marginHorizontal: rs.ms(16), marginBottom: rs.ms(8) }}>
            {error}
          </Text>
        ) : null}

        <View style={styles.jobsWrap}>
          {rows.map(({ vm, job, company }) => (
            <JobCard
              key={vm.id}
              job={{ ...vm, bookmarked: isBookmarked(vm.id) }}
              onPress={() => navigation.navigate("JobDetail", { job, company })}
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
    helloText: { color: t.subtextColor, fontSize: t.h5, marginBottom: rs.ms(4) },
    nameText: { color: t.textColor, fontSize: rs.ms(24), fontWeight: t.bold },
    bellBtn: { position: "relative" },
    badge: {
      position: "absolute",
      top: -rs.ms(6),
      right: -rs.ms(6),
      width: rs.ms(18),
      height: rs.ms(18),
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
