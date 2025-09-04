import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  useWindowDimensions,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { useDesign } from "../../design/DesignProvider";
import { rs } from "../../utils/responsive";
import SearchBar from "../../components/SearchBar";
import CompanyTile from "../../components/CompanyTile";

import { CompaniesStackParamList } from "../../navigation/RootNavigator";
import { Company } from "../../models/company/Company";
import { companyConverter } from "../../models/company/company.converter";
import { collection, getFirestore, onSnapshot } from "firebase/firestore";
import { app } from "../../lib/firebase";

type Nav = NativeStackNavigationProp<CompaniesStackParamList, "CompaniesList">;

const CompaniesScreen: React.FC = () => {
  const { theme: t } = useDesign();
  const s = useMemo(() => makeStyles(t), [t]);
  const nav = useNavigation<Nav>();
  const { width: SCREEN_W } = useWindowDimensions();

  const db = getFirestore(app);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "companies").withConverter(companyConverter),
      (snap) => setCompanies(snap.docs.map((d) => d.data() as Company))
    );
    return () => unsub();
  }, [db]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return s
      ? companies.filter((c) => c.name.toLowerCase().includes(s))
      : companies;
  }, [q, companies]);

  const COLUMNS = 3;
  const PADDING_H = rs.ms(16);
  const GAP = rs.ms(10);
  const ITEM_W = Math.floor(
    (SCREEN_W - PADDING_H * 2 - GAP * (COLUMNS - 1)) / COLUMNS
  );

  const onPressCompany = (c: Company) => {
    nav.navigate("CompanyDetail", { key: c.id });
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Pressable
          style={s.backBtn}
          onPress={() => nav.canGoBack() && nav.goBack()}
        >
          <Ionicons name="arrow-back" size={rs.ms(22)} color={t.textColor} />
        </Pressable>
        <Text style={s.title}>Companies</Text>
        <View style={{ width: rs.ms(26) }} />
      </View>

      {/* Search */}
      <SearchBar value={q} onChangeText={setQ} placeholder="Enter Company" />

      {/* Grid */}
      <FlatList
        data={filtered}
        keyExtractor={(it) => it.id}
        numColumns={COLUMNS}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: PADDING_H,
          paddingTop: rs.ms(12),
          paddingBottom: rs.ms(24),
        }}
        columnWrapperStyle={{ columnGap: GAP, marginBottom: GAP }}
        renderItem={({ item }) => (
          <CompanyTile
            name={item.name}
            logoUri={item.logoUrl}
            initial={item.name[0]}
            onPress={() => onPressCompany(item)}
            containerStyle={{ width: ITEM_W }}
          />
        )}
      />
    </SafeAreaView>
  );
};

export default CompaniesScreen;

type Themed = ReturnType<typeof useDesign>["theme"];
const makeStyles = (t: Themed) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.backgroundColor },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: rs.ms(16),
      paddingTop: rs.ms(4),
      paddingBottom: rs.ms(10),
    },
    backBtn: { padding: rs.ms(4) },
    title: { color: t.textColor, fontSize: t.h4, fontWeight: t.bold },
  });
