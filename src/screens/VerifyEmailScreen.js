import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../services/firebase";
import { logout } from "../services/auth";

import { ref, get, update, serverTimestamp } from "firebase/database";
import { reload, sendEmailVerification, verifyBeforeUpdateEmail } from "firebase/auth";

async function fetchPendingEmail(uid) {
  if (!uid) return null;
  try {
    const snap = await get(ref(db, `users/${uid}`));
    if (!snap.exists()) return null;

    const node = snap.val() || {};
    return {
      pendingEmail: node.pendingEmail || null,
      pendingEmailLower: node.pendingEmailLower || null,
      dbEmail: node.email || null,
    };
  } catch {
    return null;
  }
}

// small helper to retry reload once (fixes your “first OK fails” issue)
async function reloadWithRetry(user) {
  try {
    await reload(user);
    return true;
  } catch (e) {
    // retry once (no UI waiting message needed, just do it)
    try {
      await new Promise((r) => setTimeout(r, 700));
      await reload(user);
      return true;
    } catch {
      throw e;
    }
  }
}

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

      // ✅ reload (with retry) so emailVerified/email are updated
      await reloadWithRetry(user);

      const uid = user.uid;
      const authEmail = (user.email || "").trim().toLowerCase();

      // ✅ pull pendingEmail from RTDB (used for syncing + resend)
      const pending = await fetchPendingEmail(uid);

      // If Firebase says verified, sync EVERYTHING properly
      if (user.emailVerified) {
        await update(ref(db, `users/${uid}`), {
          email: authEmail || pending?.pendingEmail || pending?.dbEmail || null,
          emailLower: authEmail || pending?.pendingEmailLower || null,
          emailVerified: true,
          verifiedAt: serverTimestamp(),

          // ✅ finalize email-change flow
          pendingEmail: null,
          pendingEmailLower: null,
        });

        // ✅ enforce your rule: must login again after verification
        await logout();
        navigation.replace("Login");
        return;
      }

      // Not verified yet
      setMsg("Not verified yet. Check inbox/spam then tap OK again.");
    } catch (e) {
      // show something more useful than generic
      const code = e?.code || "";
      const friendly =
        code === "auth/user-token-expired"
          ? "Session expired. Please log in again."
          : code === "auth/network-request-failed"
          ? "Network error. Check connection and try again."
          : "Could not check verification. Try again.";

      setMsg(friendly);

      if (code === "auth/user-token-expired") {
        try {
          await logout();
        } catch {}
        navigation.replace("Login");
      }
    } finally {
      setLoading(false);
    }
  };

  const onResend = async () => {
    setMsg("");
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        setMsg("No active user. Please log in again.");
        navigation.replace("Login");
        return;
      }

      // always reload before resend, so we don’t resend unnecessarily
      await reloadWithRetry(user);

      if (user.emailVerified) {
        setMsg("Your email is already verified. Tap OK.");
        return;
      }

      const uid = user.uid;
      const pending = await fetchPendingEmail(uid);

      // ✅ If they’re changing email, resend verification to pendingEmail
      if (pending?.pendingEmail) {
        await verifyBeforeUpdateEmail(user, pending.pendingEmail);
        setMsg("Verification email resent to your NEW email. Check inbox/spam.");
        return;
      }

      // ✅ normal signup verification resend
      await sendEmailVerification(user);
      setMsg("Verification email resent. Please check your inbox/spam.");
    } catch (e) {
      const code = e?.code || "";
      const friendly =
        code === "auth/requires-recent-login"
          ? "For security, please re-login then try again."
          : code === "auth/network-request-failed"
          ? "Network error. Check connection and try again."
          : "Could not resend. Try again.";

      setMsg(friendly);

      if (code === "auth/requires-recent-login") {
        // Optional: force them back to login, since they need reauth anyway
        // navigation.replace("Login");
      }
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

        {!!msg && <Text style={[styles.msg, { color: msg.includes("already") ? "#2F5FE8" : "#D23B3B" }]}>{msg}</Text>}

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
  msg: { fontSize: 12, textAlign: "center", marginBottom: 10 },
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
