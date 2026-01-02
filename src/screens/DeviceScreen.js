// src/screens/DeviceScreen.js
import React, { useMemo, useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, Image, Modal, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../services/firebase";
import { getSavedDevice, clearDevice } from "../services/deviceStore";

function InfoRow({ label, value, valueBold, valueColor }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text
        style={[
          styles.rowValue,
          valueBold && { fontWeight: "900" },
          valueColor ? { color: valueColor } : null,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function NoDeviceCard({ onAddDevice }) {
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyTitle}>No device connected</Text>
      <Text style={styles.emptySub}>
        Add your AquaVolt ESP32 device to manage connection details and quick actions.
      </Text>

      <View style={styles.quickCard}>
        <Text style={styles.quickTitle}>Quick Actions</Text>

        <Pressable onPress={onAddDevice} style={styles.quickBtn}>
          <Ionicons name="add" size={18} color="#2F5FE8" />
          <Text style={styles.quickBtnText}>Add Device</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function DeviceScreen({ navigation }) {
  const placeholder = useMemo(
    () => ({
      model: "ESP32-WROOM-32",
      firmware: "v2.4.1",
      wifi: {
        ssid: "HomeNetwork_5G",
        band: "2.4 GHz",
        signalDbm: -45,
        strengthLabel: "Strong (-45 dBm)",
        ip: "192.168.1.142",
      },
      bluetooth: {
        rssi: -52,
        rangeMeters: 10,
        statusLabel: "Connected",
      },
    }),
    []
  );

  const [loading, setLoading] = useState(true);
  const [device, setDevice] = useState(null);

  // ✅ Restart simulation modal state
  const [restartVisible, setRestartVisible] = useState(false);
  const [restartStep, setRestartStep] = useState("restarting"); // "restarting" | "done"

  const refresh = useCallback(async () => {
    setLoading(true);
    const uid = auth.currentUser?.uid;
    const d = await getSavedDevice(uid);
    setDevice(d);
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener("focus", refresh);
    refresh();
    return unsub;
  }, [navigation, refresh]);

  const goAddDevice = (mode) => {
    const parent = navigation.getParent?.();
    const nav = parent?.navigate ? parent : navigation;
    nav.navigate("AddDeviceFlow", { mode: mode || "wifi" });
  };

  // ✅ Restart device -> show popup simulation
  const onRestartDevice = () => {
    setRestartStep("restarting");
    setRestartVisible(true);

    // Simulate restart process
    setTimeout(() => {
      setRestartStep("done");

      // Auto close after showing success
      setTimeout(() => {
        setRestartVisible(false);
      }, 900);
    }, 1800);
  };

  const onRemoveDevice = () => {
    Alert.alert("Remove Device", "Remove this device from your account?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const uid = auth.currentUser?.uid;
          await clearDevice(uid);
          await refresh();
        },
      },
    ]);
  };

  const onSwitchConnection = () => {
    navigation.navigate("ConnectivitySettings");
  };

  const isBt = device?.connectionType === "bluetooth";

  const status = device?.status || "Online";
  const deviceName = device?.name || "AquaVolt Monitor";
  const deviceId = device?.id || "AquaVolt-ESP32-A1";
  const model = device?.model || placeholder.model;
  const firmware = device?.firmware || placeholder.firmware;

  const wifi = device?.wifi || placeholder.wifi;
  const bt = device?.bluetooth || placeholder.bluetooth;

  const rssiText = typeof bt?.rssi === "number" ? `${bt.rssi} dBm` : "—";
  const rssiColor = typeof bt?.rssi === "number" ? "#0F9D58" : "#0B1220";
  const rangeText = bt?.rangeMeters ? `~${bt.rangeMeters} meters` : "—";

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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.pageTitleWrap}>
          <Text style={styles.pageTitle}>Device Details</Text>
          <Text style={styles.pageSub}>Manage your AquaVolt device</Text>
        </View>

        {!loading && !device && <NoDeviceCard onAddDevice={() => goAddDevice("wifi")} />}

        {loading && (
          <View style={styles.loadingCard}>
            <Text style={styles.loadingTitle}>Loading...</Text>
            <Text style={styles.loadingSub}>Checking connected device.</Text>
          </View>
        )}

        {!loading && !!device && (
          <>
            {/* Device card */}
            <View style={styles.card}>
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTopTitle}>{deviceName}</Text>
                <View style={styles.onlineWrap}>
                  <View style={[styles.dot, status === "Online" ? null : { backgroundColor: "#C91515" }]} />
                  <Text style={styles.onlineText}>{status}</Text>
                </View>
              </View>

              <View style={styles.table}>
                <InfoRow label="Device ID" value={deviceId} valueBold />
                <InfoRow label="Model" value={model} valueBold />
                <InfoRow label="Firmware" value={firmware} valueBold />
              </View>
            </View>

            {/* Connection card */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Connection Type</Text>

              <View style={styles.connRow}>
                <View style={[styles.iconBox, { backgroundColor: isBt ? "#4B63F2" : "#2F5FE8" }]}>
                  <Ionicons name={isBt ? "bluetooth" : "wifi"} size={22} color="#fff" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.connTitle}>{isBt ? "Bluetooth (Offline Mode)" : "WiFi (Cloud Mode)"}</Text>
                  <Text style={styles.connSub}>
                    {isBt ? "Local connection active" : "Remote monitoring enabled"}
                  </Text>
                </View>

                <View style={styles.greenDotSmall} />
              </View>

              {isBt ? (
                <View style={[styles.table, { marginTop: 8 }]}>
                  <InfoRow label="Signal Strength (RSSI)" value={rssiText} valueBold valueColor={rssiColor} />
                  <InfoRow label="Range" value={rangeText} valueBold />
                </View>
              ) : (
                <View style={[styles.table, { marginTop: 8 }]}>
                  <InfoRow label="Network" value={wifi?.ssid || "—"} valueBold />
                  <InfoRow label="Signal" value={wifi?.strengthLabel || "—"} valueBold valueColor="#0F9D58" />
                  <InfoRow label="Band" value={wifi?.band || "—"} valueBold />
                </View>
              )}

              <Pressable style={styles.switchBtn} onPress={onSwitchConnection}>
                <Ionicons name="swap-horizontal" size={18} color="#2F5FE8" />
                <Text style={styles.switchBtnText}>Switch Connection Method</Text>
              </Pressable>
            </View>

            {/* Quick Actions */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>

              {/* ✅ Reconfigure WiFi removed */}

              <Pressable style={[styles.actionBtn, styles.actionWhite]} onPress={onRestartDevice}>
                <Ionicons name="refresh" size={18} color="#0B1220" />
                <Text style={styles.actionText}>Restart Device</Text>
              </Pressable>

              <Pressable style={[styles.actionBtn, styles.actionRed]} onPress={onRemoveDevice}>
                <Ionicons name="trash" size={18} color="#FFFFFF" />
                <Text style={[styles.actionText, { color: "#FFFFFF" }]}>Remove Device</Text>
              </Pressable>
            </View>
          </>
        )}

        <View style={{ height: 28 }} />
      </ScrollView>

      {/* ✅ Restart popup simulation */}
      <Modal visible={restartVisible} transparent animationType="fade" onRequestClose={() => setRestartVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {restartStep === "restarting" ? (
              <>
                <ActivityIndicator size="large" color="#2F5FE8" />
                <Text style={styles.modalTitle}>Restarting device...</Text>
                <Text style={styles.modalSub}>Sending restart command to ESP32</Text>
              </>
            ) : (
              <>
                <View style={styles.doneCircle}>
                  <Ionicons name="checkmark" size={28} color="#fff" />
                </View>
                <Text style={styles.modalTitle}>Device restarted</Text>
                <Text style={styles.modalSub}>Reconnected successfully</Text>
              </>
            )}
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

  content: { alignItems: "center", paddingTop: 14, paddingBottom: 10 },
  pageTitleWrap: { width: "86%", maxWidth: 380, marginBottom: 10 },
  pageTitle: { marginTop: 7, fontSize: 18, fontWeight: "900", color: "#0B1220" },
  pageSub: { marginTop: 2, fontSize: 12, color: "#7C8AA6", fontWeight: "600" },

  emptyWrap: {
    width: "86%",
    maxWidth: 380,
    backgroundColor: "#F7FBFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D7E3F2",
    marginTop: 6,
  },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: "#0B1220" },
  emptySub: { marginTop: 6, fontSize: 12, fontWeight: "700", color: "#7C8AA6", lineHeight: 16 },

  quickCard: {
    marginTop: 14,
    backgroundColor: "#FFFFFF",
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

  card: {
    width: "86%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginTop: 12,
  },

  cardTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTopTitle: { fontSize: 14, fontWeight: "900", color: "#0B1220" },

  onlineWrap: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 8, backgroundColor: "#25C25A" },
  onlineText: { fontSize: 12, fontWeight: "800", color: "#0B1220" },

  table: { marginTop: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  rowLabel: { fontSize: 12, color: "#2B3A55", fontWeight: "700" },
  rowValue: { fontSize: 12, color: "#0B1220", fontWeight: "800", maxWidth: "55%" },

  sectionTitle: { fontSize: 13, fontWeight: "900", color: "#0B1220", marginBottom: 6 },

  connRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 4 },
  iconBox: { width: 44, height: 44, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  connTitle: { fontSize: 13, fontWeight: "900", color: "#0B1220" },
  connSub: { marginTop: 2, fontSize: 11, fontWeight: "700", color: "#7C8AA6" },
  greenDotSmall: { width: 8, height: 8, borderRadius: 8, backgroundColor: "#25C25A", marginLeft: 4 },

  switchBtn: {
    marginTop: 12,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EEF5FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  switchBtnText: { fontSize: 12, fontWeight: "900", color: "#2F5FE8" },

  actionBtn: {
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  actionText: { fontSize: 12, fontWeight: "900", color: "#0B1220" },
  actionWhite: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D8E0EF" },
  actionRed: { backgroundColor: "#E25555" },

  loadingCard: {
    width: "86%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#D7E3F2",
    marginTop: 6,
  },
  loadingTitle: { fontSize: 14, fontWeight: "900", color: "#0B1220" },
  loadingSub: { marginTop: 6, fontSize: 12, fontWeight: "700", color: "#7C8AA6" },

  // ✅ Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  modalCard: {
    width: "88%",
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  modalTitle: { marginTop: 12, fontSize: 14, fontWeight: "900", color: "#0B1220", textAlign: "center" },
  modalSub: { marginTop: 6, fontSize: 12, fontWeight: "700", color: "#7C8AA6", textAlign: "center", lineHeight: 16 },

  doneCircle: {
    width: 56,
    height: 56,
    borderRadius: 56,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtn: {
    marginTop: 14,
    backgroundColor: "#2F5FE8",
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
  },
  modalBtnText: { color: "#fff", fontWeight: "900", fontSize: 12 },
});
