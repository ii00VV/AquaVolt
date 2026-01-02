import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { requestPasswordReset } from "../services/auth";

export default function ForgotPasswordSentScreen({ navigation, route }) {
  const { height } = useWindowDimensions();
  const email = route?.params?.email || "";

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  // ✅ Match Login screen layout defaults
  const [headerH, setHeaderH] = useState(170);

  const GAP_AFTER_HEADER = Math.round(Math.min(28, Math.max(14, height * 0.025)));
  const CARD_HEIGHT_CAP = Math.round(Math.min(560, height * 0.72));

  const minTop = headerH + GAP_AFTER_HEADER;
  const desiredTop = height - CARD_HEIGHT_CAP;
  const cardTop = Math.max(minTop, desiredTop);

  const BLUE_AREA_HEIGHT = cardTop;

  const CONTENT_TOP_PADDING = Math.round(Math.min(44, Math.max(26, height * 0.05)));
  const HEADER_SHIFT_UP = Math.round(Math.min(24, Math.max(10, BLUE_AREA_HEIGHT * 0.08)));

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
      <SafeAreaView style={styles.safe}>
        {/* ✅ Blue area (same as Login) */}
        <View style={[styles.blueArea, { height: BLUE_AREA_HEIGHT }]}>
          <View
            style={[styles.header, { transform: [{ translateY: -HEADER_SHIFT_UP }] }]}
            onLayout={(e) => setHeaderH(e.nativeEvent.layout.height)}
          >
            <Image source={require("../../assets/logo.png")} style={styles.logo} resizeMode="contain" />
            <Text style={styles.brand}>AquaVolt</Text>
          </View>
        </View>

        {/* ✅ White card pinned (same as Login) */}
        <View style={[styles.card, { top: cardTop }]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.cardContent, { paddingTop: CONTENT_TOP_PADDING }]}
          >
            <View style={styles.contentWrap}>
              {/* Back */}
              <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={10}>
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

            <View style={{ height: 10 }} />
          </ScrollView>
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

  // ✅ Match Login sizing
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
    marginTop: 10,
    textAlign: "center",
    color: "#0B1220",
    marginBottom: 18,
    paddingHorizontal: 14,
    fontSize: 13,
    lineHeight: 18,
  },
  email: { color: "#3D73E0" },

  btn: {
    width: "100%",
    backgroundColor: "#3D73E0",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  btnText: { color: "white", fontWeight: "900", fontSize: 14 },

  resend: { color: "#3D73E0", textAlign: "center", fontSize: 12, fontWeight: "700" },
  msg: { marginTop: 10, textAlign: "center", color: "#5D6B86", fontSize: 12 },
});
