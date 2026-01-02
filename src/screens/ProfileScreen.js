import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ref, get } from "firebase/database";

import { auth, db } from "../services/firebase";
import { logout } from "../services/auth";
import { getSavedDevice } from "../services/deviceStore"; // ✅ add this

async function fetchUserNode(uid) {
  if (!uid) return null;
  try {
    const snap = await get(ref(db, `users/${uid}`));
    return snap.exists() ? snap.val() : null;
  } catch {
    return null;
  }
}

function ProfileRow({ label, value, onPress }) {
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

function DevicePill({ id, online = true }) {
  return (
    <View style={styles.devicePill}>
      <View style={styles.deviceLeft}>
        <Ionicons name="hardware-chip-outline" size={18} color="#5D6B86" />
        <Text style={styles.deviceId} numberOfLines={1}>
          {id}
        </Text>
      </View>
      <View style={[styles.statusDot, { backgroundColor: online ? "#25C25A" : "#D23B3B" }]} />
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("User");
  const [email, setEmail] = useState("—");

  const [loadingDevice, setLoadingDevice] = useState(true);
  const [device, setDevice] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadingDevice(true);

    const u = auth.currentUser;
    const uid = u?.uid;

    // ✅ fetch user node
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

    // ✅ fetch device per user (AsyncStorage keyed by uid)
    try {
      const d = await getSavedDevice(uid);
      setDevice(d || null);
    } catch {
      setDevice(null);
    } finally {
      setLoadingDevice(false);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener("focus", refresh);
    refresh();
    return unsub;
  }, [navigation, refresh]);

  const onEditProfile = () =>
    navigation.navigate("ConfirmPassword", {
      next: "EditProfile",
      title: "Confirm Password",
    });

  const onLogout = async () => {
    try {
      await logout();
      navigation.replace("Login");
    } catch (e) {
      Alert.alert("Logout failed", e?.message || "Please try again.");
    }
  };

  const deviceId = device?.id || device?.deviceId || "—";
  const deviceOnline = device?.online ?? true; // frontend demo default true

  return (
    <View style={styles.root}>
      {/* Header */}
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={44} color="#FFFFFF" />
          </View>
          <Text style={styles.userName}>{loading ? "..." : fullName}</Text>
        </View>

        {/* ✅ Profile card */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle}>Profile</Text>
            <Pressable style={styles.editBtn} onPress={onEditProfile}>
              <Ionicons name="create-outline" size={16} color="#0B1220" />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </Pressable>
          </View>

          <ProfileRow label="Full Name" value={loading ? "..." : fullName} onPress={onEditProfile} />
          <ProfileRow label="Email" value={loading ? "..." : email} onPress={onEditProfile} />
          <ProfileRow label="Password" value="********" onPress={onEditProfile} />
        </View>

        {/* ✅ Connected device card (back) */}
        <View style={styles.deviceCard}>
          <Text style={styles.deviceCardTitle}>Connected Device</Text>

          {loadingDevice ? (
            <Text style={styles.mutedText}>Checking connected device...</Text>
          ) : device ? (
            <DevicePill id={deviceId} online={deviceOnline} />
          ) : (
            <Text style={styles.mutedText}>No device connected yet.</Text>
          )}
        </View>

        <Pressable style={styles.logoutBtn} onPress={onLogout}>
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </Pressable>

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

  content: { paddingBottom: 10 },

  avatarWrap: { alignItems: "center", marginTop: 16, marginBottom: 12 },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 90,
    backgroundColor: "#1D3E9A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  userName: { marginTop: 10, fontSize: 18, fontWeight: "900", color: "#0B1220" },

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

  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: "900", color: "#0B1220" },

  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EEF5FF",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
  },
  editBtnText: { fontSize: 12, fontWeight: "900", color: "#0B1220" },

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

  // ✅ Device card styles
  deviceCard: {
    width: "86%",
    maxWidth: 380,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8E0EF",
    padding: 12,
    marginTop: 12,
  },
  deviceCardTitle: { fontSize: 14, fontWeight: "900", color: "#0B1220", marginBottom: 10 },
  mutedText: { fontSize: 12, fontWeight: "700", color: "#7C8AA6" },

  devicePill: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8E0EF",
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deviceLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  deviceId: { fontSize: 13, fontWeight: "900", color: "#0B1220", maxWidth: 260 },
  statusDot: { width: 10, height: 10, borderRadius: 10 },

  logoutBtn: {
    marginTop: 16,
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
  logoutText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
});
