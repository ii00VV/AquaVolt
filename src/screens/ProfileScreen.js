import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { ref, get } from "firebase/database";
import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { auth, db } from "../services/firebase";
import { logout } from "../services/auth";
import { getSavedDevice } from "../services/deviceStore";

async function fetchUserNode(uid) {
  if (!uid) return null;
  try {
    const snap = await get(ref(db, `users/${uid}`));
    return snap.exists() ? snap.val() : null;
  } catch {
    return null;
  }
}

function ProfileRow({ label, value, onPress }) {
  return (
    <Pressable style={styles.rowBtn} onPress={onPress}>
      <View>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#8B97AD" />
    </Pressable>
  );
}

function DevicePill({ id, online = true }) {
  return (
    <View style={styles.devicePill}>
      <View style={styles.deviceLeft}>
        <Ionicons name="hardware-chip-outline" size={18} color="#5D6B86" />
        <Text style={styles.deviceId} numberOfLines={1}>
          {id}
        </Text>
      </View>
      <View style={[styles.statusDot, { backgroundColor: online ? "#25C25A" : "#D23B3B" }]} />
    </View>
  );
}

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState("User");
  const [email, setEmail] = useState("—");

  const [loadingDevice, setLoadingDevice] = useState(true);
  const [device, setDevice] = useState(null);

  const [logoutVisible, setLogoutVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [confirmError, setConfirmError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadingDevice(true);

    const u = auth.currentUser;
    const uid = u?.uid;

    const node = await fetchUserNode(uid);

    const nameFallback =
      node?.fullName ||
      u?.displayName ||
      (u?.email ? u.email.split("@")[0] : null) ||
      "User";

    const emailFallback = u?.email || node?.email || "—";

    setFullName(nameFallback);
    setEmail(emailFallback);
    setLoading(false);

    try {
      const d = await getSavedDevice(uid);
      setDevice(d || null);
    } catch {
      setDevice(null);
    } finally {
      setLoadingDevice(false);
    }
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener("focus", refresh);
    refresh();
    return unsub;
  }, [navigation, refresh]);

  const onEditProfile = () => {
    setPw("");
    setShowPw(false);
    setConfirmError("");
    setConfirmVisible(true);
  };

  const onConfirmPassword = async () => {
    const u = auth.currentUser;

    if (!u?.email) {
      setConfirmError("Not logged in. Please login again.");
      return;
    }
    if (!pw.trim()) {
      setConfirmError("Password is required.");
      return;
    }
    if (confirming) return;

    try {
      setConfirming(true);
      setConfirmError("");

      const cred = EmailAuthProvider.credential(u.email, pw);
      await reauthenticateWithCredential(u, cred);

      setConfirmVisible(false);
      setPw("");
      setConfirmError("");
      navigation.navigate("EditProfile");
    } catch (e) {
      if (e?.code === "auth/wrong-password") {
        setConfirmError("Incorrect password. Please try again.");
      } else if (e?.code === "auth/too-many-requests") {
        setConfirmError("Too many attempts. Please try again later.");
      } else if (e?.code === "auth/user-mismatch" || e?.code === "auth/user-not-found") {
        setConfirmError("Session error. Please login again.");
      } else {
        setConfirmError("Could not confirm password. Please try again.");
      }
    } finally {
      setConfirming(false);
    }
  };

  const doLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
      setLogoutVisible(false);
      navigation.replace("Login");
    } catch (e) {
      Alert.alert("Logout failed", e?.message || "Please try again.");
    } finally {
      setLoggingOut(false);
    }
  };

  const deviceId = device?.id || device?.deviceId || "—";
  const deviceOnline = device?.online ?? true;

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#0B3A8D", "#061A33"]} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <Image
                source={require("../../assets/logo.png")}
                style={styles.headerLogo}
                resizeMode="contain"
              />
              <Text style={styles.headerBrand}>AquaVolt</Text>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={44} color="#FFFFFF" />
          </View>
          <Text style={styles.userName}>{loading ? "..." : fullName}</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardTitle}>Profile</Text>
            <Pressable style={styles.editBtn} onPress={onEditProfile}>
              <Ionicons name="create-outline" size={16} color="#0B1220" />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </Pressable>
          </View>

          <ProfileRow label="Full Name" value={loading ? "..." : fullName} onPress={onEditProfile} />
          <ProfileRow label="Email" value={loading ? "..." : email} onPress={onEditProfile} />
          <ProfileRow label="Password" value="********" onPress={onEditProfile} />
        </View>

        <View style={styles.deviceCard}>
          <Text style={styles.deviceCardTitle}>Connected Device</Text>

          {loadingDevice ? (
            <Text style={styles.mutedText}>Checking connected device...</Text>
          ) : device ? (
            <DevicePill id={deviceId} online={deviceOnline} />
          ) : (
            <Text style={styles.mutedText}>No device connected yet.</Text>
          )}
        </View>

        <Pressable
          style={styles.logoutBtn}
          onPress={() => setLogoutVisible(true)}
          disabled={loggingOut}
        >
          <Ionicons name="log-out-outline" size={18} color="#FFFFFF" />
          <Text style={styles.logoutText}>{loggingOut ? "Logging out..." : "Logout"}</Text>
        </Pressable>

        <View style={{ height: 28 }} />
      </ScrollView>

      <Modal
        visible={confirmVisible}
        animationType="fade"
        transparent
        onRequestClose={() => !confirming && setConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalTopRow}>
              <Text style={styles.modalTitle}>Security Check</Text>
              <Pressable
                onPress={() => !confirming && setConfirmVisible(false)}
                hitSlop={10}
                disabled={confirming}
                style={[styles.modalCloseBtn, confirming ? { opacity: 0.5 } : null]}
              >
                <Ionicons name="close" size={18} color="#0B1220" />
              </Pressable>
            </View>

            <Text style={styles.modalSub}>
              Please enter your password to continue editing your profile.
            </Text>

            <Text style={[styles.modalLabel, { marginTop: 12 }]}>Password</Text>

            <View style={styles.passwordWrap}>
              <TextInput
                value={pw}
                onChangeText={(t) => {
                  setPw(t);
                  if (confirmError) setConfirmError("");
                }}
                placeholder="Enter password"
                style={styles.passwordInput}
                secureTextEntry={!showPw}
                autoCapitalize="none"
                editable={!confirming}
              />
              <Pressable
                onPress={() => setShowPw((s) => !s)}
                style={styles.eyeBtn}
                disabled={confirming}
              >
                <Ionicons name={showPw ? "eye-off" : "eye"} size={20} color="#8B97AD" />
              </Pressable>
            </View>

            {!!confirmError && <Text style={styles.fieldError}>{confirmError}</Text>}

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => setConfirmVisible(false)}
                disabled={confirming}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalBtn,
                  styles.modalBtnPrimary,
                  confirming ? { opacity: 0.75 } : null,
                ]}
                onPress={onConfirmPassword}
                disabled={confirming}
              >
                {confirming ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <Text style={styles.modalBtnPrimaryText}>Checking...</Text>
                  </View>
                ) : (
                  <Text style={styles.modalBtnPrimaryText}>Continue</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={logoutVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalSub}>
              Are you sure you want to log out of your AquaVolt account?
            </Text>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, styles.modalBtnSecondary]}
                onPress={() => setLogoutVisible(false)}
                disabled={loggingOut}
              >
                <Text style={styles.modalBtnSecondaryText}>Cancel</Text>
              </Pressable>

              <Pressable
                style={[
                  styles.modalBtn,
                  styles.modalBtnDanger,
                  loggingOut ? { opacity: 0.75 } : null,
                ]}
                onPress={doLogout}
                disabled={loggingOut}
              >
                <Text style={styles.modalBtnDangerText}>
                  {loggingOut ? "Logging out..." : "Logout"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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

  content: { paddingBottom: 10 },

  avatarWrap: { alignItems: "center", marginTop: 16, marginBottom: 12 },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 90,
    backgroundColor: "#1D3E9A",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
  },
  userName: { marginTop: 10, fontSize: 18, fontWeight: "900", color: "#0B1220" },

  card: {
    width: "86%",
    maxWidth: 380,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8E0EF",
    padding: 12,
  },

  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: "900", color: "#0B1220" },

  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EEF5FF",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
  },
  editBtnText: { fontSize: 12, fontWeight: "900", color: "#0B1220" },

  rowBtn: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8E0EF",
    paddingHorizontal: 12,
    marginTop: 10,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLabel: { fontSize: 11, fontWeight: "900", color: "#5D6B86" },
  rowValue: { marginTop: 2, fontSize: 13, fontWeight: "900", color: "#0B1220", maxWidth: 250 },

  deviceCard: {
    width: "86%",
    maxWidth: 380,
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#D8E0EF",
    padding: 12,
    marginTop: 12,
  },
  deviceCardTitle: { fontSize: 14, fontWeight: "900", color: "#0B1220", marginBottom: 10 },
  mutedText: { fontSize: 12, fontWeight: "700", color: "#7C8AA6" },

  devicePill: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#D8E0EF",
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  deviceLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  deviceId: { fontSize: 13, fontWeight: "900", color: "#0B1220", maxWidth: 260 },
  statusDot: { width: 10, height: 10, borderRadius: 10 },

  logoutBtn: {
    marginTop: 16,
    alignSelf: "center",
    width: "86%",
    maxWidth: 380,
    backgroundColor: "#C91515",
    borderRadius: 12,
    height: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  logoutText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 18,
    alignItems: "center", 
  },
  modalCard: {
    width: "88%", 
    maxWidth: 360,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#D8E0EF",
  },

  modalTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  modalCloseBtn: { position: "absolute", right: 0, top: 0, padding: 6 },

  modalTitle: { fontSize: 16, fontWeight: "900", color: "#0B1220", textAlign: "center" },
  modalSub: { marginTop: 8, fontSize: 12, fontWeight: "700", color: "#6B7A99", textAlign: "center", lineHeight: 16 },

  modalLabel: { fontSize: 11, fontWeight: "900", color: "#5D6B86", marginBottom: 6 },

  passwordWrap: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D8E0EF",
    paddingHorizontal: 12,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
  },
  passwordInput: { flex: 1, fontSize: 13, fontWeight: "800", color: "#0B1220" },
  eyeBtn: { paddingLeft: 10, paddingVertical: 6 },

  fieldError: {
    width: "100%",
    color: "#D23B3B",
    fontSize: 11,
    marginTop: 6,
    paddingLeft: 4,
    fontWeight: "700",
  },

  modalActions: { flexDirection: "row", gap: 10, marginTop: 14 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },

  modalBtnSecondary: { backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#D8E0EF" },
  modalBtnSecondaryText: { color: "#6B7A99", fontWeight: "900", fontSize: 12 },

  modalBtnPrimary: { backgroundColor: "#2F5FE8" },
  modalBtnPrimaryText: { color: "#FFFFFF", fontWeight: "900", fontSize: 12 },

  modalBtnDanger: { backgroundColor: "#C91515" },
  modalBtnDangerText: { color: "#FFFFFF", fontWeight: "900", fontSize: 12 },
});
