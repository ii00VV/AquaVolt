import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { signUpWithEmail, emailToKey } from "../services/auth";
import { db } from "../services/firebase";
import { get, ref as dbRef, query, orderByChild, equalTo } from "firebase/database";

export default function SignUpScreen({ navigation }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [agree, setAgree] = useState(false);

  const [loading, setLoading] = useState(false);

  // field-level UI states
  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    pw: false,
    pw2: false,
  });

  // email uniqueness states (RTDB)
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailTaken, setEmailTaken] = useState(null); // null | true | false
  const [emailCheckError, setEmailCheckError] = useState("");

  const debounceRef = useRef(null);

  // ✅ fixes stale state issue
  const currentEmailRef = useRef("");
  const emailCheckTokenRef = useRef(0);

  const [termsVisible, setTermsVisible] = useState(false);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
  if (!touched.email) return;

  const emailLower = email.trim().toLowerCase();
  currentEmailRef.current = emailLower;

  // reset messages for new input
  setEmailCheckError("");
  setEmailTaken(null);

  if (debounceRef.current) clearTimeout(debounceRef.current);

  if (!emailLower) {
    setEmailChecking(false);
    return;
  }

  if (!isValidEmail(emailLower)) {
    setEmailChecking(false);
    return;
  }

  const token = ++emailCheckTokenRef.current;
  setEmailChecking(true);

  debounceRef.current = setTimeout(async () => {
    try {
      const taken = await checkEmailInDb(emailLower);

      // apply only if still latest request
      if (emailCheckTokenRef.current === token && currentEmailRef.current === emailLower) {
        setEmailTaken(taken);
      }
    } catch (e) {
      if (emailCheckTokenRef.current === token && currentEmailRef.current === emailLower) {
        setEmailCheckError("Could not check email. Check DB rules / connection.");
        setEmailTaken(null);
      }
    } finally {
      if (emailCheckTokenRef.current === token) {
        setEmailChecking(false);
      }
    }
  }, 500);

  return () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
  };
}, [email, touched.email]);


  const TERMS_TEXT = `Terms and Condition

1. Introduction

Welcome to AquaVolt. AquaVolt is a student-developed prototype system designed to monitor rainwater-based energy generation and non-potable water filtration using IoT-enabled devices. By accessing or using the AquaVolt mobile application, hardware, or related services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you should discontinue use of the system immediately.

2. Account Registration

To access AquaVolt features, users are required to create an account and provide accurate, complete, and up-to-date information. You are responsible for maintaining the confidentiality of your login credentials and for all activities conducted under your account. AquaVolt shall not be held liable for any loss or damage arising from unauthorized access resulting from your failure to safeguard your account credentials.

3. Device Usage and Connectivity

AquaVolt devices utilize ESP32-based hardware and support both WiFi and Bluetooth connectivity. WiFi mode enables cloud-based data synchronization and remote monitoring, while Bluetooth mode allows local, offline access to sensor data. You acknowledge that data availability, accuracy, and synchronization depend on network conditions, device configuration, and environmental factors. Users are solely responsible for proper device installation, configuration, and routine maintenance.

4. Data Collection and Privacy

AquaVolt collects operational data such as water flow rate, voltage output, battery charge level, and filtration-related measurements to provide system monitoring and analytics. When connected via WiFi, data may be transmitted to cloud services for visualization and storage. Bluetooth mode limits data access to local communication only. Personal information is not shared with third parties and is used solely for system functionality and academic demonstration purposes.

5. Service Availability

AquaVolt services are provided on an “as available” basis. While reasonable efforts are made to maintain system availability, uninterrupted operation cannot be guaranteed. Service interruptions may occur due to maintenance, software updates, hardware limitations, or connectivity issues. Bluetooth functionality is dependent on proximity, device power levels, and environmental interference.

6. Limitation of Liability

AquaVolt is provided strictly as a prototype system without warranties of any kind, express or implied. The developers shall not be held liable for device malfunction, inaccurate sensor readings, data loss, water-related damage, electrical issues, or any decisions made based on system outputs. Use of the system is entirely at the user’s own risk.

7. User Responsibilities

Users agree to operate AquaVolt in compliance with applicable laws and regulations and to refrain from attempting to modify, reverse engineer, or compromise the system. Proper installation, calibration, and regular inspection of hardware components are the responsibility of the user to ensure safe and effective operation.

8. Termination

AquaVolt reserves the right to suspend or terminate user access in cases of misuse, violation of these terms, or system abuse. Upon termination, access to stored cloud data may be permanently removed.

9. Changes to Terms

These Terms and Conditions may be updated periodically to reflect system improvements or documentation requirements. Continued use of AquaVolt following any updates constitutes acceptance of the revised terms.
`;

  const formatFullName = (value) => {
    const clean = value.trim().replace(/\s+/g, " ");
    if (!clean) return "";
    return clean
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  };

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // 8 chars + uppercase + lowercase + number
  const isStrongPassword = (v) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v);

  // --- RTDB email existence check ---
  const checkEmailInDb = async (emailLower) => {
    // Checks if ANY user in users/ has this email
    const q = query(dbRef(db, "users"), orderByChild("email"), equalTo(emailLower));
    const snap = await get(q);
    return snap.exists(); // true = taken
  };


  // ✅ FIXED: debounced email check that never gets stuck


  const fieldErrors = useMemo(() => {
    const e = {};

    const name = fullName.trim();
    if (touched.fullName && name.length > 0 && name.length < 8) {
      e.fullName = "Full name must be at least 8 characters.";
    }

    const emailLower = email.trim().toLowerCase();
    if (touched.email && emailLower.length > 0 && !isValidEmail(emailLower)) {
      e.email = "Enter a valid email address.";
    } else if (touched.email && isValidEmail(emailLower)) {
      if (emailChecking) e.email = "Checking email...";
      else if (emailCheckError) e.email = emailCheckError;
      else if (emailTaken === true) e.email = "That email is already registered.";
    }

    if (touched.pw && pw.length > 0 && !isStrongPassword(pw)) {
      e.pw = "Password must be 8+ chars and include uppercase, lowercase, and a number.";
    }

    if (touched.pw2 && pw2.length > 0 && pw !== pw2) {
      e.pw2 = "Passwords do not match.";
    }

    return e;
  }, [fullName, email, pw, pw2, touched, emailChecking, emailTaken, emailCheckError]);

  const emailLower = email.trim().toLowerCase();
  const nameFinal = formatFullName(fullName);

  const canSubmit =
    agree &&
    !loading &&
    nameFinal.length >= 8 &&
    isValidEmail(emailLower) &&
    emailTaken === false &&
    isStrongPassword(pw) &&
    pw === pw2;

  const onSignUp = async () => {
    setTouched({ fullName: true, email: true, pw: true, pw2: true });

    setLoading(true);
    try {
      if (!agree) return;
      if (nameFinal.length < 8) return;
      if (!isValidEmail(emailLower)) return;

      // Force a final uniqueness check if not done yet
      if (emailTaken === null) {
        const takenNow = await checkEmailInDb(emailLower);
        setEmailTaken(takenNow);
        if (takenNow) return;
      }
      if (emailTaken === true) return;

      if (!isStrongPassword(pw)) return;
      if (pw !== pw2) return;

      await signUpWithEmail({
        fullName: nameFinal,
        email: emailLower,
        password: pw,
      });

      navigation.replace("VerifyEmail");
    } catch (e) {
      console.log("SIGNUP ERROR:", e?.code, e?.message);

      // fallback (auth still enforces uniqueness)
      if (e?.code === "auth/email-already-in-use") setEmailTaken(true);
      else if (e?.code === "auth/invalid-email") setEmailCheckError("Enter a valid email address.");
      else setEmailCheckError(`Sign up failed. (${e?.code || "unknown"})`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0B3A8D", "#0B1220"]} style={styles.bg}>
      <View style={styles.header}>
        <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brand}>AquaVolt</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === "ios" ? "position" : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign in to monitor your system</Text>

          {/* Full Name */}
          <TextInput
            value={fullName}
            onChangeText={(v) => {
              if (!touched.fullName) setTouched((t) => ({ ...t, fullName: true }));
              setFullName(v);
            }}
            onBlur={() => setFullName((v) => formatFullName(v))}
            placeholder="Full Name"
            placeholderTextColor="#8B97AD"
            autoCapitalize="words"
            style={styles.input}
          />
          {!!fieldErrors.fullName && <Text style={styles.error}>{fieldErrors.fullName}</Text>}

          {/* Email */}
          <TextInput
            value={email}
            onFocus={() => {
              if (!touched.email) setTouched((t) => ({ ...t, email: true }));
            }}
            onChangeText={(v) => setEmail(v)}
            placeholder="Email Address"
            placeholderTextColor="#8B97AD"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />
          {!!fieldErrors.email && <Text style={styles.error}>{fieldErrors.email}</Text>}


          {/* Password */}
          <View style={styles.passwordWrap}>
            <TextInput
              value={pw}
              onChangeText={(v) => {
                if (!touched.pw) setTouched((t) => ({ ...t, pw: true }));
                setPw(v);
              }}
              placeholder="Password"
              placeholderTextColor="#8B97AD"
              secureTextEntry={!showPw}
              style={styles.passwordInput}
            />
            <Pressable onPress={() => setShowPw((s) => !s)} style={styles.eyeBtn}>
              <Ionicons name={showPw ? "eye-off" : "eye"} size={20} color="#8B97AD" />
            </Pressable>
          </View>
          {!!fieldErrors.pw && <Text style={styles.error}>{fieldErrors.pw}</Text>}

          {/* Confirm Password */}
          <View style={styles.passwordWrap}>
            <TextInput
              value={pw2}
              onChangeText={(v) => {
                if (!touched.pw2) setTouched((t) => ({ ...t, pw2: true }));
                setPw2(v);
              }}
              placeholder="Confirm Password"
              placeholderTextColor="#8B97AD"
              secureTextEntry={!showPw2}
              style={styles.passwordInput}
            />
            <Pressable onPress={() => setShowPw2((s) => !s)} style={styles.eyeBtn}>
              <Ionicons name={showPw2 ? "eye-off" : "eye"} size={20} color="#8B97AD" />
            </Pressable>
          </View>
          {!!fieldErrors.pw2 && <Text style={styles.error}>{fieldErrors.pw2}</Text>}

          {/* Terms */}
          <Pressable style={styles.termsRow} onPress={() => setAgree((a) => !a)}>
            <View style={[styles.checkbox, agree ? styles.checkboxChecked : null]} />
            <Text style={styles.termsText}>
              I agree to the{" "}
              <Text style={styles.link} onPress={() => setTermsVisible(true)}>
                Terms and Conditions
              </Text>
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.signUpBtn,
              !agree ? styles.btnDisabled : null,
              agree && !canSubmit ? { opacity: 0.65 } : null,
            ]}
            onPress={onSignUp}
            disabled={!canSubmit}
          >
            <Text style={styles.signUpText}>{loading ? "Signing up..." : "Sign Up"}</Text>
          </Pressable>

          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <Pressable onPress={() => navigation.replace("Login")}>
              <Text style={styles.footerLink}>Sign In</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Terms Modal */}
      <Modal
        visible={termsVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTermsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Terms and Conditions</Text>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator>
              <Text style={styles.modalText}>{TERMS_TEXT}</Text>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => setTermsVisible(false)}
              >
                <Text style={styles.modalBtnSecondaryText}>Close</Text>
              </Pressable>

              <Pressable
                style={[styles.modalBtn, styles.modalBtnPrimary]}
                onPress={() => {
                  setAgree(true);
                  setTermsVisible(false);
                }}
              >
                <Text style={styles.modalBtnPrimaryText}>I Agree</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

  title: { fontSize: 22, fontWeight: "800", textAlign: "center", color: "#0B1220" },
  subtitle: { marginTop: 6, textAlign: "center", color: "#5D6B86", marginBottom: 14 },

  input: {
    backgroundColor: "#F7FBFF",
    borderWidth: 1,
    borderColor: "#D2D8E6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
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
    marginBottom: 10,
  },
  passwordInput: { flex: 1, paddingVertical: 12, color: "#0B1220" },
  eyeBtn: { paddingLeft: 10, paddingVertical: 8 },

  error: {
    color: "#D23B3B",
    fontSize: 11,
    marginTop: -6,
    marginBottom: 8,
    paddingLeft: 4,
  },

  termsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4, marginBottom: 18 },
  checkbox: { width: 14, height: 14, borderRadius: 3, borderWidth: 1, borderColor: "#AAB5CF" },
  checkboxChecked: { backgroundColor: "#3D73E0", borderColor: "#3D73E0" },
  termsText: { color: "#6A7CA3", fontSize: 12 },
  link: { color: "#3D73E0", fontWeight: "700" },

  signUpBtn: { backgroundColor: "#3D73E0", paddingVertical: 14, borderRadius: 10, alignItems: "center" },
  btnDisabled: { backgroundColor: "#7F7F7F" },
  signUpText: { color: "white", fontWeight: "800" },

  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
  footerText: { color: "#6A7CA3", fontSize: 12 },
  footerLink: { color: "#3D73E0", fontWeight: "700", fontSize: 12 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 18,
  },

  modalCard: {
    backgroundColor: "#EAF6FF",
    borderRadius: 18,
    padding: 16,
    maxHeight: "85%",
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0B1220",
    textAlign: "center",
    marginBottom: 10,
  },

  modalBody: {
    borderRadius: 12,
    backgroundColor: "#F7FBFF",
    borderWidth: 1,
    borderColor: "#D2D8E6",
    padding: 12,
  },

  modalText: { color: "#0B1220", fontSize: 12, lineHeight: 18 },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 12 },

  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },

  modalBtnSecondary: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D2D8E6" },
  modalBtnSecondaryText: { color: "#6A7CA3", fontWeight: "800" },

  modalBtnPrimary: { backgroundColor: "#3D73E0" },
  modalBtnPrimaryText: { color: "white", fontWeight: "800" },
});
