import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  updateProfile,
  reload,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithCredential,
  getAdditionalUserInfo,
} from "firebase/auth";
import { ref, set, update, get } from "firebase/database";
import { auth, db } from "./firebase";

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

  await set(ref(db, `users/${cred.user.uid}`), {
    uid: cred.user.uid,
    fullName: fullName || "",
    email: emailLower,
    emailLower,
    emailVerified: false,
    createdAt: Date.now(),
    provider: "password",
  });

  await set(ref(db, `emailIndex/${safeKey}`), cred.user.uid);

  return cred.user;
}

export async function loginWithEmail({ email, password }) {
  const a = requireAuth();

  const cred = await signInWithEmailAndPassword(
    a,
    email.trim().toLowerCase(),
    password
  );
  await reload(cred.user);

  if (!cred.user.emailVerified) {
    await signOut(a);
    const err = new Error("EMAIL_NOT_VERIFIED");
    err.code = "EMAIL_NOT_VERIFIED";
    throw err;
  }

  await update(ref(db, `users/${cred.user.uid}`), {
    lastLoginAt: Date.now(),
  });

  return cred.user;
}

export async function loginWithGoogleTokens({ idToken, accessToken }) {
  const a = requireAuth();

  if (!idToken) {
    const err = new Error("MISSING_ID_TOKEN");
    err.code = "MISSING_ID_TOKEN";
    throw err;
  }

  const credential = GoogleAuthProvider.credential(idToken, accessToken || null);

  try {
    const cred = await signInWithCredential(a, credential);
    const user = cred.user;

    const info = getAdditionalUserInfo(cred);
    const isNew = !!info?.isNewUser;

    const emailLower = (user.email || "").trim().toLowerCase();
    const safeKey = emailLower ? emailToKey(emailLower) : null;

    const userRef = ref(db, `users/${user.uid}`);
    const snap = await get(userRef);

    const fullName = user.displayName || "";
    const photoURL = user.photoURL || "";

    if (!snap.exists() || isNew) {
      await set(userRef, {
        uid: user.uid,
        fullName,
        email: emailLower,
        emailLower,
        emailVerified: true,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
        provider: "google",
        photoURL,
      });
    } else {
      await update(userRef, {
        fullName,
        email: emailLower,
        emailLower,
        emailVerified: true,
        provider: "google",
        photoURL,
        lastLoginAt: Date.now(),
      });
    }

    if (safeKey) {
      await set(ref(db, `emailIndex/${safeKey}`), user.uid);
    }

    return user;
  } catch (e) {
    if (e?.code === "auth/account-exists-with-different-credential") {
      const err = new Error(
        "This email is already registered using Email/Password. Please log in with password first."
      );
      err.code = e.code;
      throw err;
    }
    throw e;
  }
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
