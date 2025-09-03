import React, { useMemo } from "react";
import { Pressable, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDesign } from "../design/DesignProvider";
import { rs } from "../utils/responsive";

type Props = {
  title: string;
  subtitle?: string;
  onPress?: () => void;
  leftIcon?: React.ReactNode;
  danger?: boolean;         // for Logout style
  showChevron?: boolean;    // default: true
};

const SettingRow: React.FC<Props> = ({
  title,
  subtitle,
  onPress,
  leftIcon,
  danger = false,
  showChevron = true,
}) => {
  const { theme: t } = useDesign();
  const s = useMemo(() => makeStyles(t), [t]);

  return (
    <Pressable onPress={onPress} style={s.row}>
      <View style={s.leftWrap}>
        {leftIcon ?? (
          <Ionicons
            name="ellipse-outline"
            size={rs.ms(18)}
            color={danger ? t.errorColor ?? "#e14848" : t.textColor}
            style={{ marginRight: rs.ms(12) }}
          />
        )}
        <View>
          <Text style={[s.title, danger && { color: t.errorColor ?? "#e14848" }]}>{title}</Text>
          {!!subtitle && <Text style={s.subtitle}>{subtitle}</Text>}
        </View>
      </View>

      {showChevron && (
        <Ionicons
          name="chevron-forward"
          size={rs.ms(18)}
          color={t.subtextColor}
        />
      )}
    </Pressable>
  );
};

export default SettingRow;

/* ---------------- styles at bottom ---------------- */
const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    row: {
      paddingHorizontal: rs.ms(16),
      paddingVertical: rs.ms(14),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    leftWrap: { flexDirection: "row", alignItems: "center" },
    title: { color: t.textColor, fontSize: t.h5, fontWeight: t.semiBold },
    subtitle: { color: t.subtextColor, fontSize: t.h6, marginTop: rs.ms(4) },
  });
