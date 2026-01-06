import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function EnableBluetoothScreen({ navigation }) {
  const onEnable = () => {
    navigation.navigate("ScanBluetooth");
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#0B3A8D", "#061A33"]} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
              <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
            </Pressable>

            <Text style={styles.headerTitle}>Bluetooth</Text>

            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <View style={styles.bigIcon}>
            <Ionicons name="bluetooth" size={44} color="#FFFFFF" />
          </View>

          <Text style={styles.title}>Enable Bluetooth</Text>
          <Text style={styles.sub}>Turn on Bluetooth to connect to your AquaVolt device.</Text>

          <View style={styles.tip}>
            <Text style={styles.tipText}>Make sure Bluetooth is enabled and your AquaVolt ESP32 is powered on.</Text>
          </View>

          <Pressable style={styles.primaryBtn} onPress={onEnable}>
            <Text style={styles.primaryText}>Enable Bluetooth</Text>
          </Pressable>
        </View>

        <View style={{ height: 26 }} />
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

  content: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 10,
  },

  card: {
    width: "86%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8E0EF",
    padding: 14,
    alignItems: "center",
  },

  bigIcon: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "#2F5FE8",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  title: { marginTop: 14, fontSize: 16, fontWeight: "900", color: "#0B1220" },
  sub: { marginTop: 8, fontSize: 12, fontWeight: "700", color: "#7C8AA6", textAlign: "center", lineHeight: 16 },

  tip: {
    marginTop: 14,
    width: "100%",
    backgroundColor: "#EEF5FF",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#D8E0EF",
  },
  tipText: { fontSize: 11, fontWeight: "800", color: "#2F5FE8", textAlign: "center", lineHeight: 16 },

  primaryBtn: {
    marginTop: 16,
    width: "100%",
    height: 46,
    borderRadius: 12,
    backgroundColor: "#2F5FE8",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
});
