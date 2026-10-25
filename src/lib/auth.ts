import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { AuthSession, Role } from "@/lib/types";

const SESSION_COOKIE = "clinic_demo_session";
const localSessionSecret = "clinic-local-development-session-secret-only";
const sessionLifetime = 60 * 60 * 12;

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  if ((process.env.VERCEL || process.env.NODE_ENV === "production") && (!secret || secret.length < 32)) {
    throw new Error("Set SESSION_SECRET to at least 32 random characters in Vercel.");
  }
  return secret || localSessionSecret;
}

export function decodeSession(value: string): AuthSession | null {
  try {
    const [payload, signature, extra] = value.split(".");
    if (!payload || !signature || extra) return null;
    const expected = createHmac("sha256", getSessionSecret()).update(payload).digest();
    const received = Buffer.from(signature, "base64url");
    if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;
    const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (!["admin", "doctor", "reception"].includes(session.role) || typeof session.username !== "string" || !Number.isFinite(session.expiresAt) || session.expiresAt <= Date.now()) return null;
    return { username: session.username, role: session.role };
  } catch {
    return null;
  }
}

export function getRoleHome(role: Role) {
  if (role === "admin") {
    return "/admin/overview";
  }

  if (role === "reception") {
    return "/reception/overview";
  }

  return "/doctor/overview";
}

export async function getSession() {
  const cookieStore = await cookies();
  const value = cookieStore.get(SESSION_COOKIE)?.value;

  if (!value) {
    return null;
  }

  return decodeSession(value);
}

export function encodeSession(session: AuthSession) {
  const payload = Buffer.from(JSON.stringify({ ...session, expiresAt: Date.now() + sessionLifetime * 1000 }), "utf8").toString("base64url");
  return `${payload}.${createHmac("sha256", getSessionSecret()).update(payload).digest("base64url")}`;
}

export async function requireSession(allowedRoles?: Role[]) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    redirect(getRoleHome(session.role));
  }

  return session;
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}
