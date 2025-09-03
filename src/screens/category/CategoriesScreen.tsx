// src/screens/categories/CategoriesScreen.tsx
import React, { useMemo } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useDesign } from "../../design/DesignProvider";
import { rs } from "../../utils/responsive";
import CategoryItem from "../../components/CategoryItem";
import type { HomeStackParamList } from "../../types";

import { categories } from "../../models/category/categories";
import type { Category } from "../../models/category/Category";
import { CategoryIcon } from "../../ui/CategoryIcon";

const CategoriesScreen: React.FC = () => {
  const { theme: t } = useDesign();
  const styles = useMemo(() => makeStyles(t), [t]);
  const nav = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  const columns = rs.isTablet ? 6 : 4;
  const itemWidth = `${100 / columns}%`;
  const iconSize = rs.ms(22);
  const iconColor = t.appColor || t.primaryColor;

  const visibleCategories: Category[] = useMemo(
    () => categories.filter((c) => c.key !== "more"),
    []
  );

  const onCategoryPress = (c: Category) => {
    nav.navigate("CategoryJobs", { key: c.key, label: c.label });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => nav.goBack()} hitSlop={8} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs.ms(22)} color={t.textColor} />
        </Pressable>
        <Text style={styles.title}>Categories</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      {/* Body */}
      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridRow}>
          {visibleCategories.map((c) => (
            <View key={c.key} style={[styles.gridItem, { width: itemWidth }]}>
              <CategoryItem
                label={c.label}
                icon={<CategoryIcon icon={c.icon} size={iconSize} color={iconColor} />}
                onPress={() => onCategoryPress(c)}
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CategoriesScreen;

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

    body: { backgroundColor: t.backgroundColor },
    bodyContent: {
      paddingHorizontal: rs.ms(16),
      paddingTop: rs.ms(6),
      paddingBottom: rs.ms(32),
      backgroundColor: t.backgroundColor,
    },

    gridRow: { flexDirection: "row", flexWrap: "wrap" },
    gridItem: { alignItems: "center", marginBottom: t.spacing.lg },
  });
