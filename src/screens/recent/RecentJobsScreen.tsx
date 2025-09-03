// src/screens/jobs/RecentJobsScreen.tsx
import React, { useMemo, useEffect, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useDesign } from "../../design/DesignProvider";
import { rs } from "../../utils/responsive";
import JobCard from "../../components/JobCard";
import type { HomeStackParamList } from "../../navigation/RootNavigator";

import { Job } from "../../models/job/Job";
import { jobConverter } from "../../models/job/job.converter";
import { Company } from "../../models/company/Company";
import { companyConverter } from "../../models/company/company.converter";

import {
  collection,
  getFirestore,
  onSnapshot,
  orderBy,
  limit,
  query,
  doc,
  getDoc,
} from "firebase/firestore";
import { app } from "../../lib/firebase"; 

type JobCardVM = {
  id: string;
  company: string;
  companyLogoText: string;
  title: string;
  city: string;
  country: string;
  type: string;
  summary: string;
  applicants: number;
  views: number;
  postedAt: string;
  bookmarked: boolean;
};

type Row = {
  vm: JobCardVM;
  job: Job;
  company?: Company;
};

const RecentJobsScreen: React.FC = () => {
  const { theme: t } = useDesign();
  const nav = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const styles = useMemo(() => makeStyles(t), [t]);

  const db = getFirestore(app);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, "jobs").withConverter(jobConverter),
      orderBy("publishedDate", "desc"),
      limit(20)
    );

    const unsub = onSnapshot(q, async (snap) => {
      const next: Row[] = [];

      for (const d of snap.docs) {
        const j = d.data() as Job;

        let company: Company | undefined;
        let companyName = "Unknown";
        if (j.companyId != null) {
          const cRef = doc(db, "companies", String(j.companyId)).withConverter(companyConverter);
          const cSnap = await getDoc(cRef);
          if (cSnap.exists()) {
            company = cSnap.data() as Company;
            companyName = company.name;
          }
        }

        const loc = j.location ?? "";
        const [city = "", country = ""] = loc.split(",").map((s) => s.trim());

        const vm: JobCardVM = {
          id: j.id,
          company: companyName,
          companyLogoText: companyName.charAt(0),
          title: j.role,
          city,
          country,
          type: j.jobType,
          summary: j.description,
          applicants: 0,
          views: 0,
          postedAt: j.publishedDate.toDateString(),
          bookmarked: false,
        };

        next.push({ vm, job: j, company });
      }

      setRows(next);
    });

    return () => unsub();
  }, [db]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs.ms(22)} color={t.textColor} />
        </Pressable>
        <Text style={styles.title}>Recently Job Opening</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Body */}
      <ScrollView
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.count}>{rows.length} Jobs Found</Text>

        {rows.map(({ vm, job, company }) => (
          <JobCard
            key={vm.id}
            job={vm} 
            onPress={() => nav.navigate("JobDetail", { job, company })} 
            onBookmark={() => {}}
          />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

export default RecentJobsScreen;

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
    listContainer: { paddingHorizontal: 0, paddingBottom: rs.ms(24) },
    count: {
      marginBottom: rs.ms(12),
      marginLeft: rs.ms(16),
      color: t.textColor,
      fontSize: t.h6,
      fontWeight: t.semiBold,
    },
  });
