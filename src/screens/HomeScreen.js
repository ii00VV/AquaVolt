import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, Image, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

import { getSavedDevice } from "../services/deviceStore";
import { auth, db } from "../services/firebase";
import { ref, get } from "firebase/database";

const TILE_GRADIENTS = {
  flow: ["#0093D8", "#004E72"],
  voltage: ["#166F98", "#072432"],
  battery: ["#24B2C2", "#11555C"],
  water: ["#367EB9", "#183853"],
};

function MetricTile({
  icon,
  value,
  unit,
  label,
  status = "On",
  minutes = "30m",
  gradient = TILE_GRADIENTS.flow,
}) {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.tile}
    >
      <View style={styles.tileInner}>
        <View style={styles.tileTopRow}>
          <Ionicons name={icon} size={28} color="#FFFFFF" style={{ opacity: 0.95 }} />
          <View style={styles.valueBlock}>
            <Text style={styles.tileValue}>{value}</Text>
            <Text style={styles.tileUnit}>{unit}</Text>
          </View>
        </View>

        <Text style={styles.tileLabel}>{label}</Text>

        <View style={styles.tileBottomRow}>
          <Text style={styles.tileMeta}>{status}</Text>
          <Text style={styles.tileMeta}>{minutes}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function EnergyCard({ kwh = 5.3, target = 6.2 }) {
  const pct = useMemo(() => {
    if (!target || target <= 0) return 0;
    const p = Math.round((kwh / target) * 100);
    return Math.max(0, Math.min(100, p));
  }, [kwh, target]);

  return (
    <View style={styles.energyCard}>
      <Text style={styles.energyTitle}>TODAY’S ENERGY PRODUCTION</Text>

      <View style={styles.energyRow}>
        <Ionicons name="flash" size={24} color="#2E3A59" />
        <Text style={styles.energyValue}>
          {kwh.toFixed(1)} <Text style={styles.energyUnit}>kWh</Text>
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>

      <View style={styles.energyFooter}>
        <Text style={styles.energyFooterText}>{pct}% of Production</Text>
      </View>
    </View>
  );
}

function formatUptime(connectedAt) {
  if (!connectedAt) return "0h 0m";
  const ms = Date.now() - connectedAt;
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return `${h}h ${m}m`;
}

async function fetchFullName(uid) {
  if (!uid) return null;
  try {
    const snap = await get(ref(db, `users/${uid}/fullName`));
    return snap.exists() ? snap.val() : null;
  } catch (e) {
    return null;
  }
}

export default function HomeScreen({ navigation }) {
  const [loadingDevice, setLoadingDevice] = useState(true);
  const [device, setDevice] = useState(null);

  const [loadingName, setLoadingName] = useState(true);
  const [fullName, setFullName] = useState("User");

  const refreshAll = useCallback(async () => {
    const uid = auth.currentUser?.uid;

    setLoadingDevice(true);
    const d = await getSavedDevice(uid);
    setDevice(d);
    setLoadingDevice(false);

    setLoadingName(true);
    const dbName = await fetchFullName(uid);

    const fallback =
      dbName ||
      auth.currentUser?.displayName ||
      (auth.currentUser?.email ? auth.currentUser.email.split("@")[0] : null) ||
      "User";

    setFullName(fallback);
    setLoadingName(false);
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener("focus", refreshAll);
    refreshAll();
    return unsub;
  }, [navigation, refreshAll]);

  const goAddDevice = () => {
    const parent = navigation.getParent?.();
    if (parent?.navigate) parent.navigate("AddDeviceFlow");
    else navigation.navigate("AddDeviceFlow");
  };

  const deviceId = device?.id || "—";
  const uptime = device?.connectedAt ? formatUptime(device.connectedAt) : "0h 0m";

  return (
    <View style={styles.page}>
      <LinearGradient colors={["#0B3A8D", "#061A33"]} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <Image source={require("../../assets/logo.png")} style={styles.headerLogo} resizeMode="contain" />
              <Text style={styles.headerBrand}>AquaVolt</Text>
            </View>

            <Pressable onPress={() => navigation.navigate("Notifications")} style={styles.bellBtn}>
              <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.pageTitleWrap}>
          <Text style={styles.pageTitle}>Welcome, {loadingName ? "..." : fullName}</Text>
          <Text style={styles.pageSub}>Realtime monitoring</Text>
        </View>

        {!loadingDevice && !device && (
          <View style={styles.emptyWrap}>
            <Text style={styles.noDeviceTitle}>No device connected yet</Text>
            <Text style={styles.noDeviceSub}>
              Add your AquaVolt ESP32 device to start monitoring sensor data and energy production.
            </Text>

            <View style={styles.quickCard}>
              <Text style={styles.quickTitle}>Quick Actions</Text>

              <Pressable onPress={goAddDevice} style={styles.quickBtn}>
                <Ionicons name="add" size={18} color="#2F5FE8" />
                <Text style={styles.quickBtnText}>Add Device</Text>
              </Pressable>
            </View>
          </View>
        )}

        {!loadingDevice && !!device && (
          <>
            <View style={styles.welcomeCard}>
              <View style={styles.deviceRow}>
                <View style={styles.dot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.deviceLine}>{deviceId} - Online</Text>
                  <Text style={styles.deviceSub}>Uptime: {uptime}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <Text style={styles.activeSensors}>ACTIVE SENSOR (4/4)</Text>

              <View style={styles.grid}>
                <MetricTile icon="water-outline" value="12.4" unit="L/min" label="Flow Rate" gradient={TILE_GRADIENTS.flow} />
                <MetricTile icon="flash-outline" value="25.3" unit="Volts" label="Voltage" gradient={TILE_GRADIENTS.voltage} />
                <MetricTile icon="battery-half-outline" value="95%" unit="Charged" label="Battery" gradient={TILE_GRADIENTS.battery} />
                <MetricTile icon="water" value="1,764" unit="Liters" label="Water Level" gradient={TILE_GRADIENTS.water} />
              </View>
            </View>

            <EnergyCard kwh={5.3} target={6.2} />
          </>
        )}

        {loadingDevice && (
          <View style={styles.loadingCard}>
            <Text style={styles.noDeviceTitle}>Loading...</Text>
            <Text style={styles.noDeviceSub}>Checking your connected device.</Text>
          </View>
        )}

        <View style={{ height: 28 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#EAF6FF" },

  header: { paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerLogo: { width: 38, height: 38 },
  headerBrand: { color: "#fff", fontSize: 22, fontWeight: "900" },
  bellBtn: { padding: 10, borderRadius: 999 },

  scroll: { flex: 1 },
  scrollContent: { alignItems: "center", paddingTop: 14, paddingBottom: 10 },

  pageTitleWrap: { width: "86%", maxWidth: 360, marginBottom: 12 },
  pageTitle: { fontSize: 22, fontWeight: "900", color: "#0B1220" },
  pageSub: { marginTop: 2, fontSize: 12, color: "#7C8AA6", fontWeight: "600" },

  welcomeCard: {
    width: "86%",
    maxWidth: 360,
    backgroundColor: "#F7FBFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D7E3F2",
    marginTop: 6,
  },

  divider: { height: 1, backgroundColor: "#D7E3F2", marginVertical: 10 },

  noDeviceTitle: { fontSize: 14, fontWeight: "900", color: "#0B1220" },
  noDeviceSub: { marginTop: 6, fontSize: 12, fontWeight: "700", color: "#7C8AA6", lineHeight: 16 },

  emptyWrap: {
    width: "86%",
    maxWidth: 360,
    backgroundColor: "#F7FBFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D7E3F2",
    marginTop: 6,
  },

  quickCard: {
    marginTop: 14,
    backgroundColor: "#F7FBFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D7E3F2",
  },
  quickTitle: { fontSize: 12, fontWeight: "900", color: "#2E3A59", marginBottom: 10 },
  quickBtn: {
    backgroundColor: "#EEF5FF",
    borderRadius: 12,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
  },
  quickBtnText: { fontSize: 13, fontWeight: "900", color: "#2F5FE8" },

  deviceRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 10, backgroundColor: "#22C55E" },
  deviceLine: { fontSize: 13, fontWeight: "800", color: "#2E3A59" },
  deviceSub: { fontSize: 12, color: "#6B7A99", marginTop: 2 },

  activeSensors: { fontSize: 11, fontWeight: "900", color: "#2E3A59", marginBottom: 10 },

  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", gap: 12 },

  tile: {
    width: "48%",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  tileInner: { padding: 14, minHeight: 132 },
  tileTopRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  valueBlock: { alignItems: "flex-end" },
  tileValue: { color: "#FFFFFF", fontSize: 32, fontWeight: "900", lineHeight: 34 },
  tileUnit: { color: "rgba(255,255,255,0.92)", fontSize: 14, fontWeight: "800", marginTop: 2 },
  tileLabel: { color: "#FFFFFF", fontSize: 22, fontWeight: "500", marginTop: 14 },
  tileBottomRow: { marginTop: 8, flexDirection: "row", justifyContent: "space-between" },
  tileMeta: { color: "rgba(255,255,255,0.9)", fontSize: 14, fontWeight: "500" },

  energyCard: {
    width: "86%",
    maxWidth: 360,
    marginTop: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D7E3F2",
  },
  energyTitle: { fontSize: 11, fontWeight: "900", color: "#2E3A59" },
  energyRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 10 },
  energyValue: { fontSize: 26, fontWeight: "900", color: "#2E3A59" },
  energyUnit: { fontSize: 12, fontWeight: "900", color: "#2E3A59" },

  progressTrack: { height: 8, borderRadius: 999, backgroundColor: "#E6EEF8", overflow: "hidden", marginTop: 12 },
  progressFill: { height: "100%", backgroundColor: "#2F5FE8", borderRadius: 999 },

  energyFooter: { marginTop: 10, flexDirection: "row", justifyContent: "space-between" },
  energyFooterText: { fontSize: 11, fontWeight: "800", color: "#6B7A99" },

  loadingCard: {
    width: "86%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D7E3F2",
    marginTop: 6,
  },
});
