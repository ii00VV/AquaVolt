import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

function DeviceRow({ name, strengthLabel, onPress }) {
  return (
    <Pressable style={styles.deviceRow} onPress={onPress}>
      <View style={styles.deviceLeft}>
        <View style={styles.btIconBox}>
          <Ionicons name="bluetooth" size={18} color="#FFFFFF" />
        </View>
        <View>
          <Text style={styles.deviceName}>{name}</Text>
          <Text style={styles.deviceSub}>AquaVolt Monitor</Text>
        </View>
      </View>

      <View style={styles.deviceRight}>
        <Text style={styles.strengthText}>{strengthLabel}</Text>
        <Ionicons name="wifi" size={16} color="#8B97AD" />
      </View>
    </Pressable>
  );
}

export default function ScanBluetoothScreen({ navigation }) {
  const [scanning, setScanning] = useState(true);

  const devices = useMemo(
    () => [
      { id: "A1", name: "AquaVolt-ESP32-A1", strength: "Strong" },
      { id: "B2", name: "AquaVolt-ESP32-B2", strength: "Medium" },
      { id: "C7", name: "AquaVolt-ESP32-C7", strength: "Weak" },
    ],
    []
  );

  useEffect(() => {
    setScanning(true);
    const t = setTimeout(() => setScanning(false), 1200);
    return () => clearTimeout(t);
  }, []);

  const onSelect = (d) => {
    navigation.navigate("PairBluetooth", { deviceId: d.name });
  };

  const onRefresh = () => {
    setScanning(true);
    setTimeout(() => setScanning(false), 900);
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#0B3A8D", "#061A33"]} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <Image source={require("../../../assets/logo.png")} style={styles.headerLogo} resizeMode="contain" />
              <Text style={styles.headerBrand}>AquaVolt</Text>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>Scanning for Devices</Text>
          <Text style={styles.subtitle}>
            {scanning ? "Looking for nearby AquaVolt devices via Bluetooth..." : "Tap a device to pair."}
          </Text>
        </View>

        <View style={styles.card}>
          {scanning ? (
            <View style={styles.loadingBox}>
              <Ionicons name="bluetooth" size={18} color="#2F5FE8" />
              <Text style={styles.loadingText}>Scanning...</Text>
            </View>
          ) : (
            devices.map((d) => (
              <DeviceRow
                key={d.id}
                name={d.name}
                strengthLabel={d.strength}
                onPress={() => onSelect(d)}
              />
            ))
          )}

          <Pressable style={styles.refreshBtn} onPress={onRefresh} disabled={scanning}>
            <Ionicons name="refresh" size={16} color="#0B1220" />
            <Text style={styles.refreshText}>{scanning ? "Refreshing..." : "Refresh"}</Text>
          </Pressable>
        </View>

        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>Back</Text>
        </Pressable>

        <View style={{ height: 26 }} />
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

  content: { paddingTop: 14, paddingBottom: 10, alignItems: "center" },

  titleWrap: { width: "86%", maxWidth: 380, marginBottom: 10 },
  title: { fontSize: 16, fontWeight: "900", color: "#0B1220" },
  subtitle: { marginTop: 4, fontSize: 12, fontWeight: "700", color: "#7C8AA6", lineHeight: 16 },

  card: {
    width: "86%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8E0EF",
    padding: 12,
  },

  loadingBox: {
    height: 60,
    borderRadius: 12,
    backgroundColor: "#EEF5FF",
    borderWidth: 1,
    borderColor: "#D8E0EF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  loadingText: { fontSize: 12, fontWeight: "900", color: "#2F5FE8" },

  deviceRow: {
    height: 62,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8E0EF",
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },

  deviceLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  btIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#2F5FE8",
    alignItems: "center",
    justifyContent: "center",
  },
  deviceName: { fontSize: 13, fontWeight: "900", color: "#0B1220" },
  deviceSub: { marginTop: 2, fontSize: 11, fontWeight: "800", color: "#7C8AA6" },

  deviceRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  strengthText: { fontSize: 11, fontWeight: "900", color: "#5D6B86" },

  refreshBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#EEF5FF",
    borderWidth: 1,
    borderColor: "#D8E0EF",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  refreshText: { fontSize: 12, fontWeight: "900", color: "#0B1220" },

  backBtn: {
    marginTop: 12,
    width: "86%",
    maxWidth: 380,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D8E0EF",
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 13, fontWeight: "900", color: "#0B1220" },
});
