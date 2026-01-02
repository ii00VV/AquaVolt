import React, { useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, Alert, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth } from "../services/firebase";

export default function ConfirmPasswordScreen({ navigation, route }) {
  const next = route?.params?.next || "EditProfile";
  const nextParams = route?.params?.nextParams || {};
  const title = route?.params?.title || "Confirm Password";

  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const onContinue = async () => {
    const u = auth.currentUser;
    if (!u?.email) return Alert.alert("Not logged in", "Please login again.");

    if (!pw.trim()) return Alert.alert("Required", "Please enter your password.");

    try {
      setLoading(true);
      const cred = EmailAuthProvider.credential(u.email, pw);
      await reauthenticateWithCredential(u, cred);

      // ✅ Replace so user can’t “back” into confirm screen
      navigation.replace(next, nextParams);
    } catch (e) {
      const msg =
        e?.code === "auth/wrong-password"
          ? "Incorrect password."
          : e?.message || "Could not confirm password.";
      Alert.alert("Failed", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#0B3A8D", "#061A33"]} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <Image source={require("../../assets/logo.png")} style={styles.headerLogo} resizeMode="contain" />
              <Text style={styles.headerBrand}>AquaVolt</Text>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={18} color="#0B1220" />
          <Text style={styles.backText}>{title}</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.bigTitle}>Security Check</Text>
          <Text style={styles.sub}>
            Please enter your password to continue editing your profile.
          </Text>

          <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              value={pw}
              onChangeText={setPw}
              placeholder="Enter password"
              style={styles.passwordInput}
              secureTextEntry={!showPw}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPw((s) => !s)} style={styles.eyeBtn}>
              <Ionicons name={showPw ? "eye-off" : "eye"} size={20} color="#8B97AD" />
            </Pressable>
          </View>

          <Pressable
            style={[styles.continueBtn, loading && { opacity: 0.6 }]}
            onPress={onContinue}
            disabled={loading}
          >
            <Text style={styles.continueText}>{loading ? "Checking..." : "Continue"}</Text>
          </Pressable>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EAF6FF" },

  header: { paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: { width: 38, height: 38 },
  headerBrand: { color: "#fff", fontSize: 22, fontWeight: "900" },

  content: { paddingTop: 14, paddingBottom: 10 },

  backRow: {
    width: "86%",
    maxWidth: 380,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  backText: { fontSize: 14, fontWeight: "900", color: "#0B1220" },

  card: {
    width: "86%",
    maxWidth: 380,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8E0EF",
    padding: 12,
  },

  bigTitle: { fontSize: 16, fontWeight: "900", color: "#0B1220" },
  sub: { marginTop: 6, fontSize: 12, fontWeight: "700", color: "#7C8AA6", lineHeight: 16 },

  label: { fontSize: 11, fontWeight: "900", color: "#5D6B86", marginBottom: 6 },

  passwordWrap: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D8E0EF",
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: { flex: 1, fontSize: 13, fontWeight: "800", color: "#0B1220" },
  eyeBtn: { paddingLeft: 10, paddingVertical: 6 },

  continueBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#2F5FE8",
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },

  hint: { marginTop: 10, fontSize: 11, fontWeight: "700", color: "#7C8AA6", lineHeight: 15 },
});
