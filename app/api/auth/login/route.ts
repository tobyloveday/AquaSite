import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  createSessionCookieValue,
  SESSION_COOKIE,
  verifyPassword,
  type SessionUser,
} from "@/lib/auth";

type UserRow = {
  id: string;
  org_id: string;
  name: string;
  email: string;
  password_hash: string;
  role: SessionUser["role"];
};

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  const db = await getDb();
  const row = await db
    .prepare("SELECT id, org_id, name, email, password_hash, role FROM users WHERE email = ?")
    .bind(email)
    .first<UserRow>();

  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
  }

  const sessionUser: SessionUser = {
    id: row.id,
    orgId: row.org_id,
    email: row.email,
    name: row.name,
    role: row.role,
  };
  const cookieValue = await createSessionCookieValue(sessionUser);

  const response = NextResponse.json({ user: sessionUser });
  response.cookies.set(SESSION_COOKIE.name, cookieValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_COOKIE.maxAgeSeconds,
  });
  return response;
}
