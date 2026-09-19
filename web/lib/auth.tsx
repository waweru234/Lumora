"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
         signInWithPopup, GoogleAuthProvider, signOut as fbSignOut, updateProfile,
         sendEmailVerification, type User as FirebaseUser } from "firebase/auth";
import { getFirebaseAuth, firebaseConfigured } from "@/lib/firebase";

export type AuthUser = {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  emailVerified: boolean;
};

type SignInResult = { ok: true; verified: boolean; mode: "google" | "password" }
                    | { ok: false; reason: string };

type Ctx = {
  user: AuthUser | null;
  loading: boolean;
  configured: boolean;
  signUpEmail: (email: string, password: string, name?: string) => Promise<string | null>;
  signInEmail: (email: string, password: string) => Promise<SignInResult>;
  signInGoogle: () => Promise<SignInResult>;
  signOut: () => Promise<void>;
  getIdToken: () => Promise<string | null>;
  sendVerification: () => Promise<boolean>;
  reloadVerification: () => Promise<boolean | null>;
  markVerified: () => Promise<void>;
};

const AuthContext = createContext<Ctx | null>(null);

function toAuthUser(u: FirebaseUser): AuthUser {
  return {
    uid: u.uid,
    email: u.email,
    name: u.displayName,
    picture: u.photoURL,
    emailVerified: u.emailVerified,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = firebaseConfigured();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!configured) { setLoading(false); return; }
    const auth = getFirebaseAuth();
    if (!auth) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, async fb => {
      setUser(fb ? toAuthUser(fb) : null);
      // Persist an ID token noncer locally so server APIs can mint Supabase rows on first sign-in
      if (fb) {
        try {
          const token = await fb.getIdToken(/* forceRefresh */ false);
          if (typeof window !== "undefined") window.localStorage.setItem("lumora-fb-token", token);
        } catch { /* swallow */ }
      } else {
        if (typeof window !== "undefined") window.localStorage.removeItem("lumora-fb-token");
      }
      setLoading(false);
    });
    return () => unsub();
  }, [configured]);

  async function refreshToken() {
    const auth = getFirebaseAuth();
    if (!auth?.currentUser) return null;
    try { return await auth.currentUser.getIdToken(true); } catch { return null; }
  }

  async function getIdToken() {
    if (typeof window !== "undefined") return window.localStorage.getItem("lumora-fb-token");
    return null;
  }

  async function signUpEmail(email: string, password: string, name?: string) {
    const auth = getFirebaseAuth();
    if (!auth) return "Firebase not configured";
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name && cred.user) await updateProfile(cred.user, { displayName: name });
      if (cred.user) {
        try { await sendEmailVerification(cred.user); } catch { /* ignore */ }
      }
      return null;
    } catch (e: any) {
      return e?.message?.replace("Firebase: ", "") ?? "Sign-up failed";
    }
  }
  async function signInEmail(email: string, password: string): Promise<SignInResult> {
    const auth = getFirebaseAuth();
    if (!auth) return { ok: false, reason: "Firebase not configured" };
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (cred.user && !cred.user.emailVerified) {
        try { await sendEmailVerification(cred.user); } catch { /* ignore */ }
        return { ok: true, verified: false, mode: "password" };
      }
      return { ok: true, verified: true, mode: "password" };
    } catch (e: any) {
      return { ok: false, reason: e?.message?.replace("Firebase: ", "") ?? "Sign-in failed" };
    }
  }
  async function signInGoogle(): Promise<SignInResult> {
    const auth = getFirebaseAuth();
    if (!auth) return { ok: false, reason: "Firebase not configured" };
    try {
      const cred = await signInWithPopup(auth, new GoogleAuthProvider());
      return { ok: true, verified: !!cred.user?.emailVerified, mode: "google" };
    } catch (e: any) {
      return { ok: false, reason: e?.message?.replace("Firebase: ", "") ?? "Google sign-in failed" };
    }
  }
  async function sendVerification(): Promise<boolean> {
    const auth = getFirebaseAuth();
    if (!auth?.currentUser) return false;
    try { await sendEmailVerification(auth.currentUser); return true; } catch { return false; }
  }
  async function reloadVerification(): Promise<boolean | null> {
    const auth = getFirebaseAuth();
    if (!auth?.currentUser) return null;
    try { await auth.currentUser.reload(); return auth.currentUser.emailVerified; } catch { return null; }
  }
  async function markVerified(): Promise<void> {
    const auth = getFirebaseAuth();
    if (!auth?.currentUser) return;
    try { await auth.currentUser.reload(); } catch {}
    // Best-effort: server route is what actually allows the user to log in.
    const token = typeof window !== "undefined" ? window.localStorage.getItem("lumora-fb-token") : null;
    if (!token) return;
    try {
      await fetch("/api/profile/verify-email", {
        method: "POST",
        headers: { authorization: `Bearer ${token}` },
      });
    } catch { /* ignore */ }
  }
  async function signOut() {
    const auth = getFirebaseAuth();
    if (auth?.currentUser) await fbSignOut(auth);
    if (typeof window !== "undefined") window.localStorage.removeItem("lumora-fb-token");
  }

  return (
    <AuthContext.Provider value={{ user, loading, configured, signUpEmail, signInEmail, signInGoogle, signOut, getIdToken, sendVerification, reloadVerification, markVerified }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
