import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useDesign } from '../design/DesignProvider';

type Props = { title: string; actionText?: string; onPress?: () => void };

const SectionHeader: React.FC<Props> = ({ title, actionText = 'View All', onPress }) => {
  const { theme: t } = useDesign();
  const styles = makeStyles(t);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {onPress && (
        <Pressable onPress={onPress}>
          <Text style={styles.action}>{actionText}</Text>
        </Pressable>
      )}
    </View>
  );
};

export default SectionHeader;

/* ---------------- styles ---------------- */
const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    title: { fontSize: t.h4, fontWeight: t.bold, color: t.textColor },
    action: { color: t.primaryColor, fontWeight: t.semiBold },
  });
