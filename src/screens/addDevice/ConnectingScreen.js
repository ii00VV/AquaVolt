import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
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

export default function ConnectingScreen({ navigation, route }) {
  const device = useMemo(() => route?.params?.device, [route?.params?.device]);

  const [autoReady, setAutoReady] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAutoReady(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const onSimulateSuccess = () => {
    navigation.replace("DeviceAdded", { device });
  };

  return (
    <View style={styles.root}>
      <FlowHeader title="WIFI" onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <ActivityIndicator size="large" />
        <Text style={styles.title}>Connecting...</Text>
        <Text style={styles.sub}>
          Configuring {device?.id || "ESP32"}{device?.id ? "" : ""}{"\n"}This may take a minute
        </Text>

        <Pressable
          onPress={onSimulateSuccess}
          style={[styles.primaryBtn, !autoReady && { opacity: 0.7 }]}
          disabled={!autoReady}
        >
          <Text style={styles.primaryBtnText}>Simulate Success</Text>
        </Pressable>
      </View>
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
  title: { marginTop: 14, fontSize: 14, fontWeight: "900", color: "#0B1220" },
  sub: { marginTop: 6, fontSize: 11, fontWeight: "700", color: "#7C8AA6", textAlign: "center", lineHeight: 16 },

  primaryBtn: {
    marginTop: 22,
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
    