// src/components/FormInput.tsx
import React, { useState, forwardRef } from "react";
import { View, TextInput, Pressable, StyleSheet, Text, TextInputProps, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDesign } from "../design/DesignProvider";
import { rs } from "../utils/responsive";

type Props = TextInputProps & {
  label?: string;
  errorText?: string;
  containerStyle?: ViewStyle;
  secureToggle?: boolean; // اگر true باشد، دکمه eye نمایش داده می‌شود
};

const FormInput = forwardRef<TextInput, Props>(
  ({ label, errorText, containerStyle, secureTextEntry, secureToggle, style, ...rest }, ref) => {
    const { theme: t } = useDesign();
    const [secure, setSecure] = useState<boolean>(!!secureTextEntry);
    const s = makeStyles(t);

    return (
      <View style={[{ marginHorizontal: rs.ms(16), marginTop: rs.ms(14) }, containerStyle]}>
        {!!label && <Text style={s.label}>{label}</Text>}
        <View style={s.wrap}>
          <TextInput
            ref={ref}
            placeholderTextColor={t.subtextColor}
            secureTextEntry={secure}
            style={[s.input, style]}
            {...rest}
          />
          {secureToggle && (
            <Pressable onPress={() => setSecure((p) => !p)} hitSlop={10} style={{ padding: rs.ms(6) }}>
              <Ionicons
                name={secure ? "eye-off-outline" : "eye-outline"}
                size={rs.ms(18)}
                color={t.subtextColor}
              />
            </Pressable>
          )}
        </View>
        {!!errorText && <Text style={s.error}>{errorText}</Text>}
      </View>
    );
  }
);

export default FormInput;

const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    label: { color: t.textColor, fontSize: t.h6, fontWeight: t.semiBold, marginBottom: rs.ms(6) },
    wrap: {
      borderWidth: 1,
      borderColor: t.dividerColor,
      borderRadius: rs.ms(14),
      paddingHorizontal: rs.ms(12),
      height: rs.ms(46),
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.cardColor,
    },
    input: {
      flex: 1,
      color: t.textColor,
      fontSize: t.h6,
      paddingVertical: 0,
    },
    error: { color: t.errorColor ?? "#e14848", fontSize: t.small, marginTop: rs.ms(6) },
  });
