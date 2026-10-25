import { NextResponse } from "next/server";

import { encodeSession, getRoleHome, getSessionCookieName } from "@/lib/auth";
import { authenticateDemoUser } from "@/lib/clinic-server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    username?: string;
    password?: string;
  };

  const user = await authenticateDemoUser(body.username ?? "", body.password ?? "");

  if (!user) {
    return NextResponse.json({ error: "Invalid username or password." }, { status: 401 });
  }

  const response = NextResponse.json({
    redirectTo: getRoleHome(user.role),
  });

  response.cookies.set(getSessionCookieName(), encodeSession({
    username: user.username,
    role: user.role,
  }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 12,
    path: "/",
  });

  return response;
}
