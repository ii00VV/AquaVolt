import React, { useMemo } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { saveDevice } from "../../services/deviceStore";
import { auth } from "../../services/firebase";

function FlowHeader({ title }) {
  return (
    <LinearGradient colors={["#0B3A8D", "#061A33"]} style={styles.header}>
      <SafeAreaView edges={["top"]}>
        <View style={styles.headerRow}>
          <View style={{ width: 42 }} />
          <Text style={styles.headerTitle}>{title}</Text>
          <View style={{ width: 42 }} />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

export default function DeviceAddedScreen({ navigation, route }) {
  const device = useMemo(() => route?.params?.device, [route?.params?.device]);

  const onDone = async () => {
    const uid = auth.currentUser?.uid;

    // ✅ Save device as WIFI mode (frontend only)
    await saveDevice(uid, {
      id: device?.id || "ESP32-AV-8F3D",
      name: device?.name || "AquaVolt Device",

      // ✅ these are the fields your Device/Connectivity screens use
      status: "Online",
      connectionType: "wifi",

      // optional info (matches your placeholders)
      model: "ESP32-WROOM-32",
      firmware: "v2.4.1",

      wifi: {
        ssid: "HomeNetwork_5G",
        band: "2.4 GHz",
        signalDbm: -45,
        strengthLabel: "Strong (-45 dBm)",
        ip: "192.168.1.142",
      },

      // keep bt info optional (can be used when switching later)
      bluetooth: {
        rssi: -52,
        statusLabel: "Disconnected",
        rangeMeters: 10,
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
      <FlowHeader title="WIFI" />

      <View style={styles.content}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={42} color="#FFFFFF" />
        </View>

        <Text style={styles.title}>Device Added Successfully!</Text>
        <Text style={styles.sub}>Your AquaVolt device is now connected and ready to monitor</Text>

        <Pressable style={styles.primaryBtn} onPress={onDone}>
          <Text style={styles.primaryBtnText}>Go to Dashboard</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EAF6FF" },

  header: { paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },

  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  checkCircle: {
    width: 90,
    height: 90,
    borderRadius: 90,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { marginTop: 14, fontSize: 16, fontWeight: "900", color: "#0B1220" },
  sub: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: "700",
    color: "#7C8AA6",
    textAlign: "center",
    lineHeight: 16,
  },

  primaryBtn: {
    marginTop: 18,
    backgroundColor: "#2F5FE8",
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    minWidth: 180,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
});
