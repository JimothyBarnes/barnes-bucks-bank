import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import { SessionRole, getUserById } from "@/lib/data";

const SESSION_COOKIE = "barnes-bucks-session";
const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "barnes-bucks-local-secret-change-me";

type SessionPayload = {
  userId: number;
  role: SessionRole;
};

function sign(value: string) {
  return createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}

function encode(payload: SessionPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = sign(body);
  return `${body}.${signature}`;
}

function decode(token: string): SessionPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) {
    return null;
  }

  const expected = sign(body);
  const provided = Buffer.from(signature);
  const actual = Buffer.from(expected);

  if (provided.length !== actual.length || !timingSafeEqual(provided, actual)) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, encode(payload), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const payload = decode(token);
  if (!payload) {
    return null;
  }

  const user = getUserById(payload.userId);
  if (!user || !user.active || user.role !== payload.role) {
    return null;
  }

  return {
    role: payload.role,
    userId: payload.userId,
    user,
  };
}
