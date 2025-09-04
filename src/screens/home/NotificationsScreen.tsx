// screens/home/NotificationsScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { app, auth } from "../../lib/firebase";
import {
  getFirestore,
  collection,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  doc,
  getDocs,
  writeBatch,
} from "firebase/firestore";

import { useDesign } from "../../design/DesignProvider";
import { rs } from "../../utils/responsive";

type Noti = {
  id: string;
  type: "job_added";
  jobId: string;
  title: string;
  createdAt?: any;
  read: boolean;
};

const NotificationsScreen: React.FC = () => {
  const { theme: t } = useDesign();
  const s = useMemo(() => makeStyles(t), [t]);
  const db = getFirestore(app);
  const nav = useNavigation<any>();

  const [items, setItems] = useState<Noti[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  // --- subscribe to notifications ---
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setLoading(false);
      return;
    }
    const qy = query(
      collection(db, "users", uid, "notifications"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(qy, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })));
      setLoading(false);
    });
    return () => unsub();
  }, [db]);

  // --- actions ---
  const openItem = async (n: Noti) => {
    const uid = auth.currentUser?.uid;
    if (uid) {
      await updateDoc(doc(db, "users", uid, "notifications", n.id), {
        read: true,
      });
    }
    nav.navigate("JobDetail", { jobId: n.jobId, companyId: null });
  };

  const clearAll = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    if (items.length === 0) return;

    try {
      setClearing(true);
      const colRef = collection(db, "users", uid, "notifications");
      const snap = await getDocs(colRef);
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
    } catch (e) {
      Alert.alert("Error", "Failed to clear notifications.");
    } finally {
      setClearing(false);
    }
  };

  // --- render ---
  return (
    <SafeAreaView style={[s.container, { backgroundColor: t.backgroundColor }]}>
      {/* Custom AppBar */}
      <View style={s.appbar}>
        <Pressable onPress={() => nav.goBack()} hitSlop={10} style={s.backBtn}>
          <Ionicons name="arrow-back" size={rs.ms(22)} color={t.textColor} />
        </Pressable>

        <Text style={s.appbarTitle}>Notifications</Text>

        <Pressable
          onPress={clearAll}
          disabled={clearing || items.length === 0}
          hitSlop={10}
          style={s.cleanBtn}
        >
          {clearing ? (
            <ActivityIndicator size="small" color={t.primaryColor} />
          ) : (
            <Text
              style={[s.cleanText, { opacity: items.length === 0 ? 0.4 : 1 }]}
            >
              Clean all
            </Text>
          )}
        </Pressable>
      </View>

      {loading ? (
        <View style={{ paddingTop: rs.ms(24) }}>
          <ActivityIndicator color={t.primaryColor} />
        </View>
      ) : (
        <FlatList
          contentContainerStyle={{ padding: rs.ms(16) }}
          data={items}
          keyExtractor={(it) => it.id}
          ListEmptyComponent={
            <Text style={{ color: t.subtextColor }}>No notifications yet.</Text>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openItem(item)}
              style={[s.item, !item.read && s.unread]}
            >
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{item.title}</Text>
                <Text style={s.subtitle}>New job added</Text>
              </View>
              {!item.read && <View style={s.dot} />}
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen;

const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    container: { flex: 1 },

    /* ---------- AppBar ---------- */
    appbar: {
      height: rs.ms(50),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: rs.ms(12),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: t.dividerColor,
    },
    backBtn: { padding: rs.ms(4) },
    appbarTitle: {
      position: "absolute",
      left: 0,
      right: 0,
      textAlign: "center",
      fontSize: t.h5,
      color: t.textColor,
      fontWeight: t.bold,
    },
    cleanBtn: { padding: rs.ms(6) },
    cleanText: { color: t.primaryColor, fontSize: t.small, fontWeight: t.bold },

    /* ---------- List Items ---------- */
    item: {
      borderWidth: 1,
      borderColor: t.dividerColor,
      backgroundColor: t.cardColor,
      borderRadius: rs.ms(12),
      padding: rs.ms(14),
      marginBottom: rs.ms(10),
      flexDirection: "row",
      alignItems: "center",
      gap: rs.ms(8),
    },
    unread: { borderColor: t.primaryColor },
    title: { color: t.textColor, fontSize: t.body, fontWeight: t.bold },
    subtitle: { color: t.subtextColor, fontSize: t.small, marginTop: 2 },
    dot: {
      width: rs.ms(10),
      height: rs.ms(10),
      borderRadius: rs.ms(5),
      backgroundColor: t.primaryColor,
    },
  });
