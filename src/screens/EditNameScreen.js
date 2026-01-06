import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, Alert, Image, ScrollView, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ref, get, update } from "firebase/database";

import { auth, db } from "../services/firebase";

function formatFullName(value) {
  const clean = String(value || "")
    .trim()
    .replace(/\s+/g, " ");

  if (!clean) return "";

  return clean
    .split(" ")
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : ""))
    .join(" ");
}

export default function EditNameScreen({ navigation }) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

  const [successVisible, setSuccessVisible] = useState(false);

  useEffect(() => {
    (async () => {
      const uid = auth.currentUser?.uid;
      if (!uid) return;

      const snap = await get(ref(db, `users/${uid}/fullName`));
      if (snap.exists()) setValue(String(snap.val() || ""));
    })();
  }, []);

  const closeSuccess = () => {
    setSuccessVisible(false);
    navigation.navigate({
      name: "EditProfile",
      params: { updated: "name" },
      merge: true,
    });
  };

  const onSave = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) return Alert.alert("Not logged in", "Please login again.");

    const formatted = formatFullName(value);
    if (formatted.length < 2) return Alert.alert("Invalid name", "Please enter your full name.");

    try {
      setSaving(true);
      await update(ref(db, `users/${uid}`), { fullName: formatted });

      setValue(formatted);

      setSuccessVisible(true);
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
            onBlur={() => setValue((v) => formatFullName(v))}
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

      <Modal visible={successVisible} animationType="fade" transparent onRequestClose={() => setSuccessVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Name Updated</Text>
            <Text style={styles.modalSub}>Your full name has been updated successfully.</Text>

            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalBtnPrimary]} onPress={closeSuccess}>
                <Text style={styles.modalBtnPrimaryText}>OK</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modalCard: {
    width: "92%",       
    maxWidth: 420,      
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,       
    borderWidth: 1,
    borderColor: "#D8E0EF",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0B1220",
    textAlign: "center",
  },
  modalSub: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7A99",
    textAlign: "center",
    lineHeight: 16,
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  modalBtnPrimary: { backgroundColor: "#2F5FE8" },
  modalBtnPrimaryText: { color: "#FFFFFF", fontWeight: "900", fontSize: 12 },
});
