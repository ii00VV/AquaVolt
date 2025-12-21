import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { requestPasswordReset } from "../services/auth";

export default function ForgotPasswordSentScreen({ navigation, route }) {
  const email = route?.params?.email || "";
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const resend = async () => {
    setMsg("");
    setLoading(true);
    try {
      await requestPasswordReset(email);
      setMsg("Reset email resent.");
    } catch (e) {
      setMsg("Could not resend. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0B3A8D", "#0B1220"]} style={styles.bg}>
      <View style={styles.header}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brand}>AquaVolt</Text>
      </View>

      <View style={styles.card}>
        {/* Back button */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={10}
        >
          <Ionicons name="chevron-back" size={22} color="#0B1220" />
          <Text style={styles.backLabel}>Verification</Text>
        </Pressable>

        <Image
          source={require("../../assets/forgot_password.png")}
          style={styles.illus}
          resizeMode="contain"
        />

        <Text style={styles.title}>Check your email</Text>

        <Text style={styles.subtitle}>
          Click the link sent to <Text style={styles.email}>{email}</Text> to set new password
        </Text>

        <Pressable style={styles.btn} onPress={() => navigation.replace("Login")}>
          <Text style={styles.btnText}>Confirm</Text>
        </Pressable>

        <Pressable onPress={resend} disabled={loading} style={{ marginTop: 14 }}>
          <Text style={styles.resend}>{loading ? "Resending..." : "Resend reset email"}</Text>
        </Pressable>

        {!!msg && <Text style={styles.msg}>{msg}</Text>}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },

  header: {
    height: 280,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 40,
  },
  logo: { width: 90, height: 90 },
  brand: { fontSize: 34, fontWeight: "700", color: "white" },

  card: {
    flex: 1,
    backgroundColor: "#EAF6FF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
  },

  backBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  backLabel: {
    color: "#0B1220",
    fontSize: 12,
    fontWeight: "600",
  },

  illus: { width: "100%", height: 140, marginTop: 6, marginBottom: 12 },

  title: { fontSize: 22, fontWeight: "800", textAlign: "center", color: "#0B1220" },
  subtitle: {
    marginTop: 12,
    textAlign: "center",
    color: "#0B1220",
    marginBottom: 18,
    paddingHorizontal: 14,
    fontSize: 13,
    lineHeight: 18,
  },
  email: { color: "#3D73E0" },

  btn: {
    backgroundColor: "#3D73E0",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: { color: "white", fontWeight: "800" },

  resend: { color: "#3D73E0", textAlign: "center", fontSize: 12, fontWeight: "700" },
  msg: { marginTop: 10, textAlign: "center", color: "#5D6B86", fontSize: 12 },
});
