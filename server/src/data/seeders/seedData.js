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

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wls-portal-db';

const seedMasterData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected.');

    console.log('🌱 Wiping database collections completely...');
    await mongoose.connection.dropDatabase();
    console.log('✅ Database dropped cleanly.');

    const hashedPassword = await bcrypt.hash('DefaultPassword123!', 10);

    const superUserNames = ['Syed Imam', 'Alam Muhammed', 'Fawad Gilani', 'Jahanzaib Najam'];
    const wlsAdminNames = ['Aazim Kamal', 'Nasir Khan', 'Salman Hunter', 'Mukaram Khan'];

    console.log('👤 Seeding 50 Users with Multi-Group Support...');
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
        password: hashedPassword,        
        role: p.role,
        groupNumbers: p.groups,
        isActive: true,
        country: 'Canada',
        city: 'Toronto',
        phones: [{ number: '+1 (416) 555-0199', type: 'Mobile', isPrimary: true }]
      });
    }

    const firstNames = ['Ali', 'Omar', 'Usman', 'Bilal', 'Zain', 'Hamza', 'Ibrahim', 'Yusuf', 'Hassan', 'Hussein', 'Maryam', 'Ayesha', 'Fatima', 'Zahra', 'Khadija', 'Amna', 'Sara', 'Noor', 'Mariam', 'Hajar'];
    const lastNames = ['Khan', 'Ahmed', 'Ali', 'Malik', 'Sheikh', 'Siddiqui', 'Chaudhry', 'Butt', 'Mirza', 'Qureshi'];

    for (let i = userDocs.length + 1; i <= 50; i++) {
      const fName = firstNames[i % firstNames.length];
      const lName = lastNames[i % lastNames.length];

      userDocs.push({
        name: `${fName} ${lName} ${i}`,
        email: `user${i}@example.com`,
        password: hashedPassword,
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

    await UserModel.create(userDocs);

    console.log('💬 Seeding Social Groups...');
    await SocialGroupModel.create([
      { name: 'WLS Group 1 - Core', type: 'WHATSAPP', allowedRoles: ['SUPER_USER', 'WLS_ADMIN', 'USER'] },
      { name: 'WLS Group 2 - Advanced', type: 'WHATSAPP', allowedRoles: ['SUPER_USER', 'WLS_ADMIN'] },
      { name: 'WLS Group 3 - General', type: 'WHATSAPP', allowedRoles: ['SUPER_USER', 'WLS_ADMIN', 'USER'] }
    ]);

    await RuleModel.create([
      { key: 'presentation', criterion: 'Presentation Quality', maxScore: 10, isActive: true },
      { key: 'tajweed', criterion: 'Tajweed Accuracy', maxScore: 10, isActive: true }
    ]);

    await WlsSessionModel.create({
      topicName: 'Tafseer & Recitation Module - Week 1',
      sessionDateTimeToronto: new Date('2026-10-15T18:00:00-04:00'),
      videoDeadline: new Date('2026-10-14T23:59:59-04:00'),
      status: 'ACTIVE'
    });

    console.log('\n✅ Master Seeding Completed Successfully with 50 Users!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Master Seeding Failed:', error);
    process.exit(1);
  }
};

seedMasterData();