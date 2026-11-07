import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { authSecret, googleConfigured, isDevLoginEnabled } from "./lib/auth-mode";
import { consumeInvite, ensureFirstAdmin, getUserByGoogleSub } from "./lib/queries";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,
  secret: authSecret(),
  session: { strategy: "jwt" },
  pages: { signIn: "/login", error: "/login" },
  providers: [
    ...(googleConfigured()
      ? [
          Google({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
      const googleSub =
        account?.provider === "google"
          ? account.providerAccountId
          : user.id;
      if (!googleSub) return false;
      const email = (user.email ?? "").trim().toLowerCase();
      const name = (user.name ?? email.split("@")[0] ?? "משתמש").trim();
      const existing = await getUserByGoogleSub(googleSub);
      if (existing) return true;
      const admin = await ensureFirstAdmin({ googleSub, email, name });
      if (admin) return true;
      const inviteToken = String(credentials?.invite ?? "").trim();
      if (inviteToken) {
        const joined = await consumeInvite(inviteToken, { googleSub, email, name });
        if (!joined.ok) return "/login?error=invite";
      }
      // Existing family: unknown Google accounts stay pending until they open a valid invite.
      return true;
    },
    async jwt({ token, user, account, trigger, session }) {
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
      let dbUser = await getUserByGoogleSub(googleSub);
      if (!dbUser) {
        dbUser = await ensureFirstAdmin({
          googleSub,
          email: String(token.email ?? ""),
          name: String(token.name ?? "משתמש"),
        });
      }
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
    },
    async session({ session, token }) {
      const memberId = token.userId ? String(token.userId) : "";
      const googleSub = String(token.googleSub ?? "");
      session.user = {
        ...session.user,
        id: memberId || googleSub,
        email: String(token.email ?? ""),
        name: String(token.name ?? ""),
        image: session.user?.image ?? null,
        emailVerified: session.user?.emailVerified ?? null,
        isAdmin: Boolean(token.isAdmin),
        watcherId: token.watcherId ? String(token.watcherId) : null,
        pending: Boolean(token.pending) || !memberId,
        googleSub,
      };
      return session;
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      image?: string | null;
      emailVerified?: Date | null;
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
