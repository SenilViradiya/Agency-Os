import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  providers: [], // Empty here, filled in auth.ts for Edge compatibility
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.organizationId = user.organizationId;
        token.role = user.role;
        token.permissions = user.permissions;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id as string;
        (session.user as any).organizationId = token.organizationId;
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
} satisfies NextAuthConfig;
