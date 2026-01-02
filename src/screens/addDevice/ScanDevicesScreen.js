import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

function FlowHeader({ title, onBack }) {
  return (
    <LinearGradient colors={["#0B3A8D", "#061A33"]} style={styles.header}>
      <SafeAreaView edges={["top"]}>
        <View style={styles.headerRow}>
          <Pressable onPress={onBack} style={styles.backBtn} hitSlop={10}>
            <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={{ width: 42 }} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default function ScanDevicesScreen({ navigation }) {
  const [scanning, setScanning] = useState(true);

  const foundDevice = useMemo(
    () => ({
      id: "ESP32-AV-8F3D",
      name: "AquaVolt Device",
    }),
    []
  );

  useEffect(() => {
    const t = setTimeout(() => setScanning(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const onPick = () => {
    navigation.navigate("WifiCredentials", { device: foundDevice });
  };

  return (
    <View style={styles.root}>
      <FlowHeader title="Scan" onBack={() => navigation.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.bigTitle}>Scanning for Devices</Text>
        <Text style={styles.subTitle}>Looking for nearby ESP32 devices...</Text>

        <View style={styles.listCard}>
          <View style={styles.scanRow}>
            <Ionicons name={scanning ? "sync" : "checkmark-circle"} size={18} color={scanning ? "#2F5FE8" : "#22C55E"} />
            <Text style={styles.scanText}>{scanning ? "Scanning..." : "1 device found"}</Text>
          </View>

          <Pressable onPress={onPick} style={styles.deviceItem} disabled={scanning}>
            <View style={styles.deviceLeft}>
              <View style={styles.wifiIconBox}>
                <Ionicons name="wifi" size={18} color="#0B3A8D" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceName}>{foundDevice.id}</Text>
                <Text style={styles.deviceSub}>{foundDevice.name}</Text>
              </View>
            </View>

            <View style={styles.deviceRight}>
              <View style={[styles.badge, { backgroundColor: scanning ? "#E5E7EB" : "#DCFCE7" }]}>
                <Text style={[styles.badgeText, { color: scanning ? "#6B7280" : "#166534" }]}>
                  {scanning ? "..." : "Available"}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#8B97AD" />
            </View>
          </Pressable>
        </View>

        <Pressable onPress={() => navigation.goBack()} style={styles.bottomBtn}>
          <Text style={styles.bottomBtnText}>Back</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EAF6FF" },

  header: { paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 999 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },

  content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 20 },
  bigTitle: { marginTop: 8, fontSize: 18, fontWeight: "900", color: "#0B1220", textAlign: "center" },
  subTitle: { marginTop: 6, fontSize: 12, fontWeight: "700", color: "#7C8AA6", textAlign: "center" },

  listCard: {
    marginTop: 18,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D7E3F2",
    padding: 12,
  },
  scanRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  scanText: { fontSize: 12, fontWeight: "800", color: "#2E3A59" },

  deviceItem: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8E0EF",
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deviceLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  wifiIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#EAF2FF",
    alignItems: "center",
    justifyContent: "center",
  },
  deviceName: { fontSize: 13, fontWeight: "900", color: "#0B1220" },
  deviceSub: { marginTop: 2, fontSize: 11, fontWeight: "700", color: "#7C8AA6" },
  deviceRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: "900" },

  bottomBtn: {
    marginTop: 22,
    backgroundColor: "#EFEFEF",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBtnText: { fontSize: 12, fontWeight: "900", color: "#8A8A8A" },
});
