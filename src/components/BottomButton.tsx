import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDesign } from "../design/DesignProvider";
import { rs } from "../utils/responsive";

type Props = {
  label?: string;
  onPress: () => void;
  visible?: boolean;
  disabled?: boolean;
};

const BottomButton: React.FC<Props> = ({
  label = "Apply Filter",
  onPress,
  visible = true,
  disabled = false,
}) => {
  const insets = useSafeAreaInsets();
  const { theme: t } = useDesign();
  const styles = makeStyles(t);

  if (!visible) return null;

  // ارتفاع تخمینی تب‌بار
  const tabBarHeight = rs.ms(50) + insets.bottom;
  const bottomOffset = tabBarHeight + rs.ms(8);

  return (
    <View style={[styles.container, { bottom: bottomOffset }]}>
      <Pressable style={[styles.button, disabled && styles.buttonDisabled]} onPress={onPress} disabled={disabled}>
        <Text style={styles.text}>{label}</Text>
      </Pressable>
    </View>
  );
};

export default BottomButton;

/* ---------------- styles ---------------- */
const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    container: {
      position: "absolute",
      left: rs.ms(16),
      right: rs.ms(16),
      zIndex: 10,
      elevation: 10,
      pointerEvents: "box-none",
    },
    button: {
      backgroundColor: t.appColor || t.primaryColor,
      height: rs.ms(48),
      borderRadius: rs.ms(14),
      alignItems: "center",
      justifyContent: "center",
    },
    buttonDisabled: { opacity: 0.6 },
    text: { color: "#fff", fontSize: t.h5, fontWeight: t.bold },
  });
