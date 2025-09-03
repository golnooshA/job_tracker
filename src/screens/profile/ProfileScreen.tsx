import React, { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { useDesign } from "../../design/DesignProvider";
import { rs } from "../../utils/responsive";
import SettingRow from "../../components/SettingRow";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "../../navigation/RootNavigator";

type Nav = NativeStackNavigationProp<ProfileStackParamList, "ProfileHome">;

const ProfileScreen: React.FC = () => {
  const { theme: t } = useDesign();
  const s = useMemo(() => makeStyles(t), [t]);
  const nav = useNavigation<Nav>();

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Profile</Text>
      </View>

      {/* Items */}
      <View style={s.card}>
        <SettingRow
          title="Theme"
          subtitle="Appearance"
          leftIcon={
            <Ionicons
              name="color-palette-outline"
              size={rs.ms(18)}
              color={t.textColor}
              style={{ marginRight: rs.ms(12) }}
            />
          }
          onPress={() => nav.navigate("Theme")}
        />
        <View style={s.divider} />

        <SettingRow
          title="Notification"
          subtitle="Alerts & Sounds"
          leftIcon={
            <Ionicons
              name="notifications-outline"
              size={rs.ms(18)}
              color={t.textColor}
              style={{ marginRight: rs.ms(12) }}
            />
          }
          onPress={() => {}}
        />
        <View style={s.divider} />

        <SettingRow
          title="About"
          subtitle="About the app"
          leftIcon={
            <Ionicons
              name="information-circle-outline"
              size={rs.ms(18)}
              color={t.textColor}
              style={{ marginRight: rs.ms(12) }}
            />
          }
          onPress={() => nav.navigate("About")}
        />
      </View>

      {/* Separator */}
      <View style={s.sectionSeparator} />

      {/* Logout */}
      <View style={s.card}>
        <SettingRow
          title="Log Out"
          subtitle="Exit from your account"
          danger
          leftIcon={
            <Ionicons
              name="log-out-outline"
              size={rs.ms(18)}
              color={t.errorColor ?? "#e14848"}
              style={{ marginRight: rs.ms(12) }}
            />
          }
          onPress={() => {}}
          showChevron={false}
        />
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;

/* ---------------- styles at bottom ---------------- */
const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.backgroundColor },
    header: {
      alignItems: "center",
      paddingTop: rs.ms(6),
      paddingBottom: rs.ms(8),
    },
    title: { color: t.textColor, fontSize: t.h4, fontWeight: t.bold },

    card: {
      marginHorizontal: rs.ms(16),
      marginTop: rs.ms(12),
      borderRadius: rs.ms(14),
      backgroundColor: t.cardColor,
      borderWidth: 1,
      borderColor: t.dividerColor,
      overflow: "hidden",
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.dividerColor,
      marginLeft: rs.ms(16) + rs.ms(18) + rs.ms(12), // indent after icon
    },
    sectionSeparator: {
      marginTop: rs.ms(18),
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.dividerColor,
      opacity: 0.6,
    },
  });
