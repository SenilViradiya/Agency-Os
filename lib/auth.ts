import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import dbConnect from './db';
import User from '@/models/User';
import Role from '@/models/Role';
import { authConfig } from './auth.config';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
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

          const email = credentials.email.toLowerCase().trim();
          const user = await User.findOne({ email }).select('+password').populate({
            path: 'role',
            model: Role
          });
          
          if (!user || !user.password) {
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password as string, user.password);
          
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

// Helper for RBAC
export function hasPermission(user: any, module: string, action: string): boolean {
  if (!user || !user.permissions) return false;
  if (user.role === 'Super Admin') return true;

  const userPermissions = user.permissions as any[];
  const modulePerm = userPermissions.find((p: any) => p.module === module);
  return modulePerm ? modulePerm.actions.includes(action) : false;
}
