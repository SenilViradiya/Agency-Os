import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import Role from '../models/Role';
import Client from '../models/Client';
import Project from '../models/Project';
import ContentItem from '../models/ContentItem';
import Notification from '../models/Notification';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const ORGANIZATION_ID = process.env.ORGANIZATION_ID || 'org_default_001';

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

const modules = [
  'leads', 'clients', 'projects', 'tasks', 'content', 'approvals', 'publishing', 'notifications',
  'users', 'roles', 'hr', 'finance', 'meetings', 'assets', 'vendors'
];

const defaultRoles = [
  {
    name: 'Super Admin', slug: 'super-admin', isSystem: true,
    permissions: modules.map(m => ({ module: m, actions: ['read', 'create', 'update', 'delete'] }))
  },
  {
    name: 'Manager', slug: 'manager', isSystem: true,
    permissions: modules.map(m => ({
      module: m,
      actions: m === 'users' || m === 'roles' ? ['read'] : ['read', 'create', 'update', 'delete']
    }))
  },
  {
    name: 'Editor', slug: 'editor', isSystem: true,
    permissions: modules.map(m => ({
      module: m,
      actions: ['read', 'update']
    }))
  },
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI!);
    console.log('Connected to MongoDB');

    // 1. Seed Roles
    const roleMap: any = {};
    for (const roleData of defaultRoles) {
      const r = await Role.findOneAndUpdate(
        { organizationId: ORGANIZATION_ID, slug: roleData.slug },
        { ...roleData, organizationId: ORGANIZATION_ID },
        { upsert: true, new: true }
      );
      roleMap[roleData.slug] = r._id;
    }
    console.log('Roles seeded');

    // 2. Seed Users
    const password = await bcrypt.hash('Admin@123', 12);
    
    const adminUser = await User.findOneAndUpdate(
      { organizationId: ORGANIZATION_ID, email: 'admin@agencyos.com' },
      {
        name: 'Super Admin',
        email: 'admin@agencyos.com',
        password,
        organizationId: ORGANIZATION_ID,
        role: roleMap['super-admin'],
        status: 'active',
      },
      { upsert: true, new: true }
    );

    const managerUser = await User.findOneAndUpdate(
      { organizationId: ORGANIZATION_ID, email: 'manager@agencyos.com' },
      {
        name: 'Alex Manager',
        email: 'manager@agencyos.com',
        password,
        organizationId: ORGANIZATION_ID,
        role: roleMap['manager'],
        status: 'active',
      },
      { upsert: true, new: true }
    );

    const editorUser = await User.findOneAndUpdate(
      { organizationId: ORGANIZATION_ID, email: 'editor@agencyos.com' },
      {
        name: 'Sam Editor',
        email: 'editor@agencyos.com',
        password,
        organizationId: ORGANIZATION_ID,
        role: roleMap['editor'],
        status: 'active',
      },
      { upsert: true, new: true }
    );

    console.log('Users seeded');

    // 3. Seed Client & Project
    const client = await Client.findOneAndUpdate(
      { organizationId: ORGANIZATION_ID, businessName: 'TechFlow Solutions' },
      {
        businessName: 'TechFlow Solutions',
        clientName: 'Sarah Jenkins',
        email: 'sarah@techflow.io',
        organizationId: ORGANIZATION_ID,
        status: 'active'
      },
      { upsert: true, new: true }
    );

    const project = await Project.findOneAndUpdate(
      { organizationId: ORGANIZATION_ID, name: 'Q3 Brand Awareness' },
      {
        name: 'Q3 Brand Awareness',
        clientId: client._id,
        organizationId: ORGANIZATION_ID,
        status: 'active',
        projectManagers: [managerUser._id]
      },
      { upsert: true, new: true }
    );

    console.log('Client & Project seeded');

    // 4. Seed Content Items in various approval states
    const common = {
      organizationId: ORGANIZATION_ID,
      clientId: client._id,
      projectId: project._id,
      assignedTo: editorUser._id,
      platforms: ['YouTube', 'Instagram'],
      currentStage: 'approval'
    };

    // ITEM 1: Pending Approval
    await ContentItem.findOneAndUpdate(
      { organizationId: ORGANIZATION_ID, contentNumber: 'CNT-001' },
      {
        ...common,
        title: 'Mastering React in 2024',
        contentNumber: 'CNT-001',
        contentType: 'video_short',
        status: 'in_production',
        approvalData: {
          status: 'pending_review',
          submittedBy: editorUser._id,
          submittedForReviewAt: new Date(Date.now() - 3600000), // 1 hour ago
          driveLink: 'https://drive.google.com/file/d/react-tutorial',
          submissionNotes: 'Final color grading done. Ready for review.',
        }
      },
      { upsert: true }
    );

    // ITEM 2: Revision Requested
    await ContentItem.findOneAndUpdate(
      { organizationId: ORGANIZATION_ID, contentNumber: 'CNT-002' },
      {
        ...common,
        title: 'AI Productivity Hacks',
        contentNumber: 'CNT-002',
        contentType: 'video_long',
        status: 'in_production',
        approvalData: {
          status: 'revision_requested',
          submittedBy: editorUser._id,
          submittedForReviewAt: new Date(Date.now() - 86400000), // 1 day ago
          driveLink: 'https://drive.google.com/file/d/ai-hacks-v1',
          totalRevisions: 1,
          currentRevisionNumber: 1,
          revisionHistory: [{
            revisionNumber: 1,
            requestedBy: managerUser._id,
            requestedAt: new Date(Date.now() - 43200000), // 12 hours ago
            revisionNotes: 'The background music is a bit too loud in the intro. Please lower it by 3dB.',
            status: 'pending'
          }]
        }
      },
      { upsert: true }
    );

    // ITEM 3: Ready to Publish
    await ContentItem.findOneAndUpdate(
      { organizationId: ORGANIZATION_ID, contentNumber: 'CNT-003' },
      {
        ...common,
        title: 'AgencyOS Launch Trailer',
        contentNumber: 'CNT-003',
        contentType: 'video_short',
        status: 'in_production',
        currentStage: 'publish',
        approvalData: {
          status: 'approved',
          approvedAt: new Date(Date.now() - 7200000), // 2 hours ago
          internalApprovedBy: managerUser._id,
          reviewedBy: managerUser._id,
          reviewedAt: new Date(Date.now() - 7200000),
          approvalNotes: 'Outstanding work! Approved for launch.'
        },
        publishData: {
            status: 'ready_to_publish',
            scheduledAt: new Date()
        }
      },
      { upsert: true }
    );

    // ITEM 4: Published
    await ContentItem.findOneAndUpdate(
      { organizationId: ORGANIZATION_ID, contentNumber: 'CNT-004' },
      {
        ...common,
        title: 'Client Testimonial: TechFlow',
        contentNumber: 'CNT-004',
        contentType: 'video_short',
        status: 'completed',
        currentStage: 'publish',
        approvalData: {
          status: 'approved',
          approvedAt: new Date(Date.now() - 172800000), // 2 days ago
          reviewedBy: managerUser._id,
          reviewedAt: new Date(Date.now() - 172800000),
        },
        publishData: {
            status: 'published',
            publishedAt: new Date(Date.now() - 86400000),
            publishedBy: managerUser._id,
            platform: 'YouTube',
            publishedUrl: 'https://youtube.com/watch?v=techflow-success'
        }
      },
      { upsert: true }
    );

    // 5. Seed Notifications
    await Notification.deleteMany({ organizationId: ORGANIZATION_ID });
    await Notification.create([
      {
        organizationId: ORGANIZATION_ID,
        recipientId: managerUser._id,
        type: 'approval_requested',
        title: 'New Approval Request',
        message: 'Sam Editor submitted "Mastering React in 2024" for review.',
        link: '/approvals',
        isRead: false
      },
      {
        organizationId: ORGANIZATION_ID,
        recipientId: editorUser._id,
        type: 'revision_requested',
        title: 'Revision Required',
        message: 'Alex Manager requested a revision on "AI Productivity Hacks".',
        link: '/approvals',
        isRead: false
      }
    ]);

    console.log('Sample Data seeded');
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
