// src/screens/search/SearchScreen.tsx
import React, { useMemo, useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Switch } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useDesign } from "../../design/DesignProvider";
import { rs } from "../../utils/responsive";
import JobCard from "../../components/JobCard";
import type { Job } from "../../types";

import SearchBar from "../../components/SearchBar";
import BottomButton from "../../components/BottomButton";

const ALL_CATEGORIES = [
  "Design",
  "Developer",
  "Network",
  "Quality",
  "Marketing",
  "Secretary",
  "Analysis",
  "Finance",
];

const ALL_TYPES = ["Full Time", "Part Time", "Remote", "Contract"] as const;
type JobType = (typeof ALL_TYPES)[number];

const SearchScreen: React.FC = () => {
  const { theme: t } = useDesign();
  const styles = useMemo(() => makeStyles(t), [t]);
  const insets = useSafeAreaInsets();

  // ----- state -----
  const [q, setQ] = useState<string>("");               // ← no default text
  const [advanced, setAdvanced] = useState<boolean>(true);
  const [openCat, setOpenCat] = useState<boolean>(false);
  const [category, setCategory] = useState<string | null>(null);
  const [types, setTypes] = useState<Set<JobType>>(new Set()); // start with none selected
  const [sortBy, setSortBy] = useState<"Newest" | "Oldest" | "Popular">("Newest");

  // ----- mock data -----
  const jobs: Job[] = useMemo(
    () => [
      {
        id: "s1",
        company: "Slack",
        companyLogoText: "S",
        title: "Flutter Developer",
        city: "San Francisco",
        country: "USA",
        type: "Remote",
        summary: "Develop and maintain high-quality mobile apps using Flutter and Dart.",
        applicants: 30,
        views: 920,
        postedAt: "July 27, 2025",
        bookmarked: false,
      },
      {
        id: "s2",
        company: "Acme",
        companyLogoText: "A",
        title: "Senior iOS Engineer",
        city: "Berlin",
        country: "Germany",
        type: "Full Time",
        summary: "Work on scalable Swift codebases and CI/CD for mobile.",
        applicants: 52,
        views: 1100,
        postedAt: "July 25, 2025",
        bookmarked: true,
      },
      {
        id: "s3",
        company: "Globex",
        companyLogoText: "G",
        title: "Part-time QA Engineer",
        city: "Remote",
        country: "",
        type: "Part Time",
        summary: "Manual & automated testing for web/mobile.",
        applicants: 14,
        views: 330,
        postedAt: "July 20, 2025",
        bookmarked: false,
      },
    ],
    []
  );

  // ----- filtering -----
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return []; // ← show nothing until user types

    let arr = jobs.filter((j) => j.title.toLowerCase().includes(term));

    if (advanced && types.size) {
      arr = arr.filter((j) => types.has(j.type as JobType));
    }
    if (category) {
      // if you later map categories to job data, filter here
    }

    if (sortBy === "Popular") arr = arr.slice().sort((a, b) => b.views - a.views);
    else if (sortBy === "Oldest") arr = arr.slice().reverse();

    return arr;
  }, [jobs, q, advanced, category, types, sortBy]);

  const toggleType = (val: JobType) => {
    const next = new Set(types);
    next.has(val) ? next.delete(val) : next.add(val);
    setTypes(next);
  };

  const bottomPad = rs.ms(24) + (rs.ms(50) + insets.bottom) + (advanced ? rs.ms(56) : 0);

  return (
    <SafeAreaView style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Search</Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: bottomPad }}
      >
        {/* Search input */}
        <SearchBar
          value={q}
          onChangeText={setQ}
          placeholder="Search jobs, titles, companies…"   // ← placeholder only
        />

        {/* Advanced row */}
        <View style={styles.advRow}>
          <Text style={styles.sectionTitle}>Advanced Search</Text>
          <Switch
            value={advanced}
            onValueChange={setAdvanced}
            thumbColor="#fff"
            trackColor={{ false: t.chipColor, true: t.appColor || t.primaryColor }}
          />
        </View>

        {advanced && (
          <>
            {/* Category */}
            <Text style={styles.label}>Category</Text>
            <Pressable onPress={() => setOpenCat((p) => !p)} style={styles.selectRow}>
              <Text
                style={[styles.selectText, !category && { color: t.subtextColor }]}
                numberOfLines={1}
              >
                {category || "Select Category"}
              </Text>
              <Ionicons
                name={openCat ? "chevron-up" : "chevron-down"}
                size={rs.ms(18)}
                color={t.textColor}
              />
            </Pressable>
            {openCat && (
              <View style={styles.dropdown}>
                {ALL_CATEGORIES.map((c) => (
                  <Pressable
                    key={c}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setCategory(c);
                      setOpenCat(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        category === c && { color: t.primaryColor, fontWeight: t.bold },
                      ]}
                    >
                      {c}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Job Type */}
            <Text style={[styles.label, { marginTop: rs.ms(16) }]}>Job Type</Text>
            <View style={styles.chipsRow}>
              {ALL_TYPES.map((tp) => {
                const active = types.has(tp);
                return (
                  <Pressable
                    key={tp}
                    onPress={() => toggleType(tp)}
                    style={[
                      styles.chip,
                      active && {
                        backgroundColor: t.chipColor,
                        borderColor: t.appColor || t.primaryColor,
                      },
                    ]}
                  >
                    {active && (
                      <Ionicons
                        name="checkmark"
                        size={rs.ms(14)}
                        color={t.appColor || t.primaryColor}
                        style={{ marginRight: rs.ms(6) }}
                      />
                    )}
                    <Text
                      style={[
                        styles.chipText,
                        active && { color: t.appColor || t.primaryColor, fontWeight: t.semiBold },
                      ]}
                    >
                      {tp}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Sort By */}
            <Text style={[styles.label, { marginTop: rs.ms(16) }]}>Sort By</Text>
            <Pressable
              onPress={() =>
                setSortBy((s) => (s === "Newest" ? "Popular" : s === "Popular" ? "Oldest" : "Newest"))
              }
              style={styles.selectRow}
            >
              <Text style={styles.selectText}>{sortBy}</Text>
              <Ionicons name="chevron-down" size={rs.ms(18)} color={t.textColor} />
            </Pressable>

            <View style={styles.divider} />
          </>
        )}

        {/* Results */}
        <View style={{ paddingHorizontal: 0 }}>
          {filtered.map((j) => (
            <JobCard key={j.id} job={j} onPress={() => {}} onBookmark={() => {}} />
          ))}
        </View>
      </ScrollView>

      {/* Bottom floating button (only when advanced is ON) */}
      <BottomButton
        visible={advanced}
        label="Apply Filter"
        onPress={() => {
          // TODO: hook to Firestore search later
        }}
      />
    </SafeAreaView>
  );
};

export default SearchScreen;

/* ---------------- styles ---------------- */
type Themed = ReturnType<typeof useDesign>["theme"];
const makeStyles = (t: Themed) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.backgroundColor },
    header: {
      alignItems: "center",
      paddingTop: rs.ms(4),
      paddingBottom: rs.ms(6),
      backgroundColor: t.backgroundColor,
    },
    title: { color: t.textColor, fontSize: t.h4, fontWeight: t.bold },

    advRow: {
      marginTop: rs.ms(18),
      marginHorizontal: rs.ms(16),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionTitle: { color: t.textColor, fontSize: t.h5, fontWeight: t.bold },

    label: {
      marginTop: rs.ms(12),
      marginHorizontal: rs.ms(16),
      color: t.textColor,
      fontSize: t.h6,
      fontWeight: t.semiBold,
    },
    selectRow: {
      marginTop: rs.ms(6),
      marginHorizontal: rs.ms(16),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.dividerColor,
      height: rs.ms(44),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    selectText: { color: t.textColor, fontSize: t.h6 },

    dropdown: {
      marginHorizontal: rs.ms(16),
      borderRadius: rs.ms(10),
      backgroundColor: t.cardColor,
      borderWidth: 1,
      borderColor: t.dividerColor,
      overflow: "hidden",
    },
    dropdownItem: {
      paddingVertical: rs.ms(10),
      paddingHorizontal: rs.ms(12),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.dividerColor,
    },
    dropdownText: { color: t.textColor, fontSize: t.h6 },

    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginHorizontal: rs.ms(16),
      marginTop: rs.ms(8),
      gap: rs.ms(10),
    },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: t.dividerColor,
      borderRadius: rs.ms(12),
      paddingVertical: rs.ms(10),
      paddingHorizontal: rs.ms(14),
      backgroundColor: t.cardColor,
    },
    chipText: { color: t.textColor, fontSize: t.h6 },

    divider: {
      marginTop: rs.ms(12),
      marginHorizontal: rs.ms(16),
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.dividerColor,
    },
  });
