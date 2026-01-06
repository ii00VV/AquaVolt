import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../services/firebase";
import { logout } from "../services/auth";
import { ref, get, update, serverTimestamp } from "firebase/database";
import { reload, sendEmailVerification, verifyBeforeUpdateEmail } from "firebase/auth";

async function fetchUserNode(uid) {
  if (!uid) return null;
  try {
    const snap = await get(ref(db, `users/${uid}`));
    return snap.exists() ? snap.val() : null;
  } catch {
    return null;
  }
}

async function reloadWithRetry(user) {
  try {
    await reload(user);
    return true;
  } catch (e) {
    try {
      await new Promise((r) => setTimeout(r, 700));
      await reload(user);
      return true;
    } catch {
      throw e;
    }
  }
}

export default function VerifyEmailScreen({ navigation, route }) {
  const mode = route?.params?.mode || "signup";

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const setMessage = (t) => setMsg(String(t || ""));

  const title = mode === "reactivation" ? "Reactivate Your Account" : "Verify Your Email";

  const onOk = async () => {
    setMessage("");
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        setMessage("No active user. Please log in again.");
        navigation.replace("Login");
        return;
      }

      try {
        await user.getIdToken(true);
      } catch {}
      await reloadWithRetry(user);

      const uid = user.uid;
      const authEmailLower = (user.email || "").trim().toLowerCase();

      const node = await fetchUserNode(uid);

      const pendingEmailLower = String(node?.pendingEmailLower || "")
        .trim()
        .toLowerCase();

      const isEmailChangeFlow = !!pendingEmailLower;
      const isReactivation = mode === "reactivation";

      if (isEmailChangeFlow) {
        if (!authEmailLower) {
          setMessage("Could not read your current email. Please try again.");
          return;
        }

        if (authEmailLower !== pendingEmailLower) {
          setMessage(`Still waiting. Please open the link sent to: ${pendingEmailLower}`);
          return;
        }

        try {
          await update(ref(db, `users/${uid}`), {
            email: authEmailLower,
            emailLower: authEmailLower,
            emailVerified: true,
            verifiedAt: serverTimestamp(),
            pendingEmail: null,
            pendingEmailLower: null,
            emailChangedAt: serverTimestamp(),
          });
        } catch (dbErr) {
          setMessage(dbErr?.message || "Could not update database. Try again.");
          return;
        }

        await logout();
        navigation.replace("Login");
        return;
      }

      if (isReactivation) {
        if (!user.emailVerified) {
          setMessage("Not verified yet. Open the reactivation email link, then tap OK again.");
          return;
        }

        try {
          await update(ref(db, `users/${uid}`), {
            email: authEmailLower || node?.email || null,
            emailLower: authEmailLower || node?.emailLower || null,
            emailVerified: true,
            verifiedAt: serverTimestamp(),
            disabled: false,
            reactivationPending: false,
            reactivatedAt: serverTimestamp(),
          });
        } catch (dbErr) {
          setMessage(dbErr?.message || "Could not reactivate account in database. Try again.");
          return;
        }

        await logout();
        navigation.replace("Login");
        return;
      }

      if (user.emailVerified) {
        await update(ref(db, `users/${uid}`), {
          email: authEmailLower || node?.email || null,
          emailLower: authEmailLower || node?.emailLower || null,
          emailVerified: true,
          verifiedAt: serverTimestamp(),
        });

        await logout();
        navigation.replace("Login");
        return;
      }

      setMessage("Not verified yet. Check inbox/spam then tap OK again.");
    } catch (e) {
      const code = e?.code || "";
      const friendly =
        code === "auth/user-token-expired"
          ? "Session expired. Please log in again."
          : code === "auth/network-request-failed"
          ? "Network error. Check connection and try again."
          : e?.message || "Could not verify status. Please try again.";

      setMessage(friendly);

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
    setMessage("");
    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) {
        setMessage("No active user. Please log in again.");
        navigation.replace("Login");
        return;
      }

      try {
        await user.getIdToken(true);
      } catch {}
      await reloadWithRetry(user);

      const uid = user.uid;
      const node = await fetchUserNode(uid);

      const pendingEmail = node?.pendingEmail || null;

      if (pendingEmail) {
        await verifyBeforeUpdateEmail(user, pendingEmail);
        setMessage(`Verification email resent to: ${pendingEmail}. Check inbox/spam.`);
        return;
      }

      if ((route?.params?.mode || "signup") === "reactivation") {
        await sendEmailVerification(user);

        await update(ref(db, `users/${uid}`), {
          reactivationPending: true,
          reactivationEmailSentAt: serverTimestamp(),
        });

        setMessage("Reactivation email resent. Please check your inbox/spam.");
        return;
      }

      if (user.emailVerified) {
        setMessage("Your email is already verified. Tap OK.");
        return;
      }

      await sendEmailVerification(user);
      setMessage("Verification email resent. Please check your inbox/spam.");
    } catch (e) {
      const code = e?.code || "";
      const friendly =
        code === "auth/requires-recent-login"
          ? "For security, please re-login then try again."
          : code === "auth/network-request-failed"
          ? "Network error. Check connection and try again."
          : e?.message || "Could not resend. Try again.";

      setMessage(friendly);

      if (code === "auth/requires-recent-login") {
        try {
          await logout();
        } catch {}
        navigation.replace("Login");
      }
    } finally {
      setLoading(false);
    }
  };

  const isInfo =
    String(msg).toLowerCase().includes("resent") || String(msg).toLowerCase().includes("already");

  return (
    <LinearGradient colors={["#0B3A8D", "#0B1220"]} style={styles.bg}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <Ionicons name="mail-outline" size={44} color="#fff" />
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>
          We’ve sent a verification link to your email. Please open it, then tap OK.
        </Text>

        {!!msg && (
          <Text style={[styles.msg, { color: isInfo ? "#2F5FE8" : "#D23B3B" }]}>
            {String(msg)}
          </Text>
        )}

        <Pressable style={styles.okBtn} onPress={onOk} disabled={loading}>
          <Text style={styles.okText}>{loading ? "Checking..." : "Ok"}</Text>
        </Pressable>

        <Pressable onPress={onResend} disabled={loading}>
          <Text style={styles.resend}>
            {mode === "reactivation" ? "Resend reactivation email" : "Resend verification email"}
          </Text>
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
  title: { fontSize: 18, fontWeight: "800", color: "#0B1220", textAlign: "center" },
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
