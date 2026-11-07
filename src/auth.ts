import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { googleConfigured, isDevLoginEnabled, isPublishedHost } from "./lib/auth-mode";
import { runtimeEnv } from "./lib/env";
import { consumeInvite, ensureAllowlistedAdmin } from "./lib/queries";

const LIVE_ORIGIN = "https://shabetzti.apps.grok.bot";

function logAuth(scope: string, error: unknown) {
  const name = error instanceof Error ? error.name : "error";
  console.error(`[shabetzti:${scope}]`, name);
}

function authConfig(): NextAuthConfig {
  if (!runtimeEnv("AUTH_URL") && isPublishedHost()) {
    process.env.AUTH_URL = LIVE_ORIGIN;
  }
  const googleId = runtimeEnv("GOOGLE_CLIENT_ID");
  const googleSecret = runtimeEnv("GOOGLE_CLIENT_SECRET");
  return {
    trustHost: true,
    secret: runtimeEnv("AUTH_SECRET") || undefined,
    session: { strategy: "jwt" },
    pages: { signIn: "/login", error: "/login" },
    providers: [
      ...(googleId && googleSecret
        ? [
            Google({
              clientId: googleId,
              clientSecret: googleSecret,
              profile(profile) {
                return {
                  id: String(profile.sub),
                  name: String(profile.name || profile.email || "משתמש"),
                  email: String(profile.email ?? "").trim().toLowerCase(),
                  image: typeof profile.picture === "string" ? profile.picture : null,
                };
              },
            }),
          ]
        : []),
      ...(isDevLoginEnabled()
        ? [
            Credentials({
              id: "dev-google",
              name: "Google (local mock)",
              credentials: {
                name: { label: "Name", type: "text" },
                email: { label: "Email", type: "email" },
                invite: { label: "Invite", type: "text" },
              },
              async authorize(credentials) {
                if (!isDevLoginEnabled()) return null;
                const email = String(credentials?.email ?? "")
                  .trim()
                  .toLowerCase();
                const name = String(credentials?.name ?? "").trim();
                if (!email.includes("@")) return null;
                return {
                  id: `dev:${email}`,
                  name: name || email.split("@")[0],
                  email,
                };
              },
            }),
          ]
        : []),
    ],
    callbacks: {
      async signIn({ user, account, credentials }) {
        try {
          const googleSub =
            account?.provider === "google" ? account.providerAccountId : user.id;
          if (!googleSub) return false;
          const email = (user.email ?? "").trim().toLowerCase();
          const name = (user.name ?? email.split("@")[0] ?? "משתמש").trim();
          const member = await ensureAllowlistedAdmin({ googleSub, email, name });
          if (member) return true;
          const inviteToken = String(credentials?.invite ?? "").trim();
          if (inviteToken) {
            const joined = await consumeInvite(inviteToken, { googleSub, email, name });
            if (!joined.ok) return "/login?error=invite";
          }
          return true;
        } catch (error) {
          logAuth("signIn", error);
          return true;
        }
      },
      async jwt({ token, user, account, trigger, session }) {
        try {
          if (account) {
            token.googleSub =
              account.provider === "google" ? account.providerAccountId : user.id;
            token.email = user.email ?? token.email;
            token.name = user.name ?? token.name;
          }
          if (user && !token.googleSub) {
            token.googleSub = user.id;
            token.email = user.email ?? token.email;
            token.name = user.name ?? token.name;
          }
          if (trigger === "update" && session?.inviteToken && token.googleSub) {
            const joined = await consumeInvite(String(session.inviteToken), {
              googleSub: String(token.googleSub),
              email: String(token.email ?? ""),
              name: String(token.name ?? ""),
            });
            if (joined.ok) {
              token.userId = joined.user.id;
              token.isAdmin = joined.user.isAdmin;
              token.watcherId = joined.user.watcherId;
              token.pending = false;
              return token;
            }
          }
          const googleSub = token.googleSub ? String(token.googleSub) : "";
          if (!googleSub) return token;
          const dbUser = await ensureAllowlistedAdmin({
            googleSub,
            email: String(token.email ?? ""),
            name: String(token.name ?? "משתמש"),
          });
          if (dbUser) {
            token.userId = dbUser.id;
            token.isAdmin = dbUser.isAdmin;
            token.watcherId = dbUser.watcherId;
            token.pending = false;
          } else {
            token.userId = undefined;
            token.isAdmin = false;
            token.watcherId = null;
            token.pending = true;
          }
          return token;
        } catch (error) {
          logAuth("jwt", error);
          token.pending = true;
          return token;
        }
      },
      async session({ session, token }) {
        const memberId = token.userId ? String(token.userId) : "";
        const googleSub = String(token.googleSub ?? "");
        session.user.id = memberId || googleSub;
        session.user.email = String(token.email ?? session.user.email ?? "");
        session.user.name = String(token.name ?? session.user.name ?? "");
        session.user.isAdmin = Boolean(token.isAdmin);
        session.user.watcherId = token.watcherId ? String(token.watcherId) : null;
        session.user.pending = Boolean(token.pending) || !memberId;
        session.user.googleSub = googleSub;
        return session;
      },
    },
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth(() => authConfig());

export async function safeAuth() {
  try {
    return await auth();
  } catch (error) {
    logAuth("session", error);
    return null;
  }
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      isAdmin: boolean;
      watcherId: string | null;
      pending: boolean;
      googleSub: string;
    };
  }
}

declare module "next-auth" {
  interface User {
    id?: string;
  }
}
