import mongoose from 'mongoose';
import process from 'process';

// Feature Models (Named Exports)
import { UserModel } from '../../features/users/user.model.js';
import { SocialGroupModel } from '../../features/social-groups/social.model.js';
import { RuleModel } from '../../features/rules/rule.model.js';
import { WlsSessionModel } from '../../features/wls-session/wlsSession.model.js';
import { NotificationModel } from '../../features/notifications/notification.model.js';
import { AssessmentModel } from '../../features/wls-assessments/wlsAssessment.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wls-portal-db';

const seedMasterData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected.');

    // Extract valid enum value for SocialGroup `type` directly from the model schema
    const typeEnumValues = SocialGroupModel.schema.path('type')?.enumValues || [];
    const validGroupType = typeEnumValues[0] || 'WhatsApp';

    // 1. Clear Existing Data
    console.log('🌱 Clearing existing collections...');
    await UserModel.deleteMany({});
    await SocialGroupModel.deleteMany({});
    await RuleModel.deleteMany({});
    await WlsSessionModel.deleteMany({});
    await NotificationModel.deleteMany({});
    await AssessmentModel.deleteMany({});

    // 2. Seed Users & Profiles
    console.log('👤 Seeding Users & Profiles...');
    const users = await UserModel.create([
      {
        name: 'Syed Imam',
        email: 'syedimam@iipccanada.com',
        password: 'Password123!',
        role: 'SUPER_USER',
        isActive: true,
        country: 'Canada',
        state: 'Ontario',
        city: 'Toronto',
        profession: 'Solution Architect & Senior Full Stack Developer',
        education: 'Master of Computer Applications (MCA)',
        phones: [
          { type: 'Mobile', number: '+1 (416) 555-0199', isPrimary: true },
          { type: 'Work', number: '+1 (416) 555-0120', isPrimary: false }
        ],
        driveFolderPath: 'https://drive.google.com/drive/folders/1A2B3C4D5E6F7G8H9',
        causeContribution: 'Providing cloud architectural guidance, microservice mentoring, and IT infrastructure support.',
        socialMedia: [
          { platform: 'LinkedIn', handleUrl: 'https://linkedin.com/in/syedimam-architect' },
          { platform: 'GitHub', handleUrl: 'https://github.com/syedimam' },
          { platform: 'YouTube', handleUrl: 'https://youtube.com/@syedimam-tech' }
        ]
      },
      {
        name: 'Ahmed Hassan',
        email: 'ahmed.hassan@iipccanada.com',
        password: 'Password123!',
        role: 'WLS_ADMIN',
        isActive: true,
        country: 'Canada',
        state: 'Ontario',
        city: 'Mississauga',
        profession: 'Education Coordinator & Youth Mentor',
        education: 'Bachelor of Education (B.Ed)',
        phones: [{ type: 'Mobile', number: '+1 (905) 555-0144', isPrimary: true }],
        driveFolderPath: 'https://drive.google.com/drive/folders/2B3C4D5E6F7G8H9I0',
        causeContribution: 'Managing weekly WLS student session schedules, booklet distributions, and evaluation rubrics.',
        socialMedia: [
          { platform: 'LinkedIn', handleUrl: 'https://linkedin.com/in/ahmed-hassan-edu' },
          { platform: 'Facebook', handleUrl: 'https://facebook.com/ahmed.hassan.community' }
        ]
      },
      {
        name: 'Tariq Mahmood',
        email: 'tariq.m@example.com',
        password: 'Password123!',
        role: 'USER',
        isActive: true,
        country: 'Canada',
        state: 'Ontario',
        city: 'Oakville',
        profession: 'Data Analyst',
        education: 'B.Sc. Data Science',
        phones: [{ type: 'Mobile', number: '+1 (289) 555-0188', isPrimary: true }],
        causeContribution: 'Assisting with student attendance metrics, video submission analytics, and reporting.',
        socialMedia: [
          { platform: 'LinkedIn', handleUrl: 'https://linkedin.com/in/tariq-mahmood-data' },
          { platform: 'Twitter', handleUrl: 'https://x.com/tariq_data' }
        ]
      }
    ]);

    const superAdmin = users.find((u) => u.role === 'SUPER_USER');
    const wlsAdmin = users.find((u) => u.role === 'WLS_ADMIN');
    const regularUser = users.find((u) => u.role === 'USER');

    // 3. Seed Social Groups (Dynamic enum match)
    console.log('💬 Seeding Social Groups...');
    await SocialGroupModel.create([
      {
        name: 'WLS Toronto Central - Group A',
        type: validGroupType,
        description: 'Official group for WLS Toronto community announcements.',
        link: 'https://chat.whatsapp.com/G1H2I3J4K5L6M7N8O9',
        members: [
          { userId: superAdmin._id, role: 'ADMIN' },
          { userId: wlsAdmin._id, role: 'ADMIN' },
          { userId: regularUser._id, role: 'MEMBER' }
        ]
      },
      {
        name: 'WLS Community Announcements - Group B',
        type: validGroupType,
        description: 'Official group for broadcast updates.',
        link: 'https://chat.whatsapp.com/X1Y2Z3A4B5C6D7E8F9',
        members: [
          { userId: superAdmin._id, role: 'ADMIN' },
          { userId: wlsAdmin._id, role: 'ADMIN' }
        ]
      }
    ]);

    // 4. Seed Assessment Rules Engine
    console.log('⚙️ Seeding Assessment Rules...');
    await RuleModel.create([
      { key: 'presentation', criterion: 'Presentation - Camera, Light, Sound Quality', description: 'Overall audio/video quality', maxScore: 10, isActive: true },
      { key: 'attire', criterion: 'Attire / Dress Code Compliance', description: 'Formal presentation attire', maxScore: 10, isActive: true },
      { key: 'arabicReading', criterion: 'Arabic Reading & Tajweed Accuracy', description: 'Correct pronunciation and tajweed rules', maxScore: 10, isActive: true },
      { key: 'timeliness', criterion: 'On-Time Submission Delivery', description: 'Submitted prior to deadline', maxScore: 10, isActive: true }
    ]);

    // 5. Seed Active WLS Session
    console.log('📚 Seeding Active WLS Session...');
    await WlsSessionModel.create({
      topicName: 'Tafseer & Recitation Module - Week 1',
      sessionDateTimeToronto: new Date('2026-10-15T18:00:00-04:00'),
      videoDeadline: new Date('2026-10-14T23:59:59-04:00'),
      description: 'Weekly interactive session on Surah Al-Baqarah.',
      status: 'ACTIVE',
      pdfBookletUrls: ['https://drive.google.com/file/d/booklet123/view'],
      quranVideoUrls: ['https://youtube.com/watch?v=sample123'],
      groupAssignments: {
        'Group 1': {
          userIds: [regularUser._id.toString()],
          adminIds: [superAdmin._id.toString(), wlsAdmin._id.toString()],
          selectedAyats: ['1-5'],
          instructions: 'Focus on clear tajweed rules for Ayah 1 to 5.'
        }
      }
    });

    // 6. Seed System Notifications
    console.log('🔔 Seeding System Notifications...');
    await NotificationModel.create({
      recipient: superAdmin._id,
      title: 'Master Seed Complete',
      message: 'Database initialization complete using feature models.',
      type: 'SYSTEM',
      priority: 'MEDIUM',
      isRead: false
    });

    console.log('\n✅ Master Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Master Seeding Failed:', error);
    process.exit(1);
  }
};

seedMasterData();