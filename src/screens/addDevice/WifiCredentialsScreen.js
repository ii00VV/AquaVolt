import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
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

export default function WifiCredentialsScreen({ navigation, route }) {
  const device = useMemo(() => route?.params?.device, [route?.params?.device]);

  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");

  const onConnect = () => {
    navigation.navigate("Connecting", { device, ssid });
  };

  return (
    <View style={styles.root}>
      <FlowHeader title="WiFi" onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionTitle}>Enter wifi credentials</Text>

          <Text style={styles.label}>Network Name (SSID)</Text>
          <TextInput
            value={ssid}
            onChangeText={setSsid}
            placeholder="Enter WiFi Name"
            placeholderTextColor="#9AA7BD"
            style={styles.input}
          />

          <Text style={[styles.label, { marginTop: 12 }]}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Enter WiFi Password"
            placeholderTextColor="#9AA7BD"
            secureTextEntry
            style={styles.input}
          />

          <Text style={styles.hint}>Make sure your device supports 2.4GHz WiFi networks</Text>

          <Pressable style={[styles.primaryBtn, !(ssid && password) && { opacity: 0.5 }]} onPress={onConnect} disabled={!(ssid && password)}>
            <Text style={styles.primaryBtnText}>Connect Device</Text>
          </Pressable>

          <Pressable style={styles.secondaryBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.secondaryBtnText}>Back</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#EAF6FF" },

  header: { paddingHorizontal: 16, paddingBottom: 14 },
  headerRow: { height: 64, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: { width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 999 },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "900" },

  content: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: "#0B1220", marginBottom: 12 },

  label: { fontSize: 12, fontWeight: "900", color: "#2B3A55", marginBottom: 6 },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#C7D3E6",
    paddingHorizontal: 10,
    height: 40,
    fontSize: 12,
    fontWeight: "800",
    color: "#0B1220",
  },

  hint: { marginTop: 10, fontSize: 10, fontWeight: "700", color: "#2F5FE8" },

  primaryBtn: {
    marginTop: 28,
    backgroundColor: "#2F5FE8",
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },

  secondaryBtn: {
    marginTop: 12,
    backgroundColor: "#EFEFEF",
    borderWidth: 1,
    borderColor: "#D0D0D0",
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryBtnText: { fontSize: 12, fontWeight: "900", color: "#8A8A8A" },
});
