import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ref, get } from "firebase/database";
import { auth, db } from "../services/firebase";

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
});
