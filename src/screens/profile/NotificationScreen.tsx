import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Switch, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDesign } from "../../design/DesignProvider";
import { rs } from "../../utils/responsive";
import { app, auth } from "../../lib/firebase";
import {
  getFirestore,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

const NotificationScreen: React.FC = () => {
  const { theme: t } = useDesign();
  const s = useMemo(() => makeStyles(t), [t]);
  const db = getFirestore(app);

  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    const uref = doc(db, "users", uid);
    const unsub = onSnapshot(uref, (snap) => {
      const data = snap.data() as any;
      setEnabled(!!data?.notifyNewJobs);
    });
    return () => unsub();
  }, [db]);

  const onToggle = async (value: boolean) => {
    const uid = auth.currentUser?.uid;
    if (!uid) return Alert.alert("Login required", "Please sign in first.");
    setEnabled(value);
    await setDoc(
      doc(db, "users", uid),
      value
        ? { notifyNewJobs: true, notifySince: serverTimestamp() } 
        : { notifyNewJobs: false },
      { merge: true }
    );
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.rowText}>Notify when new jobs are added</Text>
          <Switch
            value={enabled}
            onValueChange={onToggle}
            thumbColor={enabled ? t.primaryColor : "#ccc"}
            trackColor={{ false: t.dividerColor, true: t.primaryColor + "55" }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default NotificationScreen;

const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.backgroundColor },
    card: {
      marginHorizontal: rs.ms(16),
      marginTop: rs.ms(12),
      borderRadius: rs.ms(14),
      backgroundColor: t.cardColor,
      borderWidth: 1,
      borderColor: t.dividerColor,
      overflow: "hidden",
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: rs.ms(14),
      paddingHorizontal: rs.ms(16),
    },
    rowText: { color: t.textColor, fontSize: t.body },
  });
