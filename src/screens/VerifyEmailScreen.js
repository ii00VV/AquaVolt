import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../services/firebase";
import {
  resendVerificationEmail,
  refreshEmailVerifiedAndSync,
  logout,
} from "../services/auth";

export default function VerifyEmailScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const onOk = async () => {
    setMsg("");
    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setMsg("No active user. Please sign up or log in again.");
        navigation.replace("Login");
        return;
      }

      const verified = await refreshEmailVerifiedAndSync();
      if (verified) {
        // Optional: log out and force fresh login (cleaner for “no login until verified” rule)
        await logout();
        navigation.replace("Login");
      } else {
        setMsg("Not verified yet. Check inbox/spam then tap OK again.");
      }
    } catch (e) {
      setMsg("Could not check verification. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setMsg("");
    setLoading(true);
    try {
      await resendVerificationEmail();
      setMsg("Verification email resent. Please check your inbox/spam.");
    } catch (e) {
      setMsg("Could not resend. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0B3A8D", "#0B1220"]} style={styles.bg}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-outline" size={44} color="#fff" />
        </View>

        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.subtitle}>
          We’ve sent a verification link to your email. Please check your inbox and verify your account.
        </Text>

        {!!msg && <Text style={styles.msg}>{msg}</Text>}

        <Pressable style={styles.okBtn} onPress={onOk} disabled={loading}>
          <Text style={styles.okText}>{loading ? "Checking..." : "Ok"}</Text>
        </Pressable>

        <Pressable onPress={onResend} disabled={loading}>
          <Text style={styles.resend}>Resend verification email</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, justifyContent: "center", padding: 22 },
  card: {
    backgroundColor: "#EAF6FF",
    borderRadius: 18,
    padding: 22,
    alignItems: "center",
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#3D73E0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  title: { fontSize: 18, fontWeight: "800", color: "#0B1220" },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
    color: "#5D6B86",
    lineHeight: 18,
    fontSize: 12,
    marginBottom: 12,
  },
  msg: { color: "#D23B3B", fontSize: 12, textAlign: "center", marginBottom: 10 },
  okBtn: {
    width: "100%",
    backgroundColor: "#3D73E0",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 6,
  },
  okText: { color: "white", fontWeight: "800" },
  resend: { marginTop: 14, color: "#3D73E0", fontWeight: "700", fontSize: 12 },
});
