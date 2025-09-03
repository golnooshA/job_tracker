import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDesign } from "../design/DesignProvider";
import { rs } from "../utils/responsive";

type Props = {
  name: string;
  industry: string;
  location: string;
  logoUri?: string;
  fallbackInitial?: string;
};

const CompanyHeader: React.FC<Props> = ({ name, industry, location, logoUri, fallbackInitial }) => {
  const { theme: t } = useDesign();
  const styles = makeStyles(t);

  return (
    <View style={styles.wrap}>
      <View style={styles.logoWrap}>
        {logoUri ? (
          <Image source={{ uri: logoUri }} style={styles.logo} />
        ) : (
          <View style={styles.logoFallback}>
            <Text style={styles.initial}>{(fallbackInitial ?? name[0]).toUpperCase()}</Text>
          </View>
        )}
      </View>

      <Text style={styles.name}>{name}</Text>
      <Text style={styles.industry}>{industry}</Text>

      <View style={styles.locRow}>
        <Ionicons name="location" size={rs.ms(18)} color={t.appColor || t.primaryColor} />
        <Text style={styles.location}>{location}</Text>
      </View>
    </View>
  );
};

export default CompanyHeader;

/* ---------------- styles ---------------- */
const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    wrap: { alignItems: "center", paddingTop: rs.ms(6), paddingBottom: rs.ms(8) },
    logoWrap: { marginTop: rs.ms(4), marginBottom: rs.ms(8) },
    logo: { width: rs.ms(96), height: rs.ms(96), borderRadius: rs.ms(48) },
    logoFallback: {
      width: rs.ms(96), height: rs.ms(96), borderRadius: rs.ms(48),
      backgroundColor: t.chipColor, alignItems: "center", justifyContent: "center",
    },
    initial: { color: t.textColor, fontWeight: t.bold, fontSize: rs.ms(28) },
    name: { color: t.textColor, fontSize: rs.ms(28), fontWeight: t.bold },
    industry: { color: t.subtextColor, fontSize: t.h5, marginTop: rs.ms(6) },
    locRow: { flexDirection: "row", alignItems: "center", marginTop: rs.ms(10) },
    location: { color: t.textColor, fontSize: t.h6, marginLeft: rs.ms(6) },
  });
