import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { doc, addDoc, collection, serverTimestamp } from "firebase/firestore";

import { useDesign } from "../../design/DesignProvider";
import { rs } from "../../utils/responsive";
import { auth, db } from "../../lib/firebase";
import { mapAuthError } from "../../utils/firebaseErrors";
import FormInput from "../../components/FormInput";
import PrimaryButton from "../../components/PrimaryButton";

type Nav = any;

const LoginScreen: React.FC = () => {
  const { theme: t } = useDesign();
  const s = useMemo(() => makeStyles(t), [t]);
  const nav = useNavigation<Nav>();
  const route = useRoute<any>();

  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // accept prefill from Register
  useEffect(() => {
    const p = route?.params || {};
    if (p.emailPrefill && typeof p.emailPrefill === "string") {
      setEmail(p.emailPrefill);
    }
    // optional immediate reset
    if (p.resetNow && p.emailPrefill) {
      sendPasswordResetEmail(auth, p.emailPrefill).catch(() => {});
    }
  }, [route?.params]);

  const emailOk = /\S+@\S+\.\S+/.test(email);
  const passOk = pass.length >= 6;
  const canSubmit = emailOk && passOk && !loading;

  const logActivity = async (uid: string, type: string) => {
    try {
      const col = collection(doc(db, "users", uid), "activities");
      await addDoc(col, { type, ts: serverTimestamp() });
    } catch {}
  };

  const onForgot = async () => {
    if (!emailOk) {
      setErr("Enter a valid email first.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setErr("Password reset email sent. Check your inbox.");
    } catch (e: any) {
      setErr(mapAuthError(e));
    }
  };

  const onLogin = async () => {
    if (!canSubmit) return;
    setErr(null);
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, pass);
      await logActivity(cred.user.uid, "user_login");
      // Navigation typically handled by auth gate (onAuthStateChanged)
    } catch (e: any) {
      setErr(mapAuthError(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: rs.ms(24) }} keyboardShouldPersistTaps="handled">

          {/* Header / Logo */}
          <View style={s.header}>
            <View style={s.logoBox}>
              <Image
                source={require("../../../assets/images/logo.png")}
                style={s.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={s.title}>Welcome</Text>
            <Text style={s.subtitle}>Enter your account here</Text>
          </View>

          {/* Error banner */}
          {err ? (
            <View style={s.errBox}>
              <Text style={s.errText}>{err}</Text>
            </View>
          ) : null}

          {/* Form */}
          <FormInput
            label="Email"
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
            errorText={email.length > 0 && !emailOk ? "Invalid email" : undefined}
          />

          <FormInput
            label="Password"
            placeholder="Password"
            textContentType="password"
            value={pass}
            onChangeText={setPass}
            secureTextEntry
            secureToggle
            errorText={pass.length > 0 && !passOk ? "At least 6 characters" : undefined}
          />

          <View style={s.rowRight}>
            <Pressable onPress={onForgot}>
              <Text style={[s.smallLink, { color: t.appColor || t.primaryColor }]}>Forgot password?</Text>
            </Pressable>
          </View>

          <PrimaryButton label={loading ? "Signing In..." : "Sign In"} onPress={onLogin} disabled={!canSubmit} />

          <View style={s.bottomRow}>
            <Text style={s.bottomText}>Don’t have an account? </Text>
            <Pressable onPress={() => nav.navigate("Register")}>
              <Text style={[s.bottomText, { color: t.appColor || t.primaryColor, fontWeight: t.semiBold }]}>
                Sign Up
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default LoginScreen;

const makeStyles = (t: ReturnType<typeof useDesign>["theme"]) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: t.backgroundColor },
    header: { alignItems: "center", paddingTop: rs.ms(12), paddingBottom: rs.ms(8) },
    logoBox: {
      width: rs.ms(56),
      height: rs.ms(56),
      borderRadius: rs.ms(14),
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: (t.appColor || t.primaryColor) + "1A",
      marginBottom: rs.ms(8),
    },
    logo: { width: rs.ms(32), height: rs.ms(32) },
    title: { color: t.textColor, fontSize: t.h4, fontWeight: t.bold },
    subtitle: { color: t.subtextColor, fontSize: t.small, marginTop: rs.ms(4) },

    rowRight: { marginHorizontal: rs.ms(16), marginTop: rs.ms(8), alignItems: "flex-end" },
    smallLink: { fontSize: t.small },

    errBox: {
      marginHorizontal: rs.ms(16),
      marginTop: rs.ms(10),
      borderRadius: rs.ms(10),
      backgroundColor: (t.errorColor ?? "#e14848") + "1A",
      paddingVertical: rs.ms(10),
      paddingHorizontal: rs.ms(12),
    },
    errText: { color: t.errorColor ?? "#e14848", fontSize: t.small },

    bottomRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: rs.ms(16),
    },
    bottomText: { color: t.subtextColor, fontSize: t.h6 },
  });
