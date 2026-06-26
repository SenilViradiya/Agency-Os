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
          console.log('Authorize started for:', credentials?.email);
          await dbConnect();

          const user = await User.findOne({ email: credentials?.email } as any).populate({
            path: 'role',
            model: Role
          });
          
          if (!user) {
            console.log('User not found:', credentials?.email);
            throw new Error('Invalid email or password');
          }

          if (!user.password) {
            console.log('User has no password set');
            throw new Error('Invalid email or password');
          }

          console.log('User found, comparing password...');
          const isValid = await bcrypt.compare(credentials?.password as string, user.password);
          
          if (!isValid) {
            console.log('Invalid password for:', credentials?.email);
            throw new Error('Invalid email or password');
          }

          if (user.status !== 'active') {
            console.log('User status not active:', user.status);
            throw new Error('Your account is not active');
          }

          console.log('Login successful for:', user.email);
          
          const roleData = user.role as any;
          return {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.avatar,
            organizationId: user.organizationId,
            role: roleData?.name || 'User',
            permissions: roleData?.permissions || [],
          };
        } catch (error: any) {
          console.error('Authorize error:', error.message);
          throw error;
        }
      },
    }),
  ],
});

// Helper for RBAC
export function hasPermission(user: any, module: string, action: string): boolean {
  if (!user || !user.permissions) return false;
  if (user.role === 'Super Admin') return true;

  const modulePerm = user.permissions.find((p: any) => p.module === module);
  return modulePerm ? modulePerm.actions.includes(action) : false;
}
