import React, { useMemo, useRef, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  Modal,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { signUpWithEmail } from "../services/auth";
import { db } from "../services/firebase";
import { get, ref as dbRef, query, orderByChild, equalTo } from "firebase/database";

export default function SignUpScreen({ navigation }) {
  const { height } = useWindowDimensions();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");

  const [showPw, setShowPw] = useState(false);
  const [showPw2, setShowPw2] = useState(false);
  const [agree, setAgree] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ match Login: default headerH so layout doesn't jump
  const [headerH, setHeaderH] = useState(170);

  // ✅ match Login: same split behavior
  const GAP_AFTER_HEADER = Math.round(Math.min(28, Math.max(14, height * 0.025)));
  const CARD_HEIGHT_CAP = Math.round(Math.min(560, height * 0.72)); // 👈 SAME AS LOGIN

  const minTop = headerH + GAP_AFTER_HEADER;
  const desiredTop = height - CARD_HEIGHT_CAP;
  const cardTop = Math.max(minTop, desiredTop);

  const BLUE_AREA_HEIGHT = cardTop;

  // ✅ match Login: same white-card top padding behavior
  const CONTENT_TOP_PADDING = Math.round(Math.min(44, Math.max(26, height * 0.05)));

  // ✅ match Login: shift logo+name up
  const HEADER_SHIFT_UP = Math.round(Math.min(24, Math.max(10, BLUE_AREA_HEIGHT * 0.08)));

  const [touched, setTouched] = useState({
    fullName: false,
    email: false,
    pw: false,
    pw2: false,
  });

  const [emailChecking, setEmailChecking] = useState(false);
  const [emailTaken, setEmailTaken] = useState(null);
  const [emailCheckError, setEmailCheckError] = useState("");

  const debounceRef = useRef(null);
  const currentEmailRef = useRef("");
  const emailCheckTokenRef = useRef(0);

  const [termsVisible, setTermsVisible] = useState(false);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const TERMS_TEXT = `Terms and Condition

1. Introduction

Welcome to AquaVolt. AquaVolt is a student-developed prototype system designed to monitor rainwater-based energy generation and non-potable water filtration using IoT-enabled devices. By accessing or using the AquaVolt mobile application, hardware, or related services, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you should discontinue use of the system immediately.

2. Account Registration

To access AquaVolt features, users are required to create an account and provide accurate, complete, and up-to-date information. You are responsible for maintaining the confidentiality of your login credentials and for all activities conducted under your account. AquaVolt shall not be held liable for any loss or damage arising from unauthorized access resulting from your failure to safeguard your account credentials.

3. Device Usage and Connectivity

AquaVolt devices utilize ESP32-based hardware and support both WiFi and Bluetooth connectivity. WiFi mode enables cloud-based data synchronization and remote monitoring, while Bluetooth mode allows local, offline access to sensor data. You acknowledge that data availability, accuracy, and synchronization depend on network conditions, device configuration, and environmental factors. Users are solely responsible for proper device installation, configuration, and routine maintenance.

4. Data Collection and Privacy

AquaVolt collects operational data such as water flow rate, voltage output, battery charge level, and filtration-related measurements to provide system monitoring and analytics. When connected via WiFi, data may be transmitted to cloud services for visualization and storage. Bluetooth mode limits data access to local communication only. Personal information is not shared with third parties and is used solely for system functionality and academic demonstration purposes.

5. Service Availability_ntt

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
  const isStrongPassword = (v) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v);

  const checkEmailInDb = async (emailLower) => {
    const q = query(dbRef(db, "users"), orderByChild("email"), equalTo(emailLower));
    const snap = await get(q);
    return snap.exists();
  };

  useEffect(() => {
    if (!touched.email) return;

    const emailLower = email.trim().toLowerCase();
    currentEmailRef.current = emailLower;

    setEmailCheckError("");
    setEmailTaken(null);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!emailLower || !isValidEmail(emailLower)) {
      setEmailChecking(false);
      return;
    }

    const token = ++emailCheckTokenRef.current;
    setEmailChecking(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const taken = await checkEmailInDb(emailLower);
        if (emailCheckTokenRef.current === token && currentEmailRef.current === emailLower) {
          setEmailTaken(taken);
        }
      } catch (e) {
        if (emailCheckTokenRef.current === token && currentEmailRef.current === emailLower) {
          setEmailCheckError("Could not check email. Check DB rules / connection.");
          setEmailTaken(null);
        }
      } finally {
        if (emailCheckTokenRef.current === token) setEmailChecking(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [email, touched.email]);

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
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0B3A8D", "#0B1220"]} style={styles.bg}>
      <SafeAreaView style={styles.safe}>
        {/* ✅ EXACT same header structure as Login */}
        <View style={[styles.blueArea, { height: BLUE_AREA_HEIGHT }]}>
          <View
            style={[styles.header, { transform: [{ translateY: -HEADER_SHIFT_UP }] }]}
            onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
          >
            <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brand}>AquaVolt</Text>
          </View>
        </View>

        <View style={[styles.card, { top: cardTop }]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.cardContent, { paddingTop: CONTENT_TOP_PADDING }]}
          >
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign in to monitor your system</Text>

            <View style={styles.form}>
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
              {!!fieldErrors.fullName && <Text style={styles.fieldError}>{fieldErrors.fullName}</Text>}

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
              {!!fieldErrors.email && <Text style={styles.fieldError}>{fieldErrors.email}</Text>}

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
                  <Ionicons name={showPw ? "eye-off" : "eye"} size={22} color="#8B97AD" />
                </Pressable>
              </View>
              {!!fieldErrors.pw && <Text style={styles.fieldError}>{fieldErrors.pw}</Text>}

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
                  <Ionicons name={showPw2 ? "eye-off" : "eye"} size={22} color="#8B97AD" />
                </Pressable>
              </View>
              {!!fieldErrors.pw2 && <Text style={styles.fieldError}>{fieldErrors.pw2}</Text>}

              <Pressable style={styles.termsRow} onPress={() => setAgree((a) => !a)}>
                <View style={[styles.checkbox, agree ? styles.checkboxChecked : null]} />
                <Text style={styles.termsText}>
                  I agree to the{" "}
                  <Text style={styles.footerLink} onPress={() => setTermsVisible(true)}>
                    Terms and Conditions
                  </Text>
                </Text>
              </Pressable>

              <Pressable
                style={[styles.signUpBtn, !canSubmit ? { opacity: 0.65 } : null]}
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

            <View style={{ height: 10 }} />
          </ScrollView>
        </View>

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
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },

  // ✅ EXACT same header styles as Login
  blueArea: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 8,
  },
  logo: { width: 112, height: 112 },
  brand: { fontSize: 40, fontWeight: "800", color: "white", marginTop: 4 },

  // ✅ same card container style
  card: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#EAF6FF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },

  // ✅ match Login white-card spacing
  cardContent: {
    paddingBottom: 20,
    alignItems: "center",
  },

  // ✅ match Login form sizing
  form: {
    width: "88%",
    maxWidth: 440,
    marginTop: 16,
  },

  // ✅ match Login typography
  title: { fontSize: 24, fontWeight: "900", textAlign: "center", color: "#0B1220" },
  subtitle: { marginTop: 8, textAlign: "center", color: "#5D6B86", fontSize: 13 },

  // ✅ match Login input sizing
  input: {
    width: "100%",
    backgroundColor: "#F7FBFF",
    borderWidth: 1,
    borderColor: "#D2D8E6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 16,
    color: "#0B1220",
    fontSize: 14,
  },

  passwordWrap: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7FBFF",
    borderWidth: 1,
    borderColor: "#D2D8E6",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginTop: 14,
  },
  passwordInput: { flex: 1, paddingVertical: 14, color: "#0B1220", fontSize: 14 },
  eyeBtn: { paddingLeft: 10, paddingVertical: 8 },

  // ✅ use same error style name as Login (fieldError)
  fieldError: {
    width: "100%",
    color: "#D23B3B",
    fontSize: 11,
    marginTop: 6,
    paddingLeft: 4,
  },

  // Terms row fits with the new spacing
  termsRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
    marginBottom: 6,
  },
  checkbox: { width: 14, height: 14, borderRadius: 3, borderWidth: 1, borderColor: "#AAB5CF" },
  checkboxChecked: { backgroundColor: "#3D73E0", borderColor: "#3D73E0" },
  termsText: { color: "#6A7CA3", fontSize: 12 },

  // ✅ match Login button sizing
  signUpBtn: {
    width: "100%",
    backgroundColor: "#3D73E0",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
  },
  signUpText: { color: "white", fontWeight: "900", fontSize: 14 },

  // ✅ match Login footer spacing/styles
  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { color: "#6A7CA3", fontSize: 12 },
  footerLink: { color: "#3D73E0", fontWeight: "800", fontSize: 12 },

  // Modal unchanged
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
