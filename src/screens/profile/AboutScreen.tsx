import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDesign } from "../../design/DesignProvider";
import { rs } from "../../utils/responsive";

const AboutScreen: React.FC = () => {
  const { theme: t } = useDesign();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.backgroundColor }}>
      <View style={styles.center}>
        <Image
          source={require("../../../assets/images/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.appName, { color: t.appColor || t.primaryColor }]}>
          Joboard
        </Text>
        <Text style={[styles.version, { color: t.subtextColor }]}>V 1.0.0</Text>
        <Text style={[styles.desc, { color: t.subtextColor }]}>
          Get job recommendation, search and save job opportunity in your gadget
          with this app
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default AboutScreen;

/* -------- styles at bottom -------- */
const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: rs.ms(24),
  },
  logo: { width: rs.ms(96), height: rs.ms(96), marginBottom: rs.ms(18) },
  appName: { fontSize: rs.ms(28), fontWeight: "800", marginBottom: rs.ms(6) },
  version: { fontSize: rs.ms(14), fontWeight: "700", marginBottom: rs.ms(10) },
  desc: { fontSize: rs.ms(14), textAlign: "center", lineHeight: rs.ms(20) },
});
