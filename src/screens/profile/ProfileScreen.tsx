import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { signOut } from "firebase/auth";

import { useDesign } from "../../design/DesignProvider";
import { rs } from "../../utils/responsive";
import SettingRow from "../../components/SettingRow";
import { auth } from "../../lib/firebase";

import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "../../navigation/RootNavigator";

type Nav = NativeStackNavigationProp<ProfileStackParamList, "ProfileHome">;

const ProfileScreen: React.FC = () => {
  const { theme: t } = useDesign();
  const s = useMemo(() => makeStyles(t), [t]);
  const nav = useNavigation<Nav>();

  const user = auth.currentUser;

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.log("Logout error", e);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.title}>Profile</Text>
      </View>

      {/* User info */}
      <View style={s.userBox}>
        <View style={s.avatar}>
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={s.avatarImg} />
          ) : (
            <Ionicons name="person" size={rs.ms(40)} color="#fff" />
          )}
        </View>
        <Text style={s.name}>{user?.displayName || "Guest User"}</Text>
        <Text style={s.email}>{user?.email || ""}</Text>
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
          onPress={() => nav.navigate("Notification")}
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
          onPress={handleLogout}
          showChevron={false}
        />
      </View>
    </SafeAreaView>
  );
};

export default ProfileScreen;

/* ---------------- styles ---------------- */
const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.backgroundColor },
    header: {
      alignItems: "center",
      paddingTop: rs.ms(6),
      paddingBottom: rs.ms(8),
    },
    title: { color: t.textColor, fontSize: t.h4, fontWeight: t.bold },

    userBox: {
      alignItems: "center",
      marginTop: rs.ms(12),
      marginBottom: rs.ms(8),
    },
    avatar: {
      width: rs.ms(80),
      height: rs.ms(80),
      borderRadius: rs.ms(40),
      marginBottom: rs.ms(8),
      backgroundColor: t.appColor || t.primaryColor, // orange or theme color
      alignItems: "center",
      justifyContent: "center",
    },
    avatarImg: {
      width: "100%",
      height: "100%",
      borderRadius: rs.ms(40),
    },
    name: { fontSize: t.h4, color: t.textColor, fontWeight: t.bold },
    email: { fontSize: t.h6, color: t.subtextColor, marginTop: rs.ms(2) },

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
      marginLeft: rs.ms(16) + rs.ms(18) + rs.ms(12),
    },
    sectionSeparator: {
      marginTop: rs.ms(18),
      height: StyleSheet.hairlineWidth,
      backgroundColor: t.dividerColor,
      opacity: 0.6,
    },
  });
