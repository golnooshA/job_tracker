import React, { forwardRef } from "react";
import { View, TextInput, StyleSheet, TextInputProps, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useDesign } from "../design/DesignProvider";
import { rs } from "../utils/responsive";

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  containerStyle?: ViewStyle;
  leftIconName?: React.ComponentProps<typeof Ionicons>["name"];
} & Omit<TextInputProps, "style" | "onChangeText" | "value" | "placeholder">;

const SearchBar = forwardRef<TextInput, Props>(
  ({ value, onChangeText, placeholder = "Search jobs...", containerStyle, leftIconName = "search", ...inputProps }, ref) => {
    const { theme: t } = useDesign();
    const styles = makeStyles(t);

    return (
      <View style={[styles.wrap, containerStyle]}>
        <Ionicons name={leftIconName} size={rs.ms(18)} color={t.subtextColor} />
        <TextInput
          ref={ref}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={t.subtextColor}
          returnKeyType="search"
          {...inputProps}
          style={styles.input}
        />
      </View>
    );
  }
);

export default SearchBar;

/* ---------------- styles ---------------- */
const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    wrap: {
      marginTop: rs.ms(12),
      marginHorizontal: rs.ms(16),
      borderWidth: 1,
      borderColor: t.appColor || t.primaryColor,
      borderRadius: rs.ms(14),
      paddingHorizontal: rs.ms(12),
      height: rs.ms(44),
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: t.cardColor,
    },
    input: {
      flex: 1,
      marginLeft: rs.ms(8),
      color: t.textColor,
      fontSize: t.h6,
      paddingVertical: 0,
    },
  });
