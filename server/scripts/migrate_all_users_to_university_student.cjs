const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/wls-portal-db';

async function migrateUsers() {
  console.log('Connecting to MongoDB at:', mongoUri);
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  const db = mongoose.connection.db;
  const usersCollection = db.collection('users');

  // 1. Ensure all users have university_student in their roles array
  const result = await usersCollection.updateMany(
    { roles: { $ne: 'university_student' } },
    { $addToSet: { roles: 'university_student' } }
  );

  console.log(`Updated ${result.modifiedCount} users to include 'university_student' role.`);

  // 2. Count total users and check sample
  const total = await usersCollection.countDocuments();
  const sample = await usersCollection.find({}, { projection: { name: 1, email: 1, role: 1, roles: 1 } }).limit(5).toArray();

  console.log(`Total users in database: ${total}`);
  console.log('Sample user roles after migration:', JSON.stringify(sample, null, 2));

  await mongoose.disconnect();
  console.log('Migration completed successfully.');
}

migrateUsers().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
