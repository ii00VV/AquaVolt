import React, { useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginWithEmail } from "../services/auth";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ field-level errors
  const [emailError, setEmailError] = useState("");
  const [pwError, setPwError] = useState("");

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const onLogin = async () => {
    setEmailError("");
    setPwError("");
    setLoading(true);

    const emailTrim = email.trim().toLowerCase();

    // ✅ Email validation under email field
    if (!emailTrim) {
      setEmailError("Email is required.");
      setLoading(false);
      return;
    }
    if (!isValidEmail(emailTrim)) {
      setEmailError("Enter a valid email address.");
      setLoading(false);
      return;
    }

    // ✅ Password validation under password field
    if (!password) {
      setPwError("Password is required.");
      setLoading(false);
      return;
    }

    try {
      await loginWithEmail({ email: emailTrim, password });
      navigation.replace("Dashboard");
    } catch (e) {
      if (e?.code === "EMAIL_NOT_VERIFIED" || e?.message === "EMAIL_NOT_VERIFIED") {
        setPwError("Please verify your email first.");
        navigation.replace("VerifyEmail");
      } else {
        setPwError("Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  const resetOnboarding = async () => {
    await AsyncStorage.removeItem("aquavolt_has_seen_onboarding");
    navigation.replace("Onboarding");
  };

  return (
    <LinearGradient colors={["#0B3A8D", "#0B1220"]} style={styles.bg}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.header}>
          <Image
            source={require("../../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.brand}>AquaVolt</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to monitor your system</Text>

          {/* Email */}
          <TextInput
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (emailError) setEmailError("");
              if (pwError) setPwError(""); // clear auth error too when user edits
            }}
            onBlur={() => {
              const emailTrim = email.trim().toLowerCase();
              if (!emailTrim) setEmailError("Email is required.");
              else if (!isValidEmail(emailTrim)) setEmailError("Enter a valid email address.");
              else setEmailError("");
            }}
            placeholder="Email Address"
            placeholderTextColor="#8B97AD"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}

          {/* Password */}
          <View style={styles.passwordWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor="#8B97AD"
              secureTextEntry={!showPw}
              style={styles.passwordInput}
            />
            <Pressable onPress={() => setShowPw((s) => !s)} style={styles.eyeBtn}>
              <Ionicons name={showPw ? "eye-off" : "eye"} size={20} color="#8B97AD" />
            </Pressable>
          </View>
          {!!pwError && <Text style={styles.fieldError}>{pwError}</Text>}

          <Pressable style={styles.loginBtn} onPress={onLogin} disabled={loading}>
            <Text style={styles.loginText}>{loading ? "Logging in..." : "Login"}</Text>
          </Pressable>

          <Pressable onPress={() => navigation.navigate("ForgotPassword")}>
            <Text style={styles.forgot}>Forgot Password</Text>
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don’t have an account? </Text>
            <Pressable onPress={() => navigation.navigate("SignUp")}>
              <Text style={styles.footerLink}>Sign Up</Text>
            </Pressable>
          </View>

          {__DEV__ && (
            <Pressable onPress={resetOnboarding} style={{ marginTop: 14 }}>
              <Text style={{ color: "#6A7CA3", fontSize: 12, textAlign: "center" }}>
                Reset Onboarding (dev)
              </Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },

  header: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingTop: 40,
  },
  logo: { width: 90, height: 90 },
  brand: { fontSize: 34, fontWeight: "700", color: "white" },

  card: {
    backgroundColor: "#EAF6FF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    paddingBottom: 28,
  },

  title: { fontSize: 22, fontWeight: "800", textAlign: "center", color: "#0B1220" },
  subtitle: { marginTop: 6, textAlign: "center", color: "#5D6B86", marginBottom: 14 },

  input: {
    backgroundColor: "#F7FBFF",
    borderWidth: 1,
    borderColor: "#D2D8E6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 6, // ✅ allow space for error line
    color: "#0B1220",
  },

  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FBFF",
    borderWidth: 1,
    borderColor: "#D2D8E6",
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 6, // ✅ allow space for error line
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    color: "#0B1220",
  },
  eyeBtn: { paddingLeft: 10, paddingVertical: 8 },

  fieldError: {
    color: "#D23B3B",
    fontSize: 11,
    marginTop: 2,
    marginBottom: 10,
    paddingLeft: 4,
  },

  loginBtn: {
    backgroundColor: "#3D73E0",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 2,
  },
  loginText: { color: "white", fontWeight: "800" },

  forgot: {
    textAlign: "center",
    color: "#6A7CA3",
    marginTop: 14,
    fontSize: 12,
  },

  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 22,
  },
  footerText: { color: "#6A7CA3", fontSize: 12 },
  footerLink: { color: "#3D73E0", fontWeight: "700", fontSize: 12 },
});
