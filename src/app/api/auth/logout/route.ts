import { NextResponse } from "next/server";
import { COOKIE_SESSION, sessionCookieSecure } from "@/lib/auth-constants";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(COOKIE_SESSION, "", {
    httpOnly: true,
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    secure: sessionCookieSecure(),
  });
  return response;
}
