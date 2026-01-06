import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ref, get, update } from "firebase/database";

import { auth, db } from "../services/firebase";
import { logout } from "../services/auth";

async function fetchUserNode(uid) {
  if (!uid) return null;
  try {
    const snap = await get(ref(db, `users/${uid}`));
    return snap.exists() ? snap.val() : null;
  } catch {
    return null;
  }
}

function Row({ label, value, onPress }) {
  return (
    <Pressable style={styles.rowBtn} onPress={onPress}>
      <View>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#8B97AD" />
    </Pressable>
  );
}

export default function EditProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("User");
  const [email, setEmail] = useState("—");

  const [disableVisible, setDisableVisible] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [disableErr, setDisableErr] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    const u = auth.currentUser;
    const uid = u?.uid;

    const node = await fetchUserNode(uid);

    const nameFallback =
      node?.fullName ||
      u?.displayName ||
      (u?.email ? u.email.split("@")[0] : null) ||
      "User";

    const emailFallback = u?.email || node?.email || "—";

    setFullName(nameFallback);
    setEmail(emailFallback);
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener("focus", refresh);
    refresh();
    return unsub;
  }, [navigation, refresh]);

  const goBackToProfileTab = () => {
    navigation.navigate("MainTabs", { screen: "Profile" });
  };

  const openDisableModal = () => {
    setDisableErr("");
    setDisableVisible(true);
  };

  const onConfirmDisable = async () => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setDisableErr("Not logged in. Please login again.");
      return;
    }
    if (disabling) return;

    try {
      setDisabling(true);
      setDisableErr("");

      await update(ref(db, `users/${uid}`), { disabled: true });

      await logout();
      setDisableVisible(false);
      navigation.replace("Login");
    } catch (e) {
      setDisableErr(e?.message || "Could not disable account. Please try again.");
    } finally {
      setDisabling(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#0B3A8D", "#061A33"]} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <Image
                source={require("../../assets/logo.png")}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={styles.headerBrand}>AquaVolt</Text>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backRow} onPress={goBackToProfileTab}>
          <Ionicons name="chevron-back" size={18} color="#0B1220" />
          <Text style={styles.backText}>Edit Profile</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Account Details</Text>

          <Row
            label="Full Name"
            value={loading ? "..." : fullName}
            onPress={() => navigation.navigate("EditName")}
          />

          <Row
            label="Email"
            value={loading ? "..." : email}
            onPress={() => navigation.navigate("EditEmail")}
          />

          <Row
            label="Password"
            value="********"
            onPress={() => navigation.navigate("EditPassword")}
          />
        </View>

        <Pressable
          style={[styles.disableBtn, disabling && { opacity: 0.7 }]}
          onPress={openDisableModal}
          disabled={disabling}
        >
          <Ionicons name="ban-outline" size={18} color="#FFFFFF" />
          <Text style={styles.disableText}>{disabling ? "Disabling..." : "Disable Account"}</Text>
        </Pressable>

        <View style={{ height: 28 }} />
      </ScrollView>

      <Modal
        visible={disableVisible}
        animationType="fade"
        transparent
        onRequestClose={() => !disabling && setDisableVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Disable Account</Text>
            <Text style={styles.modalSub}>
              Disabling your account will temporarily deactivate access to the app. Your data will remain stored and you
              can reactivate your account at any time.
            </Text>

            {!!disableErr && <Text style={styles.modalError}>{disableErr}</Text>}

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => setDisableVisible(false)}
                disabled={disabling}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, styles.modalBtnDanger, disabling ? { opacity: 0.75 } : null]}
                onPress={onConfirmDisable}
                disabled={disabling}
              >
                <Text style={styles.modalBtnDangerText}>Yes, Disable Account</Text>
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
  cardTitle: { fontSize: 14, fontWeight: "900", color: "#0B1220", marginBottom: 10 },

  rowBtn: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8E0EF",
    paddingHorizontal: 12,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLabel: { fontSize: 11, fontWeight: "900", color: "#5D6B86" },
  rowValue: { marginTop: 2, fontSize: 13, fontWeight: "900", color: "#0B1220", maxWidth: 250 },

  disableBtn: {
    marginTop: 14,
    alignSelf: "center",
    width: "86%",
    maxWidth: 380,
    backgroundColor: "#C91515",
    borderRadius: 12,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  disableText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#D8E0EF",
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
  modalError: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: "800",
    color: "#D23B3B",
    textAlign: "center",
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  modalBtnSecondary: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D8E0EF" },
  modalBtnSecondaryText: { color: "#6B7A99", fontWeight: "900", fontSize: 12 },
  modalBtnDanger: { backgroundColor: "#C91515" },
  modalBtnDangerText: { color: "#FFFFFF", fontWeight: "900", fontSize: 12 },
});
