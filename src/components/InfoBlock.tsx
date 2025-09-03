import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useDesign } from "../design/DesignProvider";
import { rs } from "../utils/responsive";

type Props = { label: string; value: string };

const InfoBlock: React.FC<Props> = ({ label, value }) => {
  const { theme: t } = useDesign();
  const styles = makeStyles(t);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
};

export default InfoBlock;

/* ---------------- styles ---------------- */
const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    container: { marginTop: rs.ms(16) },
    label: { color: t.textColor, fontSize: t.h6, fontWeight: t.semiBold, marginBottom: rs.ms(6) },
    value: { color: t.subtextColor, fontSize: t.h6, lineHeight: rs.ms(22) },
  });
