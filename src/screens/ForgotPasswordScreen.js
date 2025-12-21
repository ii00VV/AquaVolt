import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { requestPasswordReset } from "../services/auth";

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const emailLower = email.trim().toLowerCase();
  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const fieldError = useMemo(() => {
    if (!touched) return "";
    if (!emailLower) return "Email is required.";
    if (!isValidEmail(emailLower)) return "Enter a valid email address.";
    return "";
  }, [touched, emailLower]);

  const onConfirm = async () => {
    setTouched(true);
    setError("");

    if (!emailLower || !isValidEmail(emailLower)) return;

    setLoading(true);
    try {
      await requestPasswordReset(emailLower);
      navigation.navigate("ForgotPasswordSent", { email: emailLower });
    } catch (e) {
      switch (e?.code) {
        case "auth/user-not-found":
          setError("No account found for that email.");
          break;
        case "auth/invalid-email":
          setError("Enter a valid email address.");
          break;
        case "auth/network-request-failed":
          setError("Network error. Please try again.");
          break;
        default:
          setError(`Failed to send reset email. (${e?.code || "unknown"})`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0B3A8D", "#0B1220"]} style={styles.bg}>
      {/* Header NEVER moves */}
      <View style={styles.header}>
        <Image
          source={require("../../assets/logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brand}>AquaVolt</Text>
      </View>

      {/* Only the CARD moves */}
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "position" : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.card}>
          {/* Back button */}
          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            hitSlop={10}
          >
            <Ionicons name="chevron-back" size={22} color="#0B1220" />
            <Text style={styles.backLabel}>Login</Text>
          </Pressable>

          <Image
            source={require("../../assets/forgot_password.png")}
            style={styles.illus}
            resizeMode="contain"
          />

          <Text style={styles.title}>Forgot Password?</Text>
          <Text style={styles.subtitle}>
            Please write your email address to receive a notification link to set a new password
          </Text>

          <TextInput
            value={email}
            onChangeText={(v) => {
              if (!touched) setTouched(true);
              setEmail(v);
              setError("");
            }}
            placeholder="Email Address"
            placeholderTextColor="#8B97AD"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          {!!fieldError && <Text style={styles.error}>{fieldError}</Text>}
          {!!error && <Text style={styles.error}>{error}</Text>}

          <Pressable style={styles.btn} onPress={onConfirm} disabled={loading}>
            <Text style={styles.btnText}>{loading ? "Sending..." : "Confirm Email"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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

  kav: { flex: 1, justifyContent: "flex-end" },

  card: {
    backgroundColor: "#EAF6FF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 28,
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

  illus: { width: "100%", height: 140, marginTop: 6, marginBottom: 10 },

  title: { fontSize: 22, fontWeight: "800", textAlign: "center", color: "#0B1220" },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
    color: "#5D6B86",
    marginBottom: 18,
    paddingHorizontal: 8,
    fontSize: 12,
    lineHeight: 18,
  },

  input: {
    backgroundColor: "#F7FBFF",
    borderWidth: 1,
    borderColor: "#D2D8E6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#0B1220",
  },

  error: {
    color: "#D23B3B",
    fontSize: 11,
    marginTop: 8,
    paddingLeft: 4,
  },

  btn: {
    backgroundColor: "#3D73E0",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 18,
  },
  btnText: { color: "white", fontWeight: "800" },
});
