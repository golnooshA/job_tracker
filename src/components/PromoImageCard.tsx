import React, { useMemo } from "react";
import { Pressable, Image, StyleSheet, ViewStyle, ImageSourcePropType } from "react-native";
import { rs } from "../utils/responsive";
import { useDesign } from "../design/DesignProvider";

type Props = {
  source: ImageSourcePropType;    
  onPress?: () => void;
  style?: ViewStyle;
  dim?: boolean;                   
};

const PromoImageCard: React.FC<Props> = ({ source, onPress, style, dim = false }) => {
  const { theme: t } = useDesign();
  const s = useMemo(() => makeStyles(t), [t]);

  return (
    <Pressable onPress={onPress} style={[s.wrap, style]}>
      <Image source={source} style={s.img} resizeMode="cover" />
    </Pressable>
  );
};

export default PromoImageCard;

/* ---------------- styles ---------------- */
const CARD_W = rs.ms(280);
const CARD_H = rs.ms(150);

const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    wrap: {
      width: CARD_W,
      height: CARD_H,
      borderRadius: rs.ms(16),
      overflow: "hidden",
      marginRight: rs.ms(12),
      backgroundColor: "transparent",
      elevation: 2,
      shadowColor: "#000",
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
    },
    img: { width: "100%", height: "100%" },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(0,0,0,0.04)",
    },
  });
