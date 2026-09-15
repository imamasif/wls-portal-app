import mongoose from 'mongoose';
import process from 'process';

// 1. Import your actual project user model
import { UserModel } from '../../features/users/data/user.model.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/wls-portal-db';

const seedMasterData = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB Connected.');

    // Define auxiliary models if their respective feature folders/files aren't built yet
    const CriteriaSchema = new mongoose.Schema({
      code: { type: String, required: true, unique: true },
      title: { type: String, required: true },
      weight: { type: Number, default: 1 },
      order: { type: Number, default: 0 }
    }, { timestamps: true });

    const WlsSessionSchema = new mongoose.Schema({
      topicName: { type: String, required: true },
      sessionDateTimeToronto: { type: Date, required: true },
      pdfBookletUrl: { type: String },
      quranVideoUrl: { type: String },
      status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'DRAFT'], default: 'ACTIVE' },
      selectedAyats: [{ surahId: Number, surahName: String, ayatNumber: Number }],
      groups: [{
        groupIdx: Number,
        groupName: String,
        assignedAdminIds: [mongoose.Schema.Types.ObjectId],
        assignedUserIds: [mongoose.Schema.Types.ObjectId]
      }]
    }, { timestamps: true });

    const CriteriaModel = mongoose.models.Criteria || mongoose.model('Criteria', CriteriaSchema);
    const WlsSessionModel = mongoose.models.WlsSession || mongoose.model('WlsSession', WlsSessionSchema);

    // 2. Clear Existing Data
    console.log('🌱 Clearing existing collections...');
    await UserModel.deleteMany({});
    await CriteriaModel.deleteMany({});
    await WlsSessionModel.deleteMany({});

    // 3. Seed Users using your exact model attributes (name, email, role, etc.)
    console.log('👤 Seeding Users & Roles...');
    const users = await UserModel.create([
      {
        name: 'Syed Imam',
        email: 'syedimam@iipccanada.com',
        password: 'Password123!', // Matches your model's required auth fields if applicable
        role: 'SUPER_ADMIN',
        isActive: true,
        country: 'Canada',
        state: 'Ontario',
        city: 'Toronto',
        profession: 'Solution Architect'
      },
      {
        name: 'Ahmed Hassan',
        email: 'ahmed.hassan@example.com',
        password: 'Password123!',
        role: 'WLS_ADMIN',
        isActive: true,
        country: 'Canada',
        state: 'Ontario',
        city: 'Toronto'
      },
      {
        name: 'Tariq Mahmood',
        email: 'tariq.m@example.com',
        password: 'Password123!',
        role: 'USER',
        isActive: true,
        country: 'Canada',
        state: 'Ontario',
        city: 'Mississauga'
      }
    ]);

    const superAdmin = users.find((u) => u.role === 'SUPER_ADMIN');
    const wlsAdmins = users.filter((u) => u.role === 'WLS_ADMIN');
    const regularUsers = users.filter((u) => u.role === 'USER');

    // 4. Seed Assessment Criteria Rules
    console.log('⚙️ Seeding Assessment Criteria Rules...');
    await CriteriaModel.insertMany([
      { code: 'CRIT_01', title: 'Presentation - Camera, Light, Sound Quality', weight: 1, order: 1 },
      { code: 'CRIT_02', title: 'Attire / Dress Code Compliance', weight: 1, order: 2 },
      { code: 'CRIT_03', title: 'Arabic Reading & Tajweed Accuracy', weight: 1.5, order: 3 },
      { code: 'CRIT_04', title: 'On-Time Submission Delivery', weight: 1, order: 4 }
    ]);

    // 5. Seed Active WLS Session
    console.log('📚 Seeding Active WLS Session...');
    await WlsSessionModel.create({
      topicName: 'Tafseer & Recitation Module - Week 1',
      sessionDateTimeToronto: new Date('2026-10-15T18:00:00-04:00'),
      status: 'ACTIVE',
      groups: [
        {
          groupIdx: 1,
          groupName: 'Group 1',
          assignedAdminIds: [superAdmin._id, wlsAdmins[0]?._id].filter(Boolean),
          assignedUserIds: regularUsers.map(u => u._id)
        }
      ]
    });

    console.log('\n✅ Seeding Completed Successfully with your exact User Model!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Master Seeding Failed:', error);
    process.exit(1);
  }
};

seedMasterData();