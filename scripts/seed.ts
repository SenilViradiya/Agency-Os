import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';
import User from '../models/User';
import Role from '../models/Role';
import Client from '../models/Client';
import Project from '../models/Project';
import ContentItem from '../models/ContentItem';
import Task from '../models/Task';
import Lead from '../models/Lead';
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
  'users', 'roles', 'hr', 'finance', 'meetings', 'assets', 'vendors', 'analytics'
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

    // Clear collections to avoid index duplicates
    await User.deleteMany({ organizationId: ORGANIZATION_ID });
    await Role.deleteMany({ organizationId: ORGANIZATION_ID });
    await Client.deleteMany({ organizationId: ORGANIZATION_ID });
    await Project.deleteMany({ organizationId: ORGANIZATION_ID });
    await ContentItem.deleteMany({ organizationId: ORGANIZATION_ID });
    await Task.deleteMany({ organizationId: ORGANIZATION_ID });
    await Lead.deleteMany({ organizationId: ORGANIZATION_ID });
    await Notification.deleteMany({ organizationId: ORGANIZATION_ID });
    console.log('Collections cleared');

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

    // 3. Seed Clients
    const now = new Date();

    const client1 = await Client.findOneAndUpdate(
      { organizationId: ORGANIZATION_ID, businessName: 'TechFlow Solutions' },
      {
        businessName: 'TechFlow Solutions',
        contactPerson: 'Sarah Jenkins',
        email: 'sarah@techflow.io',
        phone: '+919876543210',
        organizationId: ORGANIZATION_ID,
        status: 'active',
        tier: 'premium',
        contractStartDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        contractEndDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // Expiring in 15 days
        monthlyRetainerValue: 75000,
        assignedManager: managerUser._id,
        clientNumber: 'CLT-0001',
        createdBy: adminUser._id,
      },
      { upsert: true, new: true }
    );

    const client2 = await Client.findOneAndUpdate(
      { organizationId: ORGANIZATION_ID, businessName: 'GreenGrow Organic' },
      {
        businessName: 'GreenGrow Organic',
        contactPerson: 'Robert Miller',
        email: 'robert@greengrow.com',
        phone: '+919876543211',
        organizationId: ORGANIZATION_ID,
        status: 'active',
        tier: 'standard',
        contractStartDate: new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000),
        contractEndDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000), // Expiring in 45 days
        monthlyRetainerValue: 45000,
        assignedManager: managerUser._id,
        clientNumber: 'CLT-0002',
        createdBy: adminUser._id,
      },
      { upsert: true, new: true }
    );

    const client3 = await Client.findOneAndUpdate(
      { organizationId: ORGANIZATION_ID, businessName: 'Apex Capital Ltd' },
      {
        businessName: 'Apex Capital Ltd',
        contactPerson: 'David Chen',
        email: 'david@apexcap.com',
        phone: '+919876543212',
        organizationId: ORGANIZATION_ID,
        status: 'active',
        tier: 'enterprise',
        contractStartDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        contractEndDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // Expired (-5 days)
        monthlyRetainerValue: 120000,
        assignedManager: managerUser._id,
        clientNumber: 'CLT-0003',
        createdBy: adminUser._id,
      },
      { upsert: true, new: true }
    );

    console.log('Clients seeded');

    // 4. Seed Projects
    const project1 = await Project.findOneAndUpdate(
      { organizationId: ORGANIZATION_ID, name: 'Brand Awareness Q3' },
      {
        name: 'Brand Awareness Q3',
        projectNumber: 'PRJ-0001',
        clientId: client1._id,
        organizationId: ORGANIZATION_ID,
        status: 'active',
        priority: 'high',
        type: 'retainer',
        startDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000),
        deadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        projectManager: managerUser._id,
        teamMembers: [editorUser._id],
        completionPercentage: 75,
        totalTasks: 20,
        completedTasks: 15,
        createdBy: adminUser._id,
      },
      { upsert: true, new: true }
    );

    const project2 = await Project.findOneAndUpdate(
      { organizationId: ORGANIZATION_ID, name: 'Lead Gen Campaign' },
      {
        name: 'Lead Gen Campaign',
        projectNumber: 'PRJ-0002',
        clientId: client2._id,
        organizationId: ORGANIZATION_ID,
        status: 'active',
        priority: 'medium',
        type: 'campaign',
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        deadline: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
        projectManager: managerUser._id,
        teamMembers: [editorUser._id],
        completionPercentage: 40,
        totalTasks: 10,
        completedTasks: 4,
        createdBy: adminUser._id,
      },
      { upsert: true, new: true }
    );

    console.log('Projects seeded');

    // Seed Leads
    const leads = [
      {
        leadNumber: 'LEAD-0001',
        name: 'John Doe',
        businessName: 'Doe Enterprise',
        email: 'john@doe.com',
        phone: '+919876543220',
        source: 'website',
        status: 'won',
        priority: 'high',
        budget: 50000,
        assignedTo: managerUser._id,
        createdBy: adminUser._id,
        organizationId: ORGANIZATION_ID,
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        leadNumber: 'LEAD-0002',
        name: 'Jane Smith',
        businessName: 'Smith Boutique',
        email: 'jane@smith.com',
        phone: '+919876543221',
        source: 'referral',
        status: 'new',
        priority: 'medium',
        budget: 35000,
        assignedTo: managerUser._id,
        createdBy: adminUser._id,
        organizationId: ORGANIZATION_ID,
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      }
    ];
    await Promise.all(leads.map(l => new Lead(l).save()));
    console.log('Leads seeded');

    // 5. Seed Content Items spread across weeks / status / platforms
    const contentItems = [
      {
        contentNumber: 'CNT-0001',
        title: 'Mastering React in 2024',
        contentType: 'youtube_video',
        platforms: ['YouTube'],
        currentStage: 'approval',
        status: 'in_approval',
        clientId: client1._id,
        projectId: project1._id,
        assignedTo: editorUser._id,
        organizationId: ORGANIZATION_ID,
        createdAt: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
        createdBy: managerUser._id,
        approvalData: {
          status: 'pending_review',
          totalRevisions: 0,
          currentRevisionNumber: 0,
          submittedForReviewAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
        },
        publishData: { status: 'not_ready' }
      },
      {
        contentNumber: 'CNT-0002',
        title: 'AI Productivity Hacks',
        contentType: 'reel',
        platforms: ['Instagram'],
        currentStage: 'edit',
        status: 'revision_requested',
        clientId: client1._id,
        projectId: project1._id,
        assignedTo: editorUser._id,
        organizationId: ORGANIZATION_ID,
        createdAt: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        createdBy: managerUser._id,
        approvalData: {
          status: 'revision_requested',
          totalRevisions: 2,
          currentRevisionNumber: 2,
          revisionHistory: [
            {
              revisionNumber: 1,
              requestedBy: managerUser._id,
              requestedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
              revisionNotes: 'Font size in captions is too small.',
            },
            {
              revisionNumber: 2,
              requestedBy: managerUser._id,
              requestedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
              revisionNotes: 'Intro transition animation feels jerky.',
            }
          ]
        },
        publishData: { status: 'not_ready' }
      },
      {
        contentNumber: 'CNT-0003',
        title: 'TechFlow Success Story',
        contentType: 'static_post',
        platforms: ['LinkedIn'],
        currentStage: 'completed',
        status: 'published',
        clientId: client1._id,
        projectId: project1._id,
        assignedTo: editorUser._id,
        organizationId: ORGANIZATION_ID,
        createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        createdBy: managerUser._id,
        approvalData: {
          status: 'approved',
          totalRevisions: 0,
          currentRevisionNumber: 0,
          approvedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
        },
        publishData: {
          status: 'published',
          publishedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
          platform: 'LinkedIn',
          publishedUrl: 'https://linkedin.com/posts/techflow-success',
        }
      },
      {
        contentNumber: 'CNT-0004',
        title: 'Soil Prep Guides 101',
        contentType: 'carousel',
        platforms: ['Instagram', 'LinkedIn'],
        currentStage: 'completed',
        status: 'published',
        clientId: client2._id,
        projectId: project2._id,
        assignedTo: editorUser._id,
        organizationId: ORGANIZATION_ID,
        createdAt: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000),
        createdBy: managerUser._id,
        approvalData: {
          status: 'approved',
          totalRevisions: 1,
          currentRevisionNumber: 1,
          approvedAt: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000),
        },
        publishData: {
          status: 'published',
          publishedAt: new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000),
          platform: 'Instagram',
          publishedUrl: 'https://instagram.com/p/soilprep',
        }
      },
    ];

    await Promise.all(contentItems.map(c => new ContentItem(c).save()));
    console.log('Content Items seeded');

    // 6. Seed Tasks with realistic dates, statuses, and performance values
    const tasks = [
      // Completed On-Time
      {
        taskNumber: 'TSK-0001',
        title: 'Design Q3 Presentation Outline',
        entityType: 'project',
        entityId: project1._id,
        type: 'review',
        status: 'done',
        priority: 'medium',
        assignedTo: [editorUser._id],
        createdBy: managerUser._id,
        startDate: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 23 * 24 * 60 * 60 * 1000), // On-time
        estimatedHours: 5,
        loggedHours: 4,
        organizationId: ORGANIZATION_ID,
      },
      // Completed Late
      {
        taskNumber: 'TSK-0002',
        title: 'Scripting TechFlow Video',
        entityType: 'content_item',
        type: 'script',
        status: 'done',
        priority: 'high',
        assignedTo: [editorUser._id],
        createdBy: managerUser._id,
        startDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // Late
        estimatedHours: 8,
        loggedHours: 10,
        organizationId: ORGANIZATION_ID,
      },
      // In-Progress
      {
        taskNumber: 'TSK-0003',
        title: 'Thumbnail for React Video',
        entityType: 'content_item',
        type: 'thumbnail',
        status: 'in_progress',
        priority: 'medium',
        assignedTo: [editorUser._id],
        createdBy: managerUser._id,
        startDate: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // Future due date
        estimatedHours: 4,
        loggedHours: 2,
        organizationId: ORGANIZATION_ID,
      },
      // Overdue Task
      {
        taskNumber: 'TSK-0004',
        title: 'Captions & Tags generation',
        entityType: 'content_item',
        type: 'caption',
        status: 'todo',
        priority: 'high',
        assignedTo: [editorUser._id],
        createdBy: managerUser._id,
        startDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // Past due date (overdue)
        estimatedHours: 3,
        loggedHours: 0,
        organizationId: ORGANIZATION_ID,
      },
      // Completed Task by Admin user (to show comparison)
      {
        taskNumber: 'TSK-0005',
        title: 'Client Intake Meeting',
        entityType: 'client',
        entityId: client1._id,
        type: 'meeting',
        status: 'done',
        priority: 'low',
        assignedTo: [adminUser._id],
        createdBy: managerUser._id,
        startDate: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        dueDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
        completedAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // On-time
        estimatedHours: 2,
        loggedHours: 2,
        organizationId: ORGANIZATION_ID,
      },
    ];

    await Promise.all(tasks.map(t => new Task(t).save()));
    console.log('Tasks seeded');

    // 7. Seed Notifications
    const notifications = [
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
    ];
    await Promise.all(notifications.map(n => new Notification(n).save()));
    console.log('Notifications seeded');

    console.log('Sample Data seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
}

seed();
