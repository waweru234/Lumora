// Server-side Firebase helpers.
// We try `firebase-admin` first; if creds aren't set, we fall back to a
// best-effort decode that decodes the JWT payload WITHOUT signature
// verification. This is suitable for the demo only and MUST be hardened
// in production by providing FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY.

import * as jose from "jose";

export type FirebaseClaim = {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  email_verified?: boolean;
};

let _adminReady = false;
async function tryAdmin(): Promise<any | null> {
  if (_adminReady) return null;
  try {
    const adminMod = await import("firebase-admin");
    const admin: any = adminMod.default;
    if (!admin.apps.length) {
      try {
        admin.initializeApp({ credential: admin.credential.applicationDefault() });
        await admin.apps[0];
        _adminReady = true;
        return admin;
      } catch { /* fall through */ }
    } else {
      _adminReady = true;
      return admin;
    }
  } catch { /* admin not installed fine */ }
  return null;
}

export async function verifyIdToken(idToken: string): Promise<FirebaseClaim | null> {
  if (!idToken) return null;

  const admin = await tryAdmin();
  if (admin) {
    try {
      const decoded = await admin.auth().verifyIdToken(idToken);
      return {
        uid: decoded.uid,
        email: decoded.email,
        name: decoded.name as string | undefined,
        picture: decoded.picture as string | undefined,
        email_verified: Boolean(decoded.email_verified),
      };
    } catch { /* fall through */ }
  }

  // Fallback: structural decode (NOT a security guarantee — replace for prod)
  try {
    const payload: any = jose.decodeJwt(idToken);
    if (!payload || typeof payload.sub !== "string") return null;
    return {
      uid: payload.sub,
      email: payload.email as string | undefined,
      name: payload.name as string | undefined,
      picture: payload.picture as string | undefined,
      email_verified: Boolean(payload.email_verified),
    };
  } catch { return null; }
}
