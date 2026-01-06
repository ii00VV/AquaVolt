import React, { useEffect, useMemo, useState } from "react";
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
  Modal,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loginWithEmail, loginWithGoogleTokens, logout } from "../services/auth";

import { auth, db } from "../services/firebase";
import { ref, get, update, serverTimestamp } from "firebase/database";
import { reload, sendEmailVerification } from "firebase/auth";

import * as AuthSession from "expo-auth-session";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID =
  "94977781048-c9psb541blo0nnlc3plmhlu4sk3b0clt.apps.googleusercontent.com";
const IOS_CLIENT_ID =
  "94977781048-2bo7fevnefuj4li0n5eqde7hgn0ekaid.apps.googleusercontent.com";
const ANDROID_CLIENT_ID =
  "94977781048-8lb9sbv7f3qegi3oshv28m1blhffhubn.apps.googleusercontent.com";

const PROJECT_NAME_FOR_PROXY = "@llowww/aquavolt";
const EXPO_PROXY_REDIRECT_URI = `https://auth.expo.io/${PROJECT_NAME_FOR_PROXY}`;

function randomNonce(len = 32) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function getDisabledFlag(uid) {
  const snap = await get(ref(db, `users/${uid}/disabled`));
  if (!snap.exists()) return false;
  return !!snap.val();
}

async function syncPendingEmailIfNeeded(user) {
  if (!user?.uid) return;

  try {
    await user.getIdToken(true);
  } catch {}
  try {
    await reload(user);
  } catch {}

  const uid = user.uid;
  const authEmailLower = (user.email || "").trim().toLowerCase();
  if (!authEmailLower) return;

  const snap = await get(ref(db, `users/${uid}`));
  if (!snap.exists()) return;

  const node = snap.val() || {};
  const pendingLower = String(node.pendingEmailLower || node.pendingEmail || "")
    .trim()
    .toLowerCase();

  if (pendingLower && pendingLower === authEmailLower) {
    await update(ref(db, `users/${uid}`), {
      email: authEmailLower,
      emailLower: authEmailLower,
      emailVerified: true,
      verifiedAt: serverTimestamp(),
      pendingEmail: null,
      pendingEmailLower: null,
      emailChangedAt: serverTimestamp(),
    });
  }
}

export default function LoginScreen({ navigation }) {
  const { height } = useWindowDimensions();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [pwError, setPwError] = useState("");

  const [disabledVisible, setDisabledVisible] = useState(false);
  const [disabledMsg, setDisabledMsg] = useState("");
  const [disabledBusy, setDisabledBusy] = useState(false);

  const [headerH, setHeaderH] = useState(170);

  const GAP_AFTER_HEADER = Math.round(Math.min(28, Math.max(14, height * 0.025)));
  const CARD_HEIGHT_CAP = Math.round(Math.min(560, height * 0.72));

  const minTop = headerH + GAP_AFTER_HEADER;
  const desiredTop = height - CARD_HEIGHT_CAP;
  const cardTop = Math.max(minTop, desiredTop);

  const BLUE_AREA_HEIGHT = cardTop;
  const CONTENT_TOP_PADDING = Math.round(Math.min(44, Math.max(26, height * 0.05)));
  const HEADER_SHIFT_UP = Math.round(Math.min(24, Math.max(10, BLUE_AREA_HEIGHT * 0.08)));

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const isExpoGo = Constants.appOwnership === "expo";
  const nonce = useMemo(() => randomNonce(32), []);

  const googleConfig = useMemo(() => {
    if (isExpoGo) {
      return {
        expoClientId: WEB_CLIENT_ID,
        iosClientId: WEB_CLIENT_ID,
        androidClientId: WEB_CLIENT_ID,
        webClientId: WEB_CLIENT_ID,
        redirectUri: EXPO_PROXY_REDIRECT_URI,
        usePKCE: false,
        responseType: AuthSession.ResponseType.IdToken,
        extraParams: { nonce, prompt: "select_account" },
      };
    }

    const nativeRedirectUri = AuthSession.makeRedirectUri({ scheme: "aquavolt" });
    return {
      expoClientId: WEB_CLIENT_ID,
      iosClientId: IOS_CLIENT_ID,
      androidClientId: ANDROID_CLIENT_ID,
      redirectUri: nativeRedirectUri,
      usePKCE: true,
      responseType: AuthSession.ResponseType.Code,
      extraParams: { prompt: "select_account" },
    };
  }, [isExpoGo, nonce]);

  const [request, response, promptAsync] = Google.useAuthRequest(googleConfig);

  const checkDisabledAndRoute = async () => {
    const user = auth.currentUser;
    if (!user) {
      navigation.replace("Login");
      return;
    }

    try {
      await reload(user);
    } catch {}

    const uid = user.uid;

    let disabled = false;
    try {
      disabled = await getDisabledFlag(uid);
    } catch {
      navigation.replace("MainTabs");
      return;
    }

    if (!disabled) {
      navigation.replace("MainTabs");
      return;
    }

    setDisabledMsg("");
    setDisabledVisible(true);
  };

  useEffect(() => {
    if (!response) return;

    if (response.type === "success") {
      const idToken = response.params?.id_token || null;

      (async () => {
        try {
          setLoading(true);
          setPwError("");

          if (!idToken) {
            setPwError("Google login failed: missing idToken.");
            return;
          }

          const u = await loginWithGoogleTokens({ idToken, accessToken: null });

          try {
            await syncPendingEmailIfNeeded(auth.currentUser || u);
          } catch {}

          await checkDisabledAndRoute();
        } catch (e) {
          console.log("Google SSO error:", e);
          setPwError(e?.message || "Google login failed. Please try again.");
        } finally {
          setLoading(false);
        }
      })();
    } else if (response.type === "error") {
      console.log("Google auth error:", response.error, response);
      setPwError("Google login failed (auth error).");
    } else if (response.type === "dismiss") {
      setPwError("Google login cancelled.");
    }
  }, [response, navigation]);

  const onLogin = async () => {
    setEmailError("");
    setPwError("");
    setLoading(true);

    const emailTrim = email.trim().toLowerCase();

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
    if (!password) {
      setPwError("Password is required.");
      setLoading(false);
      return;
    }

    try {
      const u = await loginWithEmail({ email: emailTrim, password });

      try {
        await syncPendingEmailIfNeeded(auth.currentUser || u);
      } catch {}

      await checkDisabledAndRoute();
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

  const onGoogleSSO = async () => {
    try {
      setPwError("");
      await promptAsync({
        useProxy: isExpoGo,
        projectNameForProxy: isExpoGo ? PROJECT_NAME_FOR_PROXY : undefined,
        preferEphemeralSession: false,
      });
    } catch (e) {
      console.log("promptAsync error:", e);
      setPwError("Google login cancelled/failed.");
    }
  };

  const onDisabledLogout = async () => {
    if (disabledBusy) return;
    setDisabledBusy(true);
    try {
      await logout();
    } catch {}
    setDisabledVisible(false);
    setDisabledMsg("");
    setDisabledBusy(false);
  };

  const onReactivate = async () => {
    const user = auth.currentUser;
    if (!user) {
      setDisabledMsg("No active session. Please log in again.");
      return;
    }
    if (disabledBusy) return;

    setDisabledBusy(true);
    setDisabledMsg("");

    try {
      try {
        await reload(user);
      } catch {}

      await sendEmailVerification(user);

      await update(ref(db, `users/${user.uid}`), {
        reactivationPending: true,
        reactivationEmailSentAt: serverTimestamp(),
      });

      setDisabledVisible(false);
      setDisabledMsg("");

      navigation.replace("VerifyEmail", { mode: "reactivation" });
    } catch (e) {
      const code = e?.code || "";
      const friendly =
        code === "auth/too-many-requests"
          ? "Too many requests. Please wait and try again."
          : code === "auth/network-request-failed"
          ? "Network error. Check your connection and try again."
          : "Could not send verification email. Please try again.";

      setDisabledMsg(friendly);
    } finally {
      setDisabledBusy(false);
    }
  };

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
          <ScrollView
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.cardContent, { paddingTop: CONTENT_TOP_PADDING }]}
          >
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to monitor your system</Text>

            <View style={styles.form}>
              <TextInput
                value={email}
                onChangeText={(v) => {
                  setEmail(v);
                  if (emailError) setEmailError("");
                  if (pwError) setPwError("");
                }}
                onBlur={() => {
                  const emailTrim2 = email.trim().toLowerCase();
                  if (!emailTrim2) setEmailError("Email is required.");
                  else if (!isValidEmail(emailTrim2)) setEmailError("Enter a valid email address.");
                  else setEmailError("");
                }}
                placeholder="Email Address"
                placeholderTextColor="#8B97AD"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />
              {!!emailError && <Text style={styles.fieldError}>{emailError}</Text>}

              <View style={styles.passwordWrap}>
                <TextInput
                  value={password}
                  onChangeText={(v) => {
                    setPassword(v);
                    if (pwError) setPwError("");
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
                <Pressable onPress={resetOnboarding} style={{ marginTop: 16 }}>
                  <Text style={{ color: "#6A7CA3", fontSize: 12, textAlign: "center" }}>
                    Reset Onboarding (dev)
                  </Text>
                </Pressable>
              )}

              <View style={styles.ssoBlock}>
                <View style={styles.dividerRow}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or</Text>
                  <View style={styles.dividerLine} />
                </View>

                <Pressable
                  style={[styles.ssoBtn, (!request || loading) && { opacity: 0.6 }]}
                  onPress={onGoogleSSO}
                  disabled={!request || loading}
                >
                  <Image source={require("../../assets/google.png")} style={styles.googleIcon} resizeMode="contain" />
                  <Text style={styles.ssoText}>Continue with Google</Text>
                </Pressable>
              </View>
            </View>

            <View style={{ height: 10 }} />
          </ScrollView>
        </View>

        <Modal visible={disabledVisible} animationType="fade" transparent onRequestClose={() => {}}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Account Disabled</Text>
              <Text style={styles.modalSub}>
                Your account is currently disabled. Would you like to reactivate it?
              </Text>

              {!!disabledMsg && <Text style={styles.modalInfo}>{disabledMsg}</Text>}

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalBtn, styles.modalBtnSecondary]}
                  onPress={onDisabledLogout}
                  disabled={disabledBusy}
                >
                  <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.modalBtn,
                    styles.modalBtnPrimary,
                    disabledBusy ? { opacity: 0.75 } : null,
                  ]}
                  onPress={onReactivate}
                  disabled={disabledBusy}
                >
                  {disabledBusy ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.modalBtnPrimaryText}>Working...</Text>
                    </View>
                  ) : (
                    <Text style={styles.modalBtnPrimaryText}>Reactivate Account</Text>
                  )}
                </Pressable>
              </View>

              <Text style={styles.modalHint}>
                A verification email will be sent. Open the link to reactivate your account.
              </Text>
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

  blueArea: { width: "100%", alignItems: "center", justifyContent: "center" },
  header: { alignItems: "center", justifyContent: "center", paddingBottom: 8 },
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
  cardContent: { paddingBottom: 20, alignItems: "center" },

  form: { width: "88%", maxWidth: 440, marginTop: 16 },

  title: { fontSize: 24, fontWeight: "900", textAlign: "center", color: "#0B1220" },
  subtitle: { marginTop: 8, textAlign: "center", color: "#5D6B86", fontSize: 13 },

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

  fieldError: { width: "100%", color: "#D23B3B", fontSize: 11, marginTop: 6, paddingLeft: 4 },

  loginBtn: {
    width: "100%",
    backgroundColor: "#3D73E0",
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 18,
  },
  loginText: { color: "white", fontWeight: "900", fontSize: 14 },

  forgot: { textAlign: "center", color: "#6A7CA3", marginTop: 16, fontSize: 12 },

  footerRow: { flexDirection: "row", justifyContent: "center", marginTop: 24 },
  footerText: { color: "#6A7CA3", fontSize: 12 },
  footerLink: { color: "#3D73E0", fontWeight: "800", fontSize: 12 },

  ssoBlock: { marginTop: 18 },
  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#D2D8E6" },
  dividerText: { marginHorizontal: 10, color: "#6A7CA3", fontSize: 12, fontWeight: "700" },

  ssoBtn: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D2D8E6",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  ssoText: { color: "#000", fontWeight: "900", fontSize: 14 },
  googleIcon: { width: 18, height: 18 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#D8E0EF",
  },
  modalTitle: { fontSize: 16, fontWeight: "900", color: "#0B1220", textAlign: "center" },
  modalSub: {
    marginTop: 8,
    fontSize: 12,
    fontWeight: "700",
    color: "#6B7A99",
    textAlign: "center",
    lineHeight: 16,
  },
  modalInfo: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: "800",
    color: "#2F5FE8",
    textAlign: "center",
    lineHeight: 16,
  },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  modalBtnSecondary: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D8E0EF" },
  modalBtnSecondaryText: { color: "#6B7A99", fontWeight: "900", fontSize: 12 },
  modalBtnPrimary: { backgroundColor: "#2F5FE8" },
  modalBtnPrimaryText: { color: "#FFFFFF", fontWeight: "900", fontSize: 12 },

  modalHint: {
    marginTop: 12,
    fontSize: 11,
    fontWeight: "700",
    color: "#7C8AA6",
    textAlign: "center",
    lineHeight: 15,
  },
});
