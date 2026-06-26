import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import Role from '../models/Role';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const ORGANIZATION_ID = process.env.ORGANIZATION_ID || 'org_default_001';

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

const modules = [
  'leads', 'clients', 'projects', 'tasks', 'scripts', 'shoots', 'editing',
  'thumbnails', 'captions', 'approvals', 'publishing', 'analytics',
  'users', 'roles', 'hr', 'finance', 'meetings', 'assets', 'vendors'
];

const defaultRoles = [
  {
    name: 'Super Admin',
    slug: 'super-admin',
    isSystem: true,
    permissions: modules.map(m => ({ module: m, actions: ['read', 'create', 'update', 'delete'] }))
  },
  {
    name: 'Manager',
    slug: 'manager',
    isSystem: true,
    permissions: modules.map(m => ({
      module: m,
      actions: m === 'users' || m === 'roles' ? ['read'] : ['read', 'create', 'update', 'delete']
    }))
  },
  {
    name: 'Editor',
    slug: 'editor',
    isSystem: true,
    permissions: modules.map(m => ({
      module: m,
      actions: ['scripts', 'editing', 'thumbnails', 'captions'].includes(m) ? ['read', 'update'] : ['read']
    }))
  },
  {
    name: 'Viewer',
    slug: 'viewer',
    isSystem: true,
    permissions: modules.map(m => ({ module: m, actions: ['read'] }))
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected to MongoDB');

    // 1. Seed Roles
    for (const roleData of defaultRoles) {
      await Role.findOneAndUpdate(
        { organizationId: ORGANIZATION_ID, slug: roleData.slug },
        { ...roleData, organizationId: ORGANIZATION_ID },
        { upsert: true, new: true }
      );
    }
    console.log('Roles seeded');

    // 2. Seed Super Admin User
    const superAdminRole = await Role.findOne({ organizationId: ORGANIZATION_ID, slug: 'super-admin' });
    if (!superAdminRole) throw new Error('Super Admin role not found after seeding');

    const adminEmail = 'admin@agencyos.com';
    const hashedPassword = await bcrypt.hash('Admin@123', 12);

    const adminUser = await User.findOneAndUpdate(
      { organizationId: ORGANIZATION_ID, email: adminEmail },
      {
        name: 'Super Admin',
        email: adminEmail,
        password: hashedPassword,
        organizationId: ORGANIZATION_ID,
        role: superAdminRole._id,
        department: 'Management',
        designation: 'Administrator',
        status: 'active',
      },
      { upsert: true, new: true }
    );

    console.log('Super Admin user seeded:', adminUser.email);
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
