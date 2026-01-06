import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, Alert, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ref, update, get, query, orderByChild, equalTo } from "firebase/database";
import { reload, verifyBeforeUpdateEmail } from "firebase/auth";

import { auth, db } from "../services/firebase";

const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

async function isEmailTaken(emailLower, currentUid) {
  const q = query(ref(db, "users"), orderByChild("email"), equalTo(emailLower));
  const snap = await get(q);
  if (!snap.exists()) return false;

  const val = snap.val();
  const foundUid = Object.keys(val || {})[0];
  return foundUid && foundUid !== currentUid;
}

export default function EditEmailScreen({ navigation }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValue(auth.currentUser?.email || "");
  }, []);

  const onSave = async () => {
    const u = auth.currentUser;
    const uid = u?.uid;
    if (!u || !uid) return Alert.alert("Not logged in", "Please login again.");

    const newEmail = value.trim().toLowerCase();
    const currentEmail = (u.email || "").trim().toLowerCase();

    if (!isValidEmail(newEmail)) {
      return Alert.alert("Invalid email", "Please enter a valid email address.");
    }

    if (newEmail === currentEmail) {
      return Alert.alert("No changes", "That email is already your current email.");
    }

    try {
      setSaving(true);

      await reload(u);

      if (!u.emailVerified) {
        Alert.alert(
          "Verify your email first",
          "Please verify your current email before changing it."
        );
        navigation.navigate("VerifyEmail");
        return;
      }

      const taken = await isEmailTaken(newEmail, uid);
      if (taken) {
        Alert.alert("Email taken", "That email is already registered.");
        return;
      }

      await verifyBeforeUpdateEmail(u, newEmail);

      await update(ref(db, `users/${uid}`), {
        pendingEmail: newEmail,
        pendingEmailLower: newEmail,
        emailVerified: false,
        verifiedAt: null,
      });

      navigation.navigate("VerifyEmail");
    } catch (e) {
      if (e?.code === "auth/requires-recent-login") {
        Alert.alert(
          "Re-login required",
          "For security, please confirm your password again.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Continue",
              onPress: () =>
                navigation.navigate("ConfirmPassword", {
                  next: "EditEmail",
                  title: "Confirm Password",
                }),
            },
          ]
        );
      } else {
        Alert.alert("Update failed", e?.message || "Please try again.");
      }
    } finally {
      setSaving(false);
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
          <Text style={styles.backText}>Email</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="Enter your email"
            style={styles.input}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={styles.hint}>
            After changing your email, you must verify the NEW email to finish the changes, and re-login using your new email.
          </Text>

          <Pressable style={[styles.saveBtn, saving && { opacity: 0.6 }]} disabled={saving} onPress={onSave}>
            <Text style={styles.saveText}>{saving ? "Saving..." : "Save Changes"}</Text>
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

  label: { fontSize: 11, fontWeight: "900", color: "#5D6B86", marginBottom: 6 },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D8E0EF",
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: "800",
    color: "#0B1220",
    backgroundColor: "#FFFFFF",
  },
  hint: { marginTop: 8, fontSize: 11, fontWeight: "700", color: "#7C8AA6", lineHeight: 15 },

  saveBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#2F5FE8",
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
});
