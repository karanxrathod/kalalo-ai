import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { DbService, UserRecord } from "./db.service.js";
import { isSupabaseConfigured } from "../lib/supabase/client.js";
import { getSupabaseAdminClient, getSupabaseServerClient } from "../lib/supabase/server.js";

const JWT_SECRET_STRING = process.env.JWT_SECRET || process.env.KALALO_SECRET_KEY || "kalalo-creator-studio-secure-session-key-2026-antigravity";
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);
export const SESSION_COOKIE_NAME = "kalalo_session";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
}

export interface RequestWithAuth {
  cookies: { get(name: string): { value?: string } | undefined };
  headers: { get(name: string): string | null };
}

export interface ResponseWithCookies {
  cookies: {
    set(options: {
      name: string;
      value: string;
      httpOnly?: boolean;
      secure?: boolean;
      sameSite?: "lax" | "strict" | "none";
      path?: string;
      maxAge?: number;
    }): void;
  };
}

export class AuthService {
  /**
   * Signs a JWT session token for an authenticated user.
   */
  public static async createToken(user: { id: string; email: string; name: string }): Promise<string> {
    return new SignJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);
  }

  /**
   * Verifies and decodes a session token.
   */
  public static async verifyToken(token: string): Promise<SessionPayload | null> {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      if (typeof payload.userId === "string" && typeof payload.email === "string") {
        return {
          userId: payload.userId,
          email: payload.email,
          name: (payload.name as string) || payload.email.split("@")[0],
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Authenticates user with email and password.
   * Uses Supabase Auth when configured, falling back to local DB.
   */
  public static async login(
    email: string,
    password: string
  ): Promise<{ user: { id: string; email: string; name: string; role?: string }; token: string }> {
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdminClient() || getSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (error) {
          throw new Error(error.message || "Invalid email or password.");
        }

        if (data.user) {
          const name = data.user.user_metadata?.name || cleanEmail.split("@")[0];
          const userObj = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            name,
            role: "creator",
          };

          // Ensure profile exists in profiles table
          await supabase.from("profiles").upsert(
            {
              id: data.user.id,
              email: data.user.email || cleanEmail,
              display_name: name,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );

          const token = await this.createToken(userObj);
          return { user: userObj, token };
        }
      }
    }

    // Fallback: local DbService
    const user = DbService.findUserByEmail(cleanEmail);
    if (!user) {
      throw new Error("Invalid email or password.");
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new Error("Invalid email or password.");
    }

    const token = await this.createToken(user);
    return { user, token };
  }

  /**
   * Registers a new user.
   * Uses Supabase Auth when configured, falling back to local DB.
   */
  public static async register(
    email: string,
    name: string,
    password: string
  ): Promise<{ user: { id: string; email: string; name: string; role?: string }; token: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim() || cleanEmail.split("@")[0];

    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("Please provide a valid email address.");
    }
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    if (isSupabaseConfigured()) {
      const supabase = getSupabaseAdminClient() || getSupabaseServerClient();
      if (supabase) {
        const { data, error } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { name: cleanName },
          },
        });

        if (error) {
          throw new Error(error.message || "Registration failed.");
        }

        if (data.user) {
          const userObj = {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            name: cleanName,
            role: "creator",
          };

          // Upsert initial profile
          await supabase.from("profiles").upsert(
            {
              id: data.user.id,
              email: data.user.email || cleanEmail,
              display_name: cleanName,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" }
          );

          const token = await this.createToken(userObj);
          return { user: userObj, token };
        }
      }
    }

    // Fallback: local DbService
    const user = DbService.createUser({ email: cleanEmail, name: cleanName, password });
    const token = await this.createToken(user);
    return { user, token };
  }

  /**
   * Extracts authenticated user payload from NextRequest cookies or Authorization header.
   */
  public static async getUserFromRequest(request: RequestWithAuth): Promise<SessionPayload | null> {
    // 1. Check HTTP-only cookie
    const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (cookieToken) {
      const verified = await this.verifyToken(cookieToken);
      if (verified) return verified;
    }

    // 2. Check Authorization Bearer header
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const bearerToken = authHeader.slice(7).trim();
      const verified = await this.verifyToken(bearerToken);
      if (verified) return verified;
    }

    // 3. Check Supabase server client session if configured
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseServerClient();
        if (supabase) {
          const { data } = await supabase.auth.getUser();
          if (data?.user) {
            return {
              userId: data.user.id,
              email: data.user.email || "",
              name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "Creator",
            };
          }
        }
      } catch {
        // Fall through
      }
    }

    return null;
  }

  /**
   * Attaches HTTP-only session cookie to a NextResponse.
   */
  public static attachSessionCookie(response: ResponseWithCookies, token: string): void {
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  /**
   * Clears session cookie on logout.
   */
  public static clearSessionCookie(response: ResponseWithCookies): void {
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: "",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }
}
