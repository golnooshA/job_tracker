import React from 'react';
import { View, Text, Image, ImageSourcePropType, StyleSheet, Platform } from 'react-native';
import { useDesign } from '../design/DesignProvider';

type Props = { title?: string; subtitle?: string; image?: ImageSourcePropType };

const PromoCard: React.FC<Props> = ({ title = 'Jobs that match', subtitle = 'your passion', image }) => {
  const { theme: t } = useDesign();
  const styles = makeStyles(t);
  const shadow = Platform.select({ ios: styles.iosShadow, android: styles.androidShadow });

  return (
    <View style={[styles.card, shadow]}>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      {image ? (
        <Image source={image} style={styles.image} />
      ) : (
        <View style={styles.placeholder} />
      )}
    </View>
  );
};

export default PromoCard;

/* ---------------- styles ---------------- */
const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    card: {
      width: 280, height: 140,
      backgroundColor: t.chipColor,
      borderRadius: t.buttonBorderRadius,
      padding: 16, marginRight: 12,
      flexDirection: 'row', alignItems: 'center', overflow: 'hidden',
    },
    textCol: { flex: 1 },
    title: { color: t.textColor, fontSize: t.h6, fontWeight: t.semiBold },
    subtitle: { color: t.primaryColor, fontSize: t.h5, fontWeight: t.bold, marginTop: 2 },
    image: { width: 100, height: 100, resizeMode: 'contain' },
    placeholder: { width: 100, height: 100, borderRadius: 16, backgroundColor: t.backgroundColor, opacity: 0.6 },
    iosShadow: { shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
    androidShadow: { elevation: 3 },
  });
