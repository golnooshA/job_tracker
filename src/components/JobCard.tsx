import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDesign } from "../design/DesignProvider";

/** View-model expected by this card */
export type JobCardVM = {
  id: string;
  company: string;
  companyLogoText: string;
  companyLogoUrl?: string; // show if available
  title: string;
  city: string;
  country: string;
  type: string;
  summary: string;
  postedAt?: string;
  applicants?: number;
  views?: number;
  bookmarked: boolean;
};

type Props = {
  job: JobCardVM;
  onPress?: () => void;
  /** (jobId, nextState) */
  onBookmark?: (id: string, next: boolean) => void;
};

const JobCard: React.FC<Props> = React.memo(({ job, onPress, onBookmark }) => {
  const { theme: t } = useDesign();
  const styles = useMemo(() => makeStyles(t), [t]);

  // optimistic local state that tracks external prop changes
  const [saved, setSaved] = useState<boolean>(job.bookmarked);
  useEffect(() => setSaved(job.bookmarked), [job.bookmarked]);

  const shadow =
    Platform.select({ ios: styles.iosShadow, android: styles.androidShadow }) ||
    undefined;

  const location =
    job.city && job.country
      ? `${job.city}, ${job.country}`
      : job.city || job.country || "-";

  const handleBookmark = () => {
    const next = !saved;
    setSaved(next); // optimistic UI
    onBookmark?.(job.id, next);
  };

  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: t.dividerColor }}
      style={[styles.card, shadow]}
      accessibilityRole="button"
      accessibilityLabel={`${job.title} at ${job.company}`}
    >
      {/* Header: logo + company + bookmark */}
      <View style={styles.rowBetween}>
        <View style={styles.rowCenter}>
          {job.companyLogoUrl ? (
            <Image source={{ uri: job.companyLogoUrl }} style={styles.logoImg} resizeMode="cover" />
          ) : (
            <View style={styles.logoCircle}>
              <Text style={styles.logoInitial}>
                {(job.companyLogoText || job.company?.[0] || "?").toUpperCase()}
              </Text>
            </View>
          )}
          <Text numberOfLines={1} style={styles.company}>
            {job.company}
          </Text>
        </View>

        <Pressable
          onPress={handleBookmark}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel={saved ? "Remove bookmark" : "Save job"}
        >
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={22}
            color={t.primaryColor}
          />
        </Pressable>
      </View>

      {/* Title */}
      <Text numberOfLines={2} style={styles.title}>
        {job.title}
      </Text>

      {/* Meta */}
      <Text style={styles.meta}>
        {location} ·{" "}
        <Text style={styles.metaHighlight} numberOfLines={1}>
          {job.type}
        </Text>
      </Text>

      {/* Summary */}
      {!!job.summary && (
        <Text numberOfLines={2} style={styles.summary}>
          {job.summary}
        </Text>
      )}
    </Pressable>
  );
});

export default JobCard;

/* ---------------- styles ---------------- */
const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    card: {
      backgroundColor: t.cardColor,
      marginHorizontal: 16,
      marginVertical: 8,
      borderRadius: t.buttonBorderRadius,
      padding: 16,
      borderWidth: 1,
      borderColor: t.dividerColor,
    },

    rowBetween: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    rowCenter: { flexDirection: "row", alignItems: "center", flexShrink: 1 },

    logoImg: {
      width: 36,
      height: 36,
      borderRadius: 8,
      marginRight: 8,
      backgroundColor: t.chipColor,
    },
    logoCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: t.chipColor,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 8,
    },
    logoInitial: { fontWeight: t.bold, color: t.textColor, fontSize: t.small },

    company: {
      color: t.textColor,
      fontSize: t.h6,
      fontWeight: t.semiBold,
      flexShrink: 1,
      maxWidth: "80%",
    },

    title: {
      marginTop: 8,
      color: t.textColor,
      fontSize: t.h4,
      fontWeight: t.bold,
    },

    meta: { marginTop: 4, fontSize: t.small, color: t.subtextColor },
    metaHighlight: { color: t.primaryColor, fontWeight: t.semiBold },

    summary: { marginTop: 8, fontSize: t.small, lineHeight: 18, color: t.subtextColor },

    iosShadow: {
      shadowColor: "#000",
      shadowOpacity: 0.08,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 6 },
    },
    androidShadow: { elevation: 3 },
  });
