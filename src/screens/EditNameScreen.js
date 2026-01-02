import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, Alert, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ref, get, update } from "firebase/database";

import { auth, db } from "../services/firebase";

// ✅ same formatter style as SignUpScreen
function formatFullName(value) {
  const clean = String(value || "")
    .trim()
    .replace(/\s+/g, " "); // collapse multiple spaces

  if (!clean) return "";

  return clean
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
}

export default function EditNameScreen({ navigation }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const snap = await get(ref(db, `users/${uid}/fullName`));
      if (snap.exists()) setValue(String(snap.val() || ""));
    })();
  }, []);

  const onSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return Alert.alert("Not logged in", "Please login again.");

    const formatted = formatFullName(value);

    if (formatted.length < 2) return Alert.alert("Invalid name", "Please enter your full name.");

    try {
      setSaving(true);
      await update(ref(db, `users/${uid}`), { fullName: formatted });

      // ✅ also update local input so user immediately sees formatted version
      setValue(formatted);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Save failed", e?.message || "Please try again.");
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
          <Text style={styles.backText}>Full Name</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            onBlur={() => setValue((v) => formatFullName(v))} // ✅ auto-format like signup
            placeholder="Enter your full name"
            style={styles.input}
            autoCapitalize="words"
          />

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
