import { SignJWT, jwtVerify } from "jose";

export const ALLOWED_EMAIL = "kiran@admin.com";
export const ALLOWED_PASSWORD = "12345678";
export const COOKIE_NAME = "session";

function getSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export async function createSession(): Promise<string> {
  return await new SignJWT({ email: ALLOWED_EMAIL, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(getSecret());
}

export async function verifySession(
  token: string
): Promise<{ email: string; role: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as { email: string; role: string };
  } catch {
    return null;
  }
}
