import mongoose from "mongoose";

async function run() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wls-portal-db");
  const db = mongoose.connection.db;

  console.log("=== STEP 1: CLEANING UP PHANTOM URDU DUMMIES FROM HINDI CATEGORIES 201-208 ===");
  const hindiCats = await db.collection("categories").find({
    category_id: { $gte: 201, $lte: 208 }
  }).toArray();
  const hindiCatIds = hindiCats.map(c => c._id);

  // Find all dummy lectures in Hindi categories that have 0 ayats and are not Hindi lectures
  const lecsInHindi = await db.collection("lectures").find({
    category_id_ref: { $in: hindiCatIds }
  }).toArray();

  let deletedCount = 0;
  for (const l of lecsInHindi) {
    const nameStr = Array.isArray(l.lecture_name) ? l.lecture_name.join(" ") : String(l.lecture_name || "");
    const isHindi = /Hindi/i.test(nameStr);
    
    // Check ayats count just in case
    const aCount = await db.collection("ayats").countDocuments({
      $or: [
        { lecture_id: l._id },
        { lecture_id: String(l._id) },
        ...(mongoose.Types.ObjectId.isValid(l._id) ? [{ lecture_id: new mongoose.Types.ObjectId(l._id) }] : [])
      ]
    });

    if (!isHindi && aCount === 0) {
      console.log(`  Deleting phantom Urdu dummy in Hindi Cat: "${nameStr}" (_id: ${l._id})`);
      await db.collection("lectures").deleteOne({ _id: l._id });
      deletedCount++;
    }
  }
  console.log(`Total phantom dummy lectures deleted: ${deletedCount}`);

  console.log("\n=== STEP 2: SETTING EXPLICIT LANGUAGE ON ALL LECTURES ===");
  const allCats = await db.collection("categories").find({}).toArray();
  const catMap = new Map();
  for (const c of allCats) {
    catMap.set(c._id.toString(), c);
  }

  const allLecs = await db.collection("lectures").find({}).toArray();
  let updatedLangCount = 0;
  for (const l of allLecs) {
    const parentCat = catMap.get(l.category_id_ref ? l.category_id_ref.toString() : "");
    const targetLang = parentCat ? parentCat.language : "eng";
    if (l.language !== targetLang) {
      await db.collection("lectures").updateOne(
        { _id: l._id },
        { $set: { language: targetLang } }
      );
      updatedLangCount++;
    }
  }
  console.log(`Total lectures updated with explicit language: ${updatedLangCount}`);

  console.log("\n=== STEP 3: RECALCULATING CATEGORY TOTAL_LECTURES ===");
  for (const c of allCats) {
    const count = await db.collection("lectures").countDocuments({
      $or: [
        { category_id_ref: c._id },
        { category_id_ref: c._id.toString() },
        ...(mongoose.Types.ObjectId.isValid(c._id) ? [{ category_id_ref: new mongoose.Types.ObjectId(c._id) }] : [])
      ]
    });
    await db.collection("categories").updateOne(
      { _id: c._id },
      { $set: { total_lectures: count } }
    );
    console.log(`  Cat [${c.language}] ${c.category_id}: "${c.category_name}" -> ${count} lectures`);
  }

  console.log("\n=== STEP 4: VERIFY URDU CATEGORIES & CANONICAL PDFS ===");
  const urduCats = await db.collection("categories").find({ language: "urdu" }).sort({ category_id: 1 }).toArray();
  for (const uc of urduCats) {
    const lecs = await db.collection("lectures").find({
      $or: [{ category_id_ref: uc._id }, { category_id_ref: uc._id.toString() }]
    }).sort({ lecture_id: 1 }).toArray();
    console.log(`\nUrdu Category ${uc.category_id}: "${uc.category_name}" (${lecs.length} lectures):`);
    for (const l of lecs) {
      const pUrl = (Array.isArray(l.pdf_url) && l.pdf_url[0]?.url) || l.pdf_link || (Array.isArray(l.pdf_booklet_urls) ? l.pdf_booklet_urls[0] : "");
      console.log(`  Lec ${l.lecture_id}: ${JSON.stringify(l.lecture_name)} | lang: ${l.language} | ayats: ${l.total_ayats} | PDF: ${pUrl || "NONE"}`);
    }
  }

  await mongoose.disconnect();
  console.log("\n=== DATABASE CLEANUP & RE-INDEXING COMPLETE ===");
}

run().catch(console.error);
