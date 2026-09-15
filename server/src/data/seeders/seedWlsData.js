const mongoose = require('mongoose');
const WlsSessionModel = require('../sql/wlsSessionModel');
const CriteriaModel = require('../sql/criteriaModel'); // Model for rubric criteria

const seedData = async () => {
  try {
    console.log('🌱 Starting Database Seeding...');

    // 1. Seed Rubric Criteria Engine Master Data
    await CriteriaModel.deleteMany({});
    const defaultCriteria = await CriteriaModel.insertMany([
      { name: 'Presentation - Camera, Light, Sound Quality', weight: 1, order: 1 },
      { name: 'Attire / Dress Code', weight: 1, order: 2 },
      { name: 'Arabic Reading', weight: 1, order: 3 },
      { name: 'On Time Delivery', weight: 1, order: 4 },
      { name: 'Transference of Spirit', weight: 1, order: 5 },
      { name: 'Body Language', weight: 1, order: 6 }
    ]);
    console.log(`✅ Seeded ${defaultCriteria.length} Assessment Criteria.`);

    // 2. Seed Sample WLS Session with Groups and Verse Mapping
    await WlsSessionModel.deleteMany({});
    const sampleSession = await WlsSessionModel.create({
      topicName: 'Tafseer & Recitation Module - Week 1',
      sessionDateTimeToronto: new Date('2026-10-01T18:30:00-04:00'),
      pdfBookletUrl: 'https://storage.googleapis.com/wls-docs/week1-guide.pdf',
      quranVideoUrl: 'https://youtube.com/watch?v=demo-quran-lecture',
      status: 'ACTIVE',
      selectedAyats: [
        { surahId: 1, surahName: '1. Al-Fatihah', ayatNumber: 1 },
        { surahId: 18, surahName: '18. Al-Kahf', ayatNumber: 10 }
      ],
      groups: [
        {
          groupIdx: 1,
          groupName: 'Group 1',
          assignedAdminIds: [],
          assignedUserIds: []
        }
      ]
    });

    console.log(`✅ Seeded WLS Session: "${sampleSession.topicName}"`);
    console.log('🎉 Seeding Complete!');
  } catch (error) {
    console.error('❌ Seeding Failed:', error);
  } finally {
    mongoose.connection.close();
  }
};

module.exports = seedData;