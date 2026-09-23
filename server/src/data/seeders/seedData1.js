import mongoose from 'mongoose';
import process from 'process';
import bcrypt from 'bcrypt';

import { UserModel } from '../../features/users/user.model.js';
import { SocialGroupModel } from '../../features/social-groups/social.model.js';
import { RuleModel } from '../../features/rules/rule.model.js';
import { WlsSessionModel } from '../../features/wls-session/wlsSession.model.js';
import { NotificationModel } from '../../features/notifications/notification.model.js';
import { AssessmentModel } from '../../features/wls-assessments/wlsAssessment.model.js';
import { WlsReportingModel } from '../../features/wls-reporting/wlsReporting.model.js';
import { MenuPermissionModel } from '../../features/menu-permissions/menuPermission.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wls-portal-db';

const seedMasterData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected.');

    console.log('🌱 Wiping database collections completely...');
    await mongoose.connection.dropDatabase();
    console.log('✅ Database dropped cleanly.');

    // 1. SEED USERS
    const superUserNames = ['Syed Imam', 'Alam Muhammed', 'Fawad Gilani', 'Jahanzaib Najam'];
    const wlsAdminNames = ['Aazim Kamal', 'Nasir Khan', 'Salman Hunter', 'Mukaram Khan'];

    console.log('👤 Seeding Users with secure password hashing...');
    let userDocs = [];

    const privilegedList = [
      ...superUserNames.map(name => ({ name, role: 'SUPER_USER', groups: [1, 2] })),
      ...wlsAdminNames.map(name => ({ name, role: 'WLS_ADMIN', groups: [2, 3] }))
    ];

    for (const p of privilegedList) {
      const email = `${p.name.toLowerCase().replace(/\s+/g, '')}@iipccanada.com`;
      userDocs.push({
        name: p.name,
        email,
        password: 'DefaultPassword123!',
        role: p.role,
        groupNumbers: p.groups,
        isActive: true,
        country: 'Canada',
        city: 'Toronto',
        phones: [{ number: '+1 (416) 555-0199', type: 'Mobile', isPrimary: true }]
      });
    }

    const firstNames = ['Ali', 'Omar','Zulfi', 'Usman', 'Bilal', 'Zain', 'Hamza', 'Ibrahim', 'Yusuf', 'Hassan', 'Hussein', 'Maryam', 'Ayesha', 'Fatima', 'Zahra', 'Khadija', 'Amna', 'Sara', 'Noor', 'Mariam', 'Hajar'];
    const lastNames = ['Khan', 'Ahmed', 'Awan','Ali', 'Malik', 'Sheikh', 'Siddiqui', 'Chaudhry', 'Butt', 'Mirza', 'Qureshi'];

    for (let i = userDocs.length + 1; i <= 50; i++) {
      const fName = firstNames[i % firstNames.length];
      const lName = lastNames[i % lastNames.length];

      userDocs.push({
        name: `${fName} ${lName} ${i}`,
        email: `user${i}@example.com`,
        password: 'DefaultPassword123!',
        role: 'USER',
        groupNumbers: [(i % 3) + 1, ((i + 1) % 3) + 1],
        isActive: i % 10 !== 0,
        underRadar: i % 15 === 0,
        radarReason: i % 15 === 0 ? 'Requires attendance review' : '',
        country: 'Canada',
        city: i % 2 === 0 ? 'Mississauga' : 'Toronto',
        phones: [{ number: `+1 (647) 555-${1000 + i}`, type: 'Mobile', isPrimary: true }]
      });
    }

    const createdUsers = [];
    for (const userData of userDocs) {
      // REMOVE bcrypt.hash here because the model pre-save hook handles it!
      const user = new UserModel(userData); // Pass raw userData directly
      await user.save();
      createdUsers.push(user);
    }
    console.log(`✅ Successfully seeded and hashed ${createdUsers.length} users.`);

    // 2. SEED SOCIAL GROUPS & TEAMS
    console.log('💬 Seeding WhatsApp Groups & Microsoft Teams Channels...');
    await SocialGroupModel.create([
      { 
        name: 'WLS Group 1 - Core Leadership & Announcements', 
        type: 'WHATSAPP', 
        allowedRoles: ['SUPER_USER', 'WLS_ADMIN', 'USER'],
        members: createdUsers.slice(0, 10).map(u => ({ userId: u._id, role: 'MEMBER' }))
      },
      { 
        name: 'WLS Group 2 - Advanced Mentorship Circle', 
        type: 'WHATSAPP', 
        allowedRoles: ['SUPER_USER', 'WLS_ADMIN'],
        members: createdUsers.slice(0, 5).map(u => ({ userId: u._id, role: 'ADMIN' }))
      },
      { 
        name: 'WLS MS Teams - General Faculty & Student Portal', 
        type: 'MICROSOFT_TEAMS', 
        allowedRoles: ['SUPER_USER', 'WLS_ADMIN', 'USER'],
        members: createdUsers.slice(0, 20).map(u => ({ userId: u._id, role: 'MEMBER' }))
      },
      { 
        name: 'WLS MS Teams - Admin Committee Sync', 
        type: 'MICROSOFT_TEAMS', 
        allowedRoles: ['SUPER_USER', 'WLS_ADMIN'],
        members: createdUsers.filter(u => u.role === 'SUPER_USER' || u.role === 'WLS_ADMIN').map(u => ({ userId: u._id, role: 'OWNER' }))
      }
    ]);

    // 3. SEED RULES
    console.log('⚖️ Seeding Assessment Rules...');
    const rules = await RuleModel.create([
      { key: 'presentation', criterion: 'Presentation Quality & Fluency', maxScore: 10, isActive: true },
      { key: 'tajweed', criterion: 'Tajweed Pronunciation & Rules', maxScore: 10, isActive: true },
      { key: 'memorization', criterion: 'Memorization Accuracy / Hifz', maxScore: 10, isActive: true }
    ]);

    // 4. SEED WLS SESSIONS
    console.log('📅 Seeding WLS Sessions...');
    const pastSession = await WlsSessionModel.create({
      topicName: 'Tafseer & Recitation Module - Week 1 (Surah Al-Mulk)',
      sessionDateTimeToronto: new Date('2026-09-01T18:00:00-04:00'),
      videoDeadline: new Date('2026-08-31T23:59:59-04:00'),
      status: 'ACTIVE'
    });

    await WlsSessionModel.create({
      topicName: 'Tafseer & Recitation Module - Week 2 (Surah Al-Waqiah)',
      sessionDateTimeToronto: new Date('2026-10-15T18:00:00-04:00'),
      videoDeadline: new Date('2026-10-14T23:59:59-04:00'),
      status: 'ACTIVE'
    });

    // 5. SEED ASSESSMENTS & SUBMISSIONS
    console.log('📝 Seeding Submissions and Admin Marking/Assessments...');
    const regularUsers = createdUsers.filter(u => u.role === 'USER').slice(0, 15);
    const adminUser = createdUsers.find(u => u.role === 'WLS_ADMIN') || createdUsers[0];

    const assessmentDocs = regularUsers.map((user, idx) => ({
      sessionId: pastSession._id,
      userId: user._id,
      videoSubmissionUrl: `https://youtube.com/watch?v=mock_submission_${idx}`,
      submissionDate: new Date('2026-08-30T14:30:00-04:00'),
      scores: [
        { ruleId: rules[0]._id, score: 8 + (idx % 3), feedback: 'Good clear voice projection.' },
        { ruleId: rules[1]._id, score: 7 + (idx % 4), feedback: 'Proper application of Madd rules.' },
        { ruleId: rules[2]._id, score: 9 - (idx % 2), feedback: 'Excellent retention.' }
      ],
      totalScore: 24 + (idx % 3),
      maxPossibleScore: 30,
      gradedBy: adminUser.email,
      gradedAt: new Date('2026-09-02T10:00:00-04:00'),
      adminGeneralFeedback: 'Great effort overall. Keep practicing Makharij.'
    }));

    await AssessmentModel.insertMany(assessmentDocs);

    // 6. SEED REPORTING DATA
    console.log('📊 Seeding WLS Reporting Summaries...');
    const reportingDocs = regularUsers.map((user, idx) => ({
      sessionId: pastSession._id,
      userId: user._id,
      videoLink: `https://youtube.com/watch?v=mock_submission_${idx}`,
      status: 'SUBMITTED',
      finalScore: 24 + (idx % 3),
      evaluations: [
        {
          adminId: adminUser._id,
          score: 24 + (idx % 3),
          feedback: 'Good recitation.'
        }
      ]
    }));

    await WlsReportingModel.insertMany(reportingDocs);

    // 7. SEED UNIFIED MULTI-LEVEL MENU HIERARCHY
    console.log('🧭 Seeding Unified Multi-Level Menu & Permissions...');
    await MenuPermissionModel.deleteMany({});

    const dashboard = await MenuPermissionModel.create({
      menuKey: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      order: 1,
      allowedRoles: ['SUPER_USER', 'WLS_ADMIN', 'USER'],
      scopeRestriction: 'ALL'
    });

    const userMgmt = await MenuPermissionModel.create({
      menuKey: 'user_management',
      label: 'User Management',
      path: '/users',
      order: 2,
      allowedRoles: ['SUPER_USER', 'WLS_ADMIN'],
      scopeRestriction: 'ALL'
    });

    const groupMgmt = await MenuPermissionModel.create({
  menuKey: 'group_management',
  label: 'Group Management',
  path: '/groups', // or your groups route/tab
  order: 3,
  allowedRoles: ['SUPER_USER'],
  scopeRestriction: 'ALL'
});

// Add this sub-item right beneath Group Management
await MenuPermissionModel.create({
  menuKey: 'menu_permissions_matrix',
  label: 'Menu Items & Permissions',
  path: 'menu-permissions', // Matches your activeTab string
  parentId: groupMgmt._id,
  order: 1,
  allowedRoles: ['SUPER_USER'], // Strictly hidden from everyone else
  scopeRestriction: 'ALL'
});

    const wlsManagement = await MenuPermissionModel.create({
      menuKey: 'wls_management',
      label: 'WLS Management',
      path: '', 
      order: 4,
      allowedRoles: ['SUPER_USER', 'WLS_ADMIN', 'USER'],
      scopeRestriction: 'ALL'
    });

    await MenuPermissionModel.create([
      {
        menuKey: 'wls_active_sessions',
        label: 'Active Sessions & Resources',
        path: '/wls/sessions',
        parentId: wlsManagement._id,
        order: 1,
        allowedRoles: ['SUPER_USER', 'WLS_ADMIN', 'USER'],
        scopeRestriction: 'ALL'
      },
      {
        menuKey: 'wls_analytics_reports',
        label: 'Analytics & Reports',
        path: '/wls/reporting',
        parentId: wlsManagement._id,
        order: 2,
        allowedRoles: ['SUPER_USER', 'WLS_ADMIN', 'USER'],
        scopeRestriction: 'SELF_ONLY'
      },
      {
        menuKey: 'wls_session_builder',
        label: 'Session Builder',
        path: '/wls/builder',
        parentId: wlsManagement._id,
        order: 3,
        allowedRoles: ['SUPER_USER', 'WLS_ADMIN'],
        scopeRestriction: 'ALL'
      },
      {
        menuKey: 'wls_assessments_grading',
        label: 'Assessments & Grading',
        path: '/wls/assessments',
        parentId: wlsManagement._id,
        order: 4,
        allowedRoles: ['SUPER_USER', 'WLS_ADMIN'],
        scopeRestriction: 'ALL'
      }
    ]);
    console.log('✅ Multi-level menu hierarchy seeded successfully.');

    console.log('\n✅ Master Seeding Completed Successfully with Full End-to-End Test Data!');
    console.log('👉 Super User Login: syedimam@iipccanada.com / DefaultPassword123!');
    console.log('👉 WLS Admin Login: aazimkamal@iipccanada.com / DefaultPassword123!');
    console.log('👉 Student Login: user5@example.com / DefaultPassword123!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Master Seeding Failed:', error);
    process.exit(1);
  }
};

seedMasterData();