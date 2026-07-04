import NextAuth from 'next-auth';
import type { NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from './db';
import ClientPortalUser from '@/models/ClientPortalUser';

export const portalAuthConfig = {
  trustHost: true,
  basePath: '/api/portal/auth',
  providers: [
    CredentialsProvider({
      name: 'PortalCredentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('[PORTAL-AUTH] Authorize started for:', credentials?.email);
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          await dbConnect();
          const email = (credentials.email as string).toLowerCase().trim();
          
          const user = await ClientPortalUser.findOne({ email }).select('+password');
          if (!user || !user.password) {
            console.log('[PORTAL-AUTH] User not found.');
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password as string, user.password);
          if (!isValid) {
            console.log('[PORTAL-AUTH] Password mismatch.');
            return null;
          }

          if (user.status !== 'active') {
            console.log('[PORTAL-AUTH] User status inactive.');
            return null;
          }

          // Update lastLogin & loginCount
          user.lastLogin = new Date();
          user.loginCount = (user.loginCount || 0) + 1;
          await user.save();

          console.log('[PORTAL-AUTH] Authentication successful.', user._id);
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            portalUserId: user._id.toString(),
            clientId: user.clientId.toString(),
            organizationId: user.organizationId,
            designation: user.designation || '',
            role: 'Client',
            permissions: [],
          };
        } catch (error) {
          console.error('[PORTAL-AUTH] Authorize error details:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.portalUserId = (user as any).portalUserId;
        token.clientId = (user as any).clientId;
        token.organizationId = (user as any).organizationId;
        token.designation = (user as any).designation;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).portalUserId = token.portalUserId as string;
        (session.user as any).clientId = token.clientId as string;
        (session.user as any).organizationId = token.organizationId as string;
        (session.user as any).designation = token.designation as string;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: `portal-session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false,
      },
    },
  },
  pages: {
    signIn: '/portal-login',
  },
} satisfies NextAuthConfig;

export const { handlers: portalHandlers, auth: portalAuth, signIn: portalSignIn, signOut: portalSignOut } = NextAuth(portalAuthConfig);

export async function verifyPortalSession() {
  const session = await portalAuth();
  if (!session?.user) {
    return { error: 'Unauthorized', status: 401 };
  }

  await dbConnect();
  const portalUserId = (session.user as any).portalUserId;
  const user = await ClientPortalUser.findById(portalUserId);
  if (!user || user.status !== 'active') {
    return { error: 'Your account is deactivated or inactive.', status: 403 };
  }

  return { session, user };
}

export const dynamic = 'force-dynamic';
