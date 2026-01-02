// src/screens/ConnectivitySettingsScreen.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../services/firebase";
import { getSavedDevice, updateDevice } from "../services/deviceStore";

function Card({ children }) {
  return <View style={styles.card}>{children}</View>;
}

function Row({ left, right, rightColor }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLeft}>{left}</Text>
      <Text style={[styles.rowRight, rightColor ? { color: rightColor } : null]} numberOfLines={1}>
        {right}
      </Text>
    </View>
  );
}

export default function ConnectivitySettingsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState(null);

  const uid = auth.currentUser?.uid;

  const refresh = useCallback(async () => {
    setLoading(true);
    const d = await getSavedDevice(uid);
    setDevice(d);
    setLoading(false);
  }, [uid]);

  useEffect(() => {
    const unsub = navigation.addListener?.("focus", refresh);
    refresh();
    return unsub;
  }, [navigation, refresh]);

  const isBt = device?.connectionType === "bluetooth";
  const deviceId = device?.id || "AquaVolt-ESP32-A1";

  const wifi = useMemo(
    () =>
      device?.wifi || {
        ssid: "HomeNetwork_5G",
        band: "2.4 GHz",
        signalDbm: -45,
        strengthLabel: "Strong (-45 dBm)",
        ip: "192.168.1.142",
      },
    [device]
  );

  const bt = useMemo(
    () =>
      device?.bluetooth || {
        rssi: -52,
        statusLabel: "Connected",
        rangeMeters: 10,
      },
    [device]
  );

  const goAddDeviceFlowTo = (screenName, extraParams = {}) => {
    const parent = navigation.getParent?.();
    const nav = parent?.navigate ? parent : navigation;

    nav.navigate("AddDeviceFlow", {
      screen: screenName,
      params: {
        ...extraParams,
      },
    });
  };

  const onSwitchToWifi = () => goAddDeviceFlowTo("ScanDevice");
  const onSwitchToBluetooth = () => goAddDeviceFlowTo("EnableBluetooth");

  const onDisconnectBluetooth = async () => {
    // keep it simple + immediate; if you still want confirm, tell me
    await updateDevice(uid, { bluetooth: { statusLabel: "Disconnected" } });
    await refresh();
  };

  // No device
  if (!loading && !device) {
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

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {/* ✅ Back button BELOW header */}
          <Pressable style={styles.backInline} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={16} color="#2F5FE8" />
            <Text style={styles.backInlineText}>Back</Text>
          </Pressable>

          <View style={styles.titleWrap}>
            <Text style={styles.title}>Connectivity Settings</Text>
            <Text style={styles.sub}>Manage device connection methods</Text>
          </View>

          <Card>
            <Text style={styles.cardTitle}>No device found</Text>
            <Text style={styles.sub2}>Add a device first to manage connectivity.</Text>

            <Pressable style={styles.primaryBtn} onPress={() => goAddDeviceFlowTo("ScanDevice")}>
              <Text style={styles.primaryBtnText}>Add Device</Text>
            </Pressable>
          </Card>

          <View style={{ height: 28 }} />
        </ScrollView>
      </View>
    );
  }

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* ✅ Back button BELOW header */}
        <Pressable style={styles.backInline} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={16} color="#2F5FE8" />
          <Text style={styles.backInlineText}>Back</Text>
        </Pressable>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>Connectivity Settings</Text>
          <Text style={styles.sub}>Manage device connection methods</Text>
        </View>

        {/* Current Connection */}
        <Card>
          <Text style={styles.cardTitle}>Current Connection</Text>

          <View style={styles.currentRow}>
            <View style={[styles.iconBox, { backgroundColor: isBt ? "#4B63F2" : "#2F5FE8" }]}>
              <Ionicons name={isBt ? "bluetooth" : "wifi"} size={22} color="#fff" />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.currentTitle}>{isBt ? "Bluetooth (Offline Mode)" : "WiFi (Cloud Mode)"}</Text>
              <Text style={styles.currentSub}>{isBt ? "Local connection only" : "Remote monitoring enabled"}</Text>
            </View>

            <View style={styles.greenDot} />
          </View>
        </Card>

        {/* Switch Connection Method (opposite only) */}
        <Card>
          <Text style={styles.cardTitle}>Switch Connection Method</Text>

          {isBt ? (
            <Pressable style={styles.switchBox} onPress={onSwitchToWifi}>
              <Ionicons name="wifi" size={18} color="#2F5FE8" />
              <Text style={styles.switchText}>Switch to WiFi Mode</Text>
              <Text style={styles.switchHint}>Enable cloud sync</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.switchBox} onPress={onSwitchToBluetooth}>
              <Ionicons name="bluetooth" size={18} color="#2F5FE8" />
              <Text style={styles.switchText}>Switch to Bluetooth Mode</Text>
              <Text style={styles.switchHint}>Offline access</Text>
            </Pressable>
          )}
        </Card>

        {/* WiFi Configuration (only when WiFi) — ✅ button removed */}
        {!isBt && (
          <Card>
            <View style={styles.wifiHeader}>
              <Ionicons name="wifi" size={18} color="#2F5FE8" />
              <Text style={styles.cardTitle}>WiFi Configuration</Text>
            </View>

            <Row left="Network" right={wifi.ssid || "—"} />
            <Row left="Signal" right={wifi.strengthLabel || "—"} rightColor="#0F9D58" />
            <Row left="Band" right={wifi.band || "—"} />
          </Card>
        )}

        {/* Bluetooth Pairing (only when BT) */}
        {isBt && (
          <Card>
            <View style={styles.btHeader}>
              <Ionicons name="bluetooth" size={18} color="#2F5FE8" />
              <Text style={styles.cardTitle}>Bluetooth Pairing</Text>
            </View>

            <Row left="Device" right={deviceId} />
            <Row left="Signal" right={`Strong (RSSI: ${bt.rssi ?? -52})`} rightColor="#0F9D58" />
            <Row left="Status" right={bt.statusLabel || "Connected"} rightColor="#0F9D58" />

            <Pressable style={styles.disconnectBtn} onPress={onDisconnectBluetooth}>
              <Ionicons name="bluetooth" size={18} color="#C91515" />
              <Text style={styles.disconnectText}>Disconnect Bluetooth</Text>
            </Pressable>
          </Card>
        )}

        {/* Tips */}
        <View style={styles.tips}>
          <View style={styles.tipsTitleRow}>
            <Ionicons name="information-circle-outline" size={18} color="#2F5FE8" />
            <Text style={styles.tipsTitle}>Connection Tips:</Text>
          </View>

          <Text style={styles.tip}>• WiFi enables remote monitoring and cloud sync</Text>
          <Text style={styles.tip}>• Bluetooth works offline with local data storage</Text>
          <Text style={styles.tip}>• Switch modes anytime based on your needs</Text>
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
  headerLogo: { width: 34, height: 34 },
  headerBrand: { color: "#fff", fontSize: 20, fontWeight: "900" },

  content: { alignItems: "center", paddingTop: 12, paddingBottom: 10 },

  // ✅ Back button below header
  backInline: {
    width: "86%",
    maxWidth: 380,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  backInlineText: { color: "#2F5FE8", fontWeight: "800", fontSize: 12 },

  titleWrap: { width: "86%", maxWidth: 380, marginBottom: 10 },
  title: { marginTop: 4, fontSize: 18, fontWeight: "900", color: "#0B1220" },
  sub: { marginTop: 2, fontSize: 12, color: "#7C8AA6", fontWeight: "600" },
  sub2: { marginTop: 6, fontSize: 12, color: "#7C8AA6", fontWeight: "700", lineHeight: 16 },

  card: {
    width: "86%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D8E0EF",
    marginTop: 12,
  },
  cardTitle: { fontSize: 13, fontWeight: "900", color: "#0B1220" },

  currentRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 10 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  currentTitle: { fontSize: 13, fontWeight: "900", color: "#0B1220" },
  currentSub: { marginTop: 2, fontSize: 11, fontWeight: "700", color: "#7C8AA6" },
  greenDot: { width: 8, height: 8, borderRadius: 8, backgroundColor: "#25C25A" },

  switchBox: {
    marginTop: 10,
    backgroundColor: "#EEF5FF",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: "center",
  },
  switchText: { marginTop: 6, fontSize: 13, fontWeight: "900", color: "#2F5FE8" },
  switchHint: { marginTop: 4, fontSize: 11, fontWeight: "700", color: "#7C8AA6" },

  wifiHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  btHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },

  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  rowLeft: { fontSize: 12, color: "#2B3A55", fontWeight: "700" },
  rowRight: { fontSize: 12, color: "#0B1220", fontWeight: "900", maxWidth: "60%" },

  disconnectBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FCEEEF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  disconnectText: { fontSize: 12, fontWeight: "900", color: "#C91515" },

  tips: {
    width: "86%",
    maxWidth: 380,
    marginTop: 14,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#BFD8FF",
    backgroundColor: "#EEF5FF",
  },
  tipsTitleRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  tipsTitle: { fontSize: 12, fontWeight: "900", color: "#2F5FE8" },
  tip: { fontSize: 11, fontWeight: "700", color: "#2F5FE8", lineHeight: 16 },

  primaryBtn: {
    marginTop: 12,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#2F5FE8",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },
});
