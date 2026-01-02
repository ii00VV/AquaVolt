import React from "react";
import { View, Text, StyleSheet, Pressable, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

function MethodCard({ icon, title, subtitle, note, onPress }) {
  return (
    <Pressable onPress={onPress} style={styles.methodCard}>
      <View style={styles.methodTop}>
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={22} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.methodTitle}>{title}</Text>
          <Text style={styles.methodSub}>{subtitle}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#8B97AD" />
      </View>

      {!!note && <Text style={styles.methodNote}>{note}</Text>}
    </Pressable>
  );
}

export default function ChooseConnectionMethodScreen({ navigation }) {
  return (
    <View style={styles.root}>
      {/* ✅ Header (same AquaVolt styling) */}
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
          <Text style={styles.title}>Choose Connection Method</Text>
          <Text style={styles.subtitle}>Select how you’d like to connect to your AquaVolt device</Text>
        </View>

        <MethodCard
          icon="wifi"
          title="Wi-Fi (Cloud Mode)"
          subtitle="Requires internet connection"
          note="Enables cloud sync and remote monitoring."
          onPress={() => navigation.navigate("ScanDevice")}
        />

        <MethodCard
          icon="bluetooth"
          title="Bluetooth (Offline Mode)"
          subtitle="Local connection"
          note="Works without internet. Data stored on device only."
          onPress={() => navigation.navigate("EnableBluetooth")}
        />

        <Text style={styles.footerHint}>
          You can switch connection methods later in settings.
        </Text>

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

  titleWrap: { width: "86%", maxWidth: 380, marginBottom: 12 },
  title: { fontSize: 18, fontWeight: "900", color: "#0B1220" },
  subtitle: { marginTop: 4, fontSize: 12, fontWeight: "700", color: "#7C8AA6", lineHeight: 16 },

  methodCard: {
    width: "86%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8E0EF",
    padding: 12,
    marginTop: 12,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },

  methodTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#2F5FE8",
    alignItems: "center",
    justifyContent: "center",
  },
  methodTitle: { fontSize: 14, fontWeight: "900", color: "#0B1220" },
  methodSub: { marginTop: 2, fontSize: 11, fontWeight: "800", color: "#7C8AA6" },
  methodNote: { marginTop: 10, fontSize: 11, fontWeight: "700", color: "#5D6B86", lineHeight: 16 },

  footerHint: {
    width: "86%",
    maxWidth: 380,
    textAlign: "center",
    marginTop: 14,
    fontSize: 11,
    fontWeight: "700",
    color: "#7C8AA6",
  },
});
