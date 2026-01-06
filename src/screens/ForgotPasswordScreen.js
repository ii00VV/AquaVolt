import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  Image,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { requestPasswordReset } from "../services/auth";

export default function ForgotPasswordScreen({ navigation }) {
  const { height } = useWindowDimensions();

  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [headerH, setHeaderH] = useState(170);

  const GAP_AFTER_HEADER = Math.round(Math.min(28, Math.max(14, height * 0.025)));
  const CARD_HEIGHT_CAP = Math.round(Math.min(560, height * 0.72));

  const minTop = headerH + GAP_AFTER_HEADER;
  const desiredTop = height - CARD_HEIGHT_CAP;
  const cardTop = Math.max(minTop, desiredTop);

  const BLUE_AREA_HEIGHT = cardTop;

  const CONTENT_TOP_PADDING = Math.round(Math.min(44, Math.max(26, height * 0.05)));
  const HEADER_SHIFT_UP = Math.round(Math.min(24, Math.max(10, BLUE_AREA_HEIGHT * 0.08)));

  const emailLower = email.trim().toLowerCase();
  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const fieldError = useMemo(() => {
    if (!touched) return "";
    if (!emailLower) return "Email is required.";
    if (!isValidEmail(emailLower)) return "Enter a valid email address.";
    return "";
  }, [touched, emailLower]);

  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [keyboardH, setKeyboardH] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setKeyboardOpen(true);
      const h = e?.endCoordinates?.height ?? 0;
      setKeyboardH(h);
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardOpen(false);
      setKeyboardH(0);
    });

    return () => {
      showSub?.remove?.();
      hideSub?.remove?.();
    };
  }, []);

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

  const EXTRA_BOTTOM_SPACE = 18;
  const dynamicBottomPad = keyboardOpen ? keyboardH + EXTRA_BOTTOM_SPACE : EXTRA_BOTTOM_SPACE;

  return (
    <LinearGradient colors={["#0B3A8D", "#0B1220"]} style={styles.bg}>
      <SafeAreaView style={styles.safe}>
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
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            enabled={keyboardOpen}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
          >
            <ScrollView
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              automaticallyAdjustKeyboardInsets={Platform.OS === "ios"}
              contentContainerStyle={[
                styles.cardContent,
                {
                  paddingTop: CONTENT_TOP_PADDING,
                  paddingBottom: 20 + dynamicBottomPad,
                },
              ]}
            >
              <View style={styles.contentWrap}>
                <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
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
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                />

                {!!fieldError && <Text style={styles.error}>{fieldError}</Text>}
                {!!error && <Text style={styles.error}>{error}</Text>}

                <Pressable style={styles.btn} onPress={onConfirm} disabled={loading}>
                  <Text style={styles.btnText}>{loading ? "Sending..." : "Confirm Email"}</Text>
                </Pressable>
              </View>

              <View style={{ height: 10 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  safe: { flex: 1 },

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

  cardContent: {
    paddingBottom: 20,
    alignItems: "center",
  },

  contentWrap: {
    width: "88%",
    maxWidth: 440,
    alignItems: "center",
  },

  backBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: -16,
    marginBottom: 10,
  },
  backLabel: { color: "#0B1220", fontSize: 12, fontWeight: "600" },

  illus: { width: "100%", height: 150, marginTop: 6, marginBottom: 12 },

  title: { fontSize: 24, fontWeight: "900", textAlign: "center", color: "#0B1220" },
  subtitle: {
    marginTop: 8,
    textAlign: "center",
    color: "#5D6B86",
    marginBottom: 18,
    paddingHorizontal: 10,
    fontSize: 13,
    lineHeight: 18,
  },

  input: {
    width: "100%",
    backgroundColor: "#F7FBFF",
    borderWidth: 1,
    borderColor: "#D2D8E6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#0B1220",
    fontSize: 14,
  },

  error: {
    width: "100%",
    color: "#D23B3B",
    fontSize: 11,
    marginTop: 8,
    paddingLeft: 4,
  },

  btn: {
    width: "100%",
    backgroundColor: "#3D73E0",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
  },
  btnText: { color: "white", fontWeight: "900", fontSize: 14 },
});
