import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../../services/firebase";
import { saveDevice } from "../../services/deviceStore";

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

export default function PairBluetoothScreen({ navigation, route }) {
  const [step, setStep] = useState("pairing"); // "pairing" | "success"

  const selected = useMemo(() => route?.params?.device || null, [route?.params?.device]);

  const deviceId = selected?.id || "AquaVolt-ESP32-A1";
  const deviceName = selected?.name || "AquaVolt Monitor";
  const rssi = selected?.rssi ?? -52;

  const onSimulateSuccess = () => {
    setStep("success");
  };

  const onDone = async () => {
    const uid = auth.currentUser?.uid;

    // ✅ Save device as BLUETOOTH mode (frontend only)
    await saveDevice(uid, {
      id: deviceId,
      name: deviceName,

      status: "Online",
      connectionType: "bluetooth",

      model: "ESP32-WROOM-32",
      firmware: "v2.4.1",

      bluetooth: {
        rssi,
        statusLabel: "Connected",
        rangeMeters: 10,
      },

      // keep wifi info optional so switching later has defaults
      wifi: {
        ssid: "HomeNetwork_5G",
        band: "2.4 GHz",
        signalDbm: -45,
        strengthLabel: "Strong (-45 dBm)",
        ip: "192.168.1.142",
      },

      connectedAt: Date.now(),
    });

    // ✅ close AddDeviceFlow and return to tabs (Device/Home)
    const parent = navigation.getParent?.();
    if (parent?.goBack) parent.goBack();
    else navigation.goBack();
  };

  return (
    <View style={styles.root}>
      {/* ✅ Header copied from ScanDevicesScreen style */}
      <FlowHeader title="BLUETOOTH" onBack={() => navigation.goBack()} />

      {step === "pairing" ? (
        <View style={styles.content}>
          <View style={styles.btCircle}>
            <Ionicons name="bluetooth" size={44} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>Pairing with Device</Text>
          <Text style={styles.sub}>Connecting to {deviceId}...</Text>
          <Text style={styles.small}>This should only take a moment</Text>

          <Pressable style={styles.primaryBtn} onPress={onSimulateSuccess}>
            <Text style={styles.primaryBtnText}>Simulate Success</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={42} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>Bluetooth Connected!</Text>
          <Text style={styles.sub}>Successfully paired with {deviceId}</Text>

          <View style={styles.warningCard}>
            <View style={styles.warningRow}>
              <Ionicons name="alert-circle" size={18} color="#B45309" />
              <Text style={styles.warningTitle}>Offline Mode Active</Text>
            </View>
            <Text style={styles.warningText}>
              Data is stored locally and won’t sync to cloud while using Bluetooth.
            </Text>
          </View>

          <Pressable style={styles.primaryBtn} onPress={onDone}>
            <Text style={styles.primaryBtnText}>Go to Dashboard</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EAF6FF" },

  header: { paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 999 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },

  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },

  btCircle: {
    width: 90,
    height: 90,
    borderRadius: 90,
    backgroundColor: "#4B63F2",
    alignItems: "center",
    justifyContent: "center",
  },

  checkCircle: {
    width: 90,
    height: 90,
    borderRadius: 90,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },

  title: { marginTop: 14, fontSize: 16, fontWeight: "900", color: "#0B1220" },
  sub: { marginTop: 8, fontSize: 11, fontWeight: "700", color: "#7C8AA6", textAlign: "center" },
  small: { marginTop: 6, fontSize: 11, fontWeight: "700", color: "#7C8AA6", textAlign: "center" },

  warningCard: {
    marginTop: 16,
    width: "92%",
    maxWidth: 380,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FDBA74",
    borderRadius: 12,
    padding: 12,
  },
  warningRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  warningTitle: { fontSize: 12, fontWeight: "900", color: "#B45309" },
  warningText: { fontSize: 11, fontWeight: "700", color: "#B45309", lineHeight: 16 },

  primaryBtn: {
    marginTop: 18,
    backgroundColor: "#2F5FE8",
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    minWidth: 220,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },

  secondaryBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    minWidth: 220,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E0EF",
  },
  secondaryText: { color: "#0B1220", fontSize: 12, fontWeight: "900" },
});
