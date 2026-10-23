import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/wls-portal-db";

async function fix() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;

  const engChosenCat = await db.collection("categories").findOne({
    category_id: 2,
    language: "eng"
  });

  if (!engChosenCat) {
    console.error("Could not find Chosen Personalities (eng) category!");
    process.exit(1);
  }

  console.log("Found Chosen Personalities (eng) category:", engChosenCat._id);

  // Fix Lecture 3 and Lecture 7
  const res = await db.collection("lectures").updateMany(
    {
      _id: {
        $in: [
          new mongoose.Types.ObjectId("6ac813f338bef4b9d8a132a0"),
          new mongoose.Types.ObjectId("6ac813f338bef4b9d8a132a4")
        ]
      }
    },
    {
      $set: {
        category_id_ref: engChosenCat._id,
        language: "eng"
      }
    }
  );

  console.log(`Updated ${res.modifiedCount} lectures to category_id_ref: ${engChosenCat._id}`);

  // Verify lectures now in Chosen Personalities (eng)
  const lecs = await db.collection("lectures").find({
    category_id_ref: engChosenCat._id
  }).sort({ lecture_id: 1 }).toArray();

  console.log(`Chosen Personalities (eng) now has ${lecs.length} lectures:`);
  lecs.forEach(l => {
    console.log(`  Lec ${l.lecture_id}: ${JSON.stringify(l.lecture_name)} (Ayats: ${l.total_ayats})`);
  });

  // Update total_lectures on the category document
  await db.collection("categories").updateOne(
    { _id: engChosenCat._id },
    { $set: { total_lectures: lecs.length } }
  );
  console.log(`Updated category total_lectures to ${lecs.length}`);

  await mongoose.disconnect();
}

fix().catch(console.error);
