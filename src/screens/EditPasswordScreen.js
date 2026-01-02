import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, TextInput, Alert, Image, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { updatePassword } from "firebase/auth";

import { auth } from "../services/firebase";

export default function EditPasswordScreen({ navigation }) {
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  // ✅ same as SignUpScreen
  const isStrongPassword = (v) => /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(v);

  const fieldErrors = useMemo(() => {
    const e = {};
    if (newPass.length > 0 && !isStrongPassword(newPass)) {
      e.newPass = "Password must be 8+ chars and include uppercase, lowercase, and a number.";
    }
    if (confirm.length > 0 && newPass !== confirm) {
      e.confirm = "Passwords do not match.";
    }
    return e;
  }, [newPass, confirm]);

  const canSave =
    !saving &&
    newPass.length > 0 &&
    confirm.length > 0 &&
    isStrongPassword(newPass) &&
    newPass === confirm;

  const onSave = async () => {
    const u = auth.currentUser;
    if (!u) return Alert.alert("Not logged in", "Please login again.");

    // ✅ same checks as SignUpScreen
    if (!isStrongPassword(newPass)) {
      return Alert.alert(
        "Weak password",
        "Password must be 8+ chars and include uppercase, lowercase, and a number."
      );
    }
    if (newPass !== confirm) return Alert.alert("Mismatch", "Passwords do not match.");

    try {
      setSaving(true);
      await updatePassword(u, newPass);
      Alert.alert("Saved", "Your password has been updated.");
      navigation.goBack();
    } catch (e) {
      if (e?.code === "auth/requires-recent-login") {
        Alert.alert(
          "Re-login required",
          "For security, please confirm your password again.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Continue",
              onPress: () =>
                navigation.navigate("ConfirmPassword", {
                  next: "EditPassword",
                  title: "Confirm Password",
                }),
            },
          ]
        );
      } else {
        Alert.alert("Update failed", e?.message || "Please try again.");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#0B3A8D", "#061A33"]} style={styles.header}>
        <SafeAreaView edges={["top"]}>
          <View style={styles.headerRow}>
            <View style={styles.brandRow}>
              <Image source={require("../../assets/logo.png")} style={styles.headerLogo} resizeMode="contain" />
              <Text style={styles.headerBrand}>AquaVolt</Text>
            </View>
            <View style={{ width: 42 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable style={styles.backRow} onPress={() => navigation.goBack()}>
          <Ionicons name="chevron-back" size={18} color="#0B1220" />
          <Text style={styles.backText}>Password</Text>
        </Pressable>

        <View style={styles.card}>
          <Text style={styles.label}>New Password</Text>
          <TextInput
            value={newPass}
            onChangeText={setNewPass}
            placeholder="Enter new password"
            style={styles.input}
            secureTextEntry
          />
          {!!fieldErrors.newPass && <Text style={styles.fieldError}>{fieldErrors.newPass}</Text>}

          <Text style={[styles.label, { marginTop: 10 }]}>Confirm Password</Text>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm new password"
            style={styles.input}
            secureTextEntry
          />
          {!!fieldErrors.confirm && <Text style={styles.fieldError}>{fieldErrors.confirm}</Text>}

          <Text style={styles.hint}>
            Password must be 8+ characters and include uppercase, lowercase, and a number.
          </Text>

          <Pressable
            style={[styles.saveBtn, (!canSave || saving) && { opacity: 0.6 }]}
            disabled={!canSave || saving}
            onPress={onSave}
          >
            <Text style={styles.saveText}>{saving ? "Saving..." : "Save Changes"}</Text>
          </Pressable>
        </View>

        <View style={{ height: 28 }} />
      </ScrollView>
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

  content: { paddingTop: 14, paddingBottom: 10 },

  backRow: {
    width: "86%",
    maxWidth: 380,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  backText: { fontSize: 14, fontWeight: "900", color: "#0B1220" },

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

  label: { fontSize: 11, fontWeight: "900", color: "#5D6B86", marginBottom: 6 },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D8E0EF",
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: "800",
    color: "#0B1220",
    backgroundColor: "#FFFFFF",
  },

  // ✅ same style name you used in SignUpScreen
  fieldError: {
    width: "100%",
    color: "#D23B3B",
    fontSize: 11,
    marginTop: 6,
    paddingLeft: 4,
  },

  hint: { marginTop: 8, fontSize: 11, fontWeight: "700", color: "#7C8AA6", lineHeight: 15 },

  saveBtn: {
    marginTop: 14,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#2F5FE8",
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#FFFFFF", fontSize: 13, fontWeight: "900" },
});
