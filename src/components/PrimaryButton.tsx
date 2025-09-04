import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle } from "react-native";
import { useDesign } from "../design/DesignProvider";
import { rs } from "../utils/responsive";

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  style?: ViewStyle;
  disabled?: boolean;
};

const PrimaryButton: React.FC<Props> = ({ label, onPress, loading, style, disabled }) => {
  const { theme: t } = useDesign();
  const s = makeStyles(t);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        s.btn,
        isDisabled && { opacity: 0.6 },
        pressed && { transform: [{ scale: 0.995 }] },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator />
      ) : (
        <Text style={s.label}>{label}</Text>
      )}
    </Pressable>
  );
};

export default PrimaryButton;

const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    btn: {
      marginHorizontal: rs.ms(16),
      marginTop: rs.ms(18),
      height: rs.ms(46),
      borderRadius: rs.ms(12),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: t.appColor || t.primaryColor,
    },
    label: { color: t.buttonTextColor ?? "#fff", fontSize: t.h6, fontWeight: t.bold },
  });
