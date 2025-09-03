import React from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { useRoute, RouteProp, useNavigation } from "@react-navigation/native";

import { useDesign } from "../../design/DesignProvider";
import { rs } from "../../utils/responsive";

type ParamList = {
  WebView: { title?: string; url: string };
};

const WebViewScreen: React.FC = () => {
  const { theme: t } = useDesign();
  const styles = makeStyles(t);
  const nav = useNavigation();
  const route = useRoute<RouteProp<ParamList, "WebView">>();
  const { title = "Apply", url } = route.params ?? { url: "https://www.google.com" };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => (nav.canGoBack() ? nav.goBack() : null)} hitSlop={10} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={rs.ms(22)} color={t.textColor} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{title}</Text>
        <View style={{ width: rs.ms(26) }} />
      </View>
      <WebView source={{ uri: url }} />
    </SafeAreaView>
  );
};

export default WebViewScreen;

/* ---------------- styles ---------------- */
const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.backgroundColor },
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: rs.ms(16), paddingTop: rs.ms(4), paddingBottom: rs.ms(6),
    },
    backBtn: { padding: rs.ms(4) },
    title: { color: t.textColor, fontSize: t.h5, fontWeight: t.bold, maxWidth: "70%" },
  });
