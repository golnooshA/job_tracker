import React, { useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, addDoc, collection } from "firebase/firestore";

import { useDesign } from "../../design/DesignProvider";
import { rs } from "../../utils/responsive";
import { auth, db } from "../../lib/firebase";
import { mapAuthError } from "../../utils/firebaseErrors";
import FormInput from "../../components/FormInput";
import PrimaryButton from "../../components/PrimaryButton";

type Nav = any;

const RegisterScreen: React.FC = () => {
  const { theme: t } = useDesign();
  const s = useMemo(() => makeStyles(t), [t]);
  const nav = useNavigation<Nav>();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [errCode, setErrCode] = useState<string | null>(null);

  const emailRef = useRef<TextInput>(null);
  const passRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const emailOk = /\S+@\S+\.\S+/.test(email);
  const nameOk = fullName.trim().length > 1;
  const passOk = pass.length >= 6;
  const confirmOk = confirm === pass && confirm.length > 0;
  const canSubmit = nameOk && emailOk && passOk && confirmOk && !loading;

  const logActivity = async (uid: string, type: string) => {
    try {
      const col = collection(doc(db, "users", uid), "activities");
      await addDoc(col, { type, ts: serverTimestamp() });
    } catch {}
  };

  const onSubmit = async () => {
    if (!canSubmit) return;
    setErr(null); setErrCode(null);
    setLoading(true);
    try {
      // proactive check to give nicer UX
      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods?.length) {
        setErr("An account with this email already exists.");
        setErrCode("auth/email-already-in-use");
        return;
      }

      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: fullName });

      await setDoc(
        doc(db, "users", cred.user.uid),
        { fullName, email, createdAt: serverTimestamp(), updatedAt: serverTimestamp() },
        { merge: true }
      );

      await logActivity(cred.user.uid, "user_register");
      // auth gate will switch to app when onAuthStateChanged fires
    } catch (e: any) {
      setErr(mapAuthError(e));
      setErrCode(e?.code || null);
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
            <Text style={s.title}>New Account</Text>
            <Text style={s.subtitle}>Create your account here</Text>
          </View>

          {/* Error banner + quick actions */}
          {err ? (
            <View style={s.errBox}>
              <Text style={s.errText}>{err}</Text>
              {errCode === "auth/email-already-in-use" && (
                <View style={{ flexDirection: "row", gap: rs.ms(12), marginTop: rs.ms(8) }}>
                  <Pressable onPress={() => nav.navigate("Login", { emailPrefill: email })}>
                    <Text style={[s.errLink, { color: t.appColor || t.primaryColor }]}>Go to Sign In</Text>
                  </Pressable>
                  <Pressable onPress={() => nav.navigate("Login", { emailPrefill: email, resetNow: true })}>
                    <Text style={[s.errLink, { color: t.appColor || t.primaryColor }]}>Reset Password</Text>
                  </Pressable>
                </View>
              )}
            </View>
          ) : null}

          {/* Form */}
          <FormInput
            label="Full Name"
            placeholder="Full Name"
            autoCapitalize="words"
            textContentType="name"
            returnKeyType="next"
            value={fullName}
            onChangeText={setFullName}
            onSubmitEditing={() => emailRef.current?.focus()}
            errorText={fullName.length > 0 && !nameOk ? "Enter your full name" : undefined}
          />

          <FormInput
            ref={emailRef}
            label="Email"
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            textContentType="emailAddress"
            returnKeyType="next"
            value={email}
            onChangeText={setEmail}
            onSubmitEditing={() => passRef.current?.focus()}
            errorText={email.length > 0 && !emailOk ? "Invalid email" : undefined}
          />

          <FormInput
            ref={passRef}
            label="Password"
            placeholder="Password"
            textContentType="password"
            returnKeyType="next"
            value={pass}
            onChangeText={setPass}
            secureTextEntry
            secureToggle
            onSubmitEditing={() => confirmRef.current?.focus()}
            errorText={pass.length > 0 && !passOk ? "At least 6 characters" : undefined}
          />

          <FormInput
            ref={confirmRef}
            label="Confirm Password"
            placeholder="Confirm Password"
            textContentType="password"
            returnKeyType="done"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
            secureToggle
            onSubmitEditing={onSubmit}
            errorText={confirm.length > 0 && !confirmOk ? "Passwords do not match" : undefined}
          />

          <PrimaryButton label={loading ? "Signing Up..." : "Sign Up"} onPress={onSubmit} disabled={!canSubmit} />

          <View style={s.bottomRow}>
            <Text style={s.bottomText}>Already have an account? </Text>
            <Pressable onPress={() => nav.navigate("Login")}>
              <Text style={[s.bottomText, { color: t.appColor || t.primaryColor, fontWeight: t.semiBold }]}>
                Sign In
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default RegisterScreen;

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

    errBox: {
      marginHorizontal: rs.ms(16),
      marginTop: rs.ms(10),
      borderRadius: rs.ms(10),
      backgroundColor: (t.errorColor ?? "#e14848") + "1A",
      paddingVertical: rs.ms(10),
      paddingHorizontal: rs.ms(12),
    },
    errText: { color: t.errorColor ?? "#e14848", fontSize: t.small },
    errLink: { fontSize: t.small, fontWeight: t.semiBold },

    bottomRow: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: rs.ms(16),
    },
    bottomText: { color: t.subtextColor, fontSize: t.h6 },
  });
