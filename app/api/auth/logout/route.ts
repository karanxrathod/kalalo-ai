import { NextResponse } from "next/server";
import { AuthService } from "@/src/services/auth.service";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out successfully" });
  AuthService.clearSessionCookie(response);
  return response;
}
