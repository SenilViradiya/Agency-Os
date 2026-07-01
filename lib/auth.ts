import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from './db';
import User from '@/models/User';
import Role from '@/models/Role';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          console.log('[AUTH] Authorize started for:', credentials?.email);
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          await dbConnect();

          const creds = credentials as any;
          const email = creds.email.toLowerCase().trim();
          const user = await User.findOne({ email }).select('+password').populate({
            path: 'role',
            model: Role
          });
          
          if (!user || !user.password) {
            return null;
          }

          const isValid = await bcrypt.compare(creds.password as string, user.password);
          
          if (!isValid || user.status !== 'active') {
            return null;
          }

          const roleData = user.role as any;
          
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.avatar,
            organizationId: user.organizationId?.toString() || '',
            role: roleData?.name || 'User',
            permissions: roleData?.permissions ? JSON.parse(JSON.stringify(roleData.permissions)) : [],
          };
        } catch (error: any) {
          console.error('[AUTH] Authorize unexpected error:', error);
          return null;
        }
      },
    }),
  ],
});

export { hasPermission } from './rbac';
