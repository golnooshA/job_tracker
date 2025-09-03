import React from "react";
import { View, Text, Pressable, StyleSheet, Platform, ViewStyle, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useDesign } from "../design/DesignProvider";
import { rs } from "../utils/responsive";

type Props = {
  name: string;
  logoUri?: string; 
  iconName?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  initial?: string;
  onPress?: () => void;
  containerStyle?: ViewStyle;
};

const CompanyTile: React.FC<Props> = ({ name, logoUri, iconName, initial, onPress, containerStyle }) => {
  const { theme: t } = useDesign();
  const styles = makeStyles(t);
  const shadow = Platform.select({ ios: styles.iosShadow, android: styles.androidShadow });

  return (
    <View style={[styles.wrap, containerStyle]}>
      <Pressable onPress={onPress} style={[styles.tile, shadow]}>
        <View style={styles.logoCircle}>
          {logoUri ? (
            <Image source={{ uri: logoUri }} style={styles.logoImg} resizeMode="cover" />
          ) : initial ? (
            <Text style={styles.logoInitial}>{initial.toUpperCase()}</Text>
          ) : (
            <MaterialCommunityIcons
              name={iconName ?? "office-building"}
              size={rs.ms(24)}
              color={t.appColor || t.primaryColor}
            />
          )}
        </View>
        <Text numberOfLines={1} style={styles.companyName}>{name}</Text>
      </Pressable>
    </View>
  );
};

export default CompanyTile;

const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    wrap: {},
    tile: {
      width: "100%",
      backgroundColor: t.cardColor,
      borderRadius: rs.ms(12),
      borderWidth: 1,
      borderColor: t.dividerColor,
      paddingVertical: rs.ms(12),
      alignItems: "center",
      justifyContent: "center",
    },
    iosShadow: {
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    androidShadow: { elevation: 2 },
    logoCircle: {
      width: rs.ms(44),
      height: rs.ms(44),
      borderRadius: rs.ms(22),
      backgroundColor: t.chipColor,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: rs.ms(8),
      overflow: "hidden", 
    },
    logoImg: { width: "100%", height: "100%" }, // ✅
    logoInitial: { color: t.textColor, fontWeight: t.bold, fontSize: t.h6 },
    companyName: { color: t.textColor, fontSize: t.small, fontWeight: t.semiBold },
  });
