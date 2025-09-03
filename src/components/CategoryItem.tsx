import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useDesign } from '../design/DesignProvider';
import { rs } from '../utils/responsive';

type Props = { icon: React.ReactNode; label: string; onPress?: () => void };

const CategoryItem: React.FC<Props> = ({ icon, label, onPress }) => {
  const { theme: t } = useDesign();
  const styles = makeStyles(t);

  return (
    <Pressable onPress={onPress} style={styles.root}>
      <View style={styles.circle}>{icon}</View>
      <Text numberOfLines={1} style={styles.label}>{label}</Text>
    </Pressable>
  );
};

export default CategoryItem;

/* ---------------- styles ---------------- */
const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    root: { alignItems: 'center', marginVertical: t.spacing.sm },
    circle: {
      width: rs.ms(64),
      height: rs.ms(64),
      borderRadius: rs.ms(32),
      backgroundColor: t.chipColor,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: { marginTop: t.spacing.xs, fontSize: t.small, color: t.textColor, fontWeight: t.semiBold },
  });
