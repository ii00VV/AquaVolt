// src/services/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  reload,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";
import { ref, set, update } from "firebase/database";
import { auth, db } from "./firebase";

// RTDB keys cannot include: . # $ [ ] /
// We'll convert to a safe key.
export function emailToKey(emailLower) {
  return emailLower
    .trim()
    .toLowerCase()
    .replace(/\./g, ",")
    .replace(/#/g, "_")
    .replace(/\$/g, "_")
    .replace(/\[/g, "_")
    .replace(/\]/g, "_")
    .replace(/\//g, "_");
}

function requireAuth() {
  if (!auth) {
    const err = new Error("FIREBASE_AUTH_NOT_INITIALIZED");
    err.code = "FIREBASE_AUTH_NOT_INITIALIZED";
    throw err;
  }
  return auth;
}

export async function requestPasswordReset(email) {
  const a = requireAuth();
  // Firebase sends a reset LINK to the email
  await sendPasswordResetEmail(a, email.trim().toLowerCase());
}

export async function signUpWithEmail({ fullName, email, password }) {
  const a = requireAuth();

  const emailLower = email.trim().toLowerCase();
  const safeKey = emailToKey(emailLower);

  const cred = await createUserWithEmailAndPassword(a, emailLower, password);

  if (fullName) {
    await updateProfile(cred.user, { displayName: fullName });
  }

  await sendEmailVerification(cred.user);

  // Write user profile
  await set(ref(db, `users/${cred.user.uid}`), {
    uid: cred.user.uid,
    fullName: fullName || "",
    email: emailLower,
    emailLower,
    emailVerified: false,
    createdAt: Date.now(),
  });

  // Write email index (for "is email taken?" lookup)
  await set(ref(db, `emailIndex/${safeKey}`), cred.user.uid);

  return cred.user;
}

export async function loginWithEmail({ email, password }) {
  const a = requireAuth();

  const cred = await signInWithEmailAndPassword(a, email.trim().toLowerCase(), password);

  await reload(cred.user);

  if (!cred.user.emailVerified) {
    await signOut(a);
    const err = new Error("EMAIL_NOT_VERIFIED");
    err.code = "EMAIL_NOT_VERIFIED";
    throw err;
  }

  return cred.user;
}

export async function resendVerificationEmail() {
  const a = requireAuth();
  const user = a.currentUser;
  if (!user) {
    const err = new Error("NO_USER");
    err.code = "NO_USER";
    throw err;
  }
  await sendEmailVerification(user);
}

export async function refreshEmailVerifiedAndSync() {
  const a = requireAuth();
  const user = a.currentUser;
  if (!user) return false;

  await reload(user);

  if (user.emailVerified) {
    await update(ref(db, `users/${user.uid}`), {
      emailVerified: true,
      verifiedAt: Date.now(),
    });
  }
  return !!user.emailVerified;
}

export async function logout() {
  const a = requireAuth();
  await signOut(a);
}
