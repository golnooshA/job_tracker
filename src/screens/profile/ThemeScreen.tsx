// src/screens/profile/ThemeScreen.tsx
import React, { useMemo } from "react";
import { View, Text, Pressable, StyleSheet, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useDesign } from "../../design/DesignProvider";
import { rs } from "../../utils/responsive";

/** Small helpers to infer current scheme + setter from any DesignProvider shape */
function resolveSchemeAPI(design: any): {
  scheme: "light" | "dark";
  setScheme: (v: "light" | "dark") => void;
} {
  const t = design?.theme ?? {};
  // ---- READERS: find current scheme ----
  const candidatesRead = [
    () => design?.scheme,
    () => design?.mode,
    () => design?.themeMode,
    () => design?.themeName,
    () => design?.appearance,
    () => design?.colorScheme,
    () =>
      design?.isDark === true
        ? "dark"
        : design?.isDark === false
        ? "light"
        : undefined,
    () => t?.scheme,
    () => t?.mode,
  ];

  let current: any = candidatesRead
    .map((fn) => fn())
    .find((v) => v === "light" || v === "dark");
  if (!current) current = "light"; // default fallback

  // ---- WRITERS: find setter ----
  const setFns = [
    design?.setScheme,
    design?.setMode,
    design?.setThemeMode,
    design?.setThemeName,
    design?.setAppearance,
    design?.setColorScheme,
    design?.updateScheme,
    design?.updateMode,
  ].filter(Boolean);

  const setScheme = setFns[0]
    ? (v: "light" | "dark") => {
        try {
          setFns[0](v);
        } catch {
          // some setters may expect {scheme:v} or similar; try a couple patterns
          try {
            setFns[0]({ scheme: v });
          } catch {
            try {
              setFns[0]({ mode: v });
            } catch {
              throw new Error("NO_COMPAT_SETTER");
            }
          }
        }
      }
    : (() => {
        // no setter found -> make a safe noop that warns once
        let warned = false;
        return (v: "light" | "dark") => {
          if (!warned) {
            warned = true;
            Alert.alert(
              "Theme provider missing setter",
              "Your DesignProvider does not expose a setter (e.g. setScheme / setMode). Add one or map it."
            );
          }
          console.warn(
            "No theme setter found in DesignProvider. Wanted to set:",
            v
          );
        };
      })();

  return { scheme: current, setScheme };
}

const ThemeScreen: React.FC = () => {
  const design = useDesign() as any;
  const { theme: t } = design;
  const { scheme, setScheme } = resolveSchemeAPI(design);
  const s = useMemo(() => makeStyles(t), [t]);

  const RadioRow = ({
    label,
    value,
  }: {
    label: string;
    value: "light" | "dark";
  }) => {
    const selected = scheme === value;
    return (
      <Pressable
        onPress={() => setScheme(value)}
        android_ripple={{ color: t.rippleColor ?? "#00000022" }}
        style={s.row}
      >
        <Ionicons
          name={selected ? "radio-button-on" : "radio-button-off"}
          size={rs.ms(22)}
          color={selected ? t.primaryColor : t.subtextColor}
          style={{ marginRight: rs.ms(12) }}
        />
        <Text style={[s.rowText, selected && { color: t.textColor }]}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.card}>
        <RadioRow label="Light" value="light" />
        <View style={s.divider} />
        <RadioRow label="Dark" value="dark" />
      </View>
    </SafeAreaView>
  );
};

export default ThemeScreen;

const makeStyles = (t: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t?.backgroundColor },
    header: {
      paddingTop: rs.ms(8),
      paddingBottom: rs.ms(12),
      paddingHorizontal: rs.ms(16),
    },
    title: { color: t?.textColor, fontSize: t?.h4, fontWeight: t?.bold },
    subtitle: {
      color: t?.subtextColor,
      fontSize: t?.small,
      marginTop: rs.ms(6),
    },
    card: {
      marginHorizontal: rs.ms(16),
      marginTop: rs.ms(12),
      borderRadius: rs.ms(14),
      backgroundColor: t?.cardColor,
      borderWidth: 1,
      borderColor: t?.dividerColor,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: rs.ms(14),
      paddingHorizontal: rs.ms(16),
    },
    rowText: { color: t?.subtextColor, fontSize: t?.body },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: t?.dividerColor,
      marginLeft: rs.ms(16) + rs.ms(22) + rs.ms(12),
    },
  });
