import mongoose from "mongoose";

async function run() {
  console.log("=== STARTING MIGRATION: REPAIR URDU/ENGLISH LECTURES, AYATS & PDFS ===");
  await mongoose.connect("mongodb://127.0.0.1:27017/wls-portal-db");
  const db = mongoose.connection.db;

  // -------------------------------------------------------------
  // STEP 1: Fix 4 English lectures that were assigned to Hindi categories
  // -------------------------------------------------------------
  const englishLecturesToFix = [
    {
      id: "6ac813f338bef4b9d8a132bb",
      name: "Hijab / Veil - English",
      targetCat: "6ac7e7644f6dc255a810117e", // Family Life (English)
    },
    {
      id: "6ac813f338bef4b9d8a132ce",
      name: "Umrah and Hajj - English",
      targetCat: "6ac7e7644f6dc255a8101184", // Direction of Belief (English)
    },
    {
      id: "6ac813f338bef4b9d8a132d1",
      name: "Al-Jihad / The Strive - English",
      targetCat: "6ac7e7644f6dc255a8101187", // Govern ourselves... (English)
    },
    {
      id: "6ac813f338bef4b9d8a132d8",
      name: "Akhlaq / Morality - English",
      targetCat: "6ac7e7644f6dc255a8101187", // Govern ourselves... (English)
    },
  ];

  console.log("\n[STEP 1] Restoring 4 English lectures to English categories...");
  for (const item of englishLecturesToFix) {
    const res = await db.collection("lectures").updateOne(
      { _id: new mongoose.Types.ObjectId(item.id) },
      { $set: { category_id_ref: new mongoose.Types.ObjectId(item.targetCat) } }
    );
    console.log(`  -> Repointed lecture "${item.name}" (${item.id}) to category ${item.targetCat} (modified: ${res.modifiedCount})`);
  }

  // -------------------------------------------------------------
  // STEP 2: Re-point 449 Urdu ayats from 8 misplaced lectures to active Urdu lectures
  // -------------------------------------------------------------
  const urduAyatRepoints = [
    {
      sourceLecId: "6ac813f338bef4b9d8a132dc",
      targetLecId: "6adb83068f11cd3dca1582f0",
      targetCatId: "6ac7e7644f6dc255a8101176",
      name: "Malka Saba",
    },
    {
      sourceLecId: "6ac813f338bef4b9d8a132dd",
      targetLecId: "6adb83068f11cd3dca1582ef",
      targetCatId: "6ac7e7644f6dc255a8101176",
      name: "Nooh A.S ki Fulk / Nuh Ki Kashti",
    },
    {
      sourceLecId: "6ac813f338bef4b9d8a132e5",
      targetLecId: "6adb83068f11cd3dca1582f1",
      targetCatId: "6ac7e7644f6dc255a8101176",
      name: "Allah Bashr se kaisi kalam karta hai",
    },
    {
      sourceLecId: "6ac813f338bef4b9d8a132e7",
      targetLecId: "6adb83068f11cd3dca1582f2",
      targetCatId: "6ac7e7644f6dc255a8101176",
      name: "Nabi aur Rasool",
    },
    {
      sourceLecId: "6ac813f338bef4b9d8a132f4",
      targetLecId: "6adba1208f11cd3dca1582fb",
      targetCatId: "6ac7e7644f6dc255a8101179",
      name: "Zikr",
    },
    {
      sourceLecId: "6ac813f338bef4b9d8a132f7",
      targetLecId: "6adba1208f11cd3dca1582f7",
      targetCatId: "6ac7e7644f6dc255a8101179",
      name: "Wahi Nazil",
    },
    {
      sourceLecId: "6ac813f338bef4b9d8a13302",
      targetLecId: "6adba84a8f11cd3dca1582fe",
      targetCatId: "6ac7e7644f6dc255a810117c",
      name: "Jinn",
    },
    {
      sourceLecId: "6ac813f338bef4b9d8a1331a",
      targetLecId: "6ac813f338bef4b9d8a1330d",
      targetCatId: "6ac7e7644f6dc255a8101185",
      name: "Saat aasman",
    },
  ];

  console.log("\n[STEP 2] Re-pointing 449 Urdu ayats to active Urdu lectures...");
  for (const item of urduAyatRepoints) {
    const sIdObj = new mongoose.Types.ObjectId(item.sourceLecId);
    const sIdStr = item.sourceLecId;
    const tLecObj = new mongoose.Types.ObjectId(item.targetLecId);
    const tCatObj = new mongoose.Types.ObjectId(item.targetCatId);

    const matchFilter = {
      $or: [
        { lecture_id: sIdObj },
        { lecture_id: sIdStr },
      ],
    };

    const countBefore = await db.collection("ayats").countDocuments(matchFilter);
    const res = await db.collection("ayats").updateMany(
      matchFilter,
      {
        $set: {
          lecture_id: tLecObj,
          category_id_ref: tCatObj,
        },
      }
    );
    console.log(`  -> Repointed ${res.modifiedCount} / ${countBefore} ayats for "${item.name}" to lecture ${item.targetLecId}`);
  }

  // -------------------------------------------------------------
  // STEP 3: Setup Category 101 Urdu lectures (Allah Aur Aalihah & Iblees)
  // -------------------------------------------------------------
  console.log("\n[STEP 3] Setting up Category 101 Urdu lectures...");
  await db.collection("lectures").updateOne(
    { _id: new mongoose.Types.ObjectId("6adb7c098f11cd3dca1582ee") },
    {
      $set: {
        lecture_id: 1,
        lecture_name: ["Allah Aur Aalihah", "Aaliha aur Allah - Urdu"],
        language: "urdu",
        pdf_link: "https://iipccanada.com/urdu_pdf/allah_illah.pdf",
        pdf_booklet_urls: ["https://iipccanada.com/urdu_pdf/allah_illah.pdf"],
        pdf_url: [{ title: "Allah Aur Aalihah", url: "https://iipccanada.com/urdu_pdf/allah_illah.pdf" }],
      },
    }
  );
  console.log('  -> Updated "Allah Aur Aalihah" (lec_id: 1, pdf: allah_illah.pdf)');

  await db.collection("lectures").updateOne(
    { _id: new mongoose.Types.ObjectId("6adb7c098f11cd3dca1582ed") },
    {
      $set: {
        lecture_id: 2,
        lecture_name: ["Iblees aur Shaitaan", "Iblees / Shaitaan - Urdu"],
        language: "urdu",
        pdf_link: "https://iipccanada.com/urdu_pdf/shaitan_iblees.pdf",
        pdf_booklet_urls: ["https://iipccanada.com/urdu_pdf/shaitan_iblees.pdf"],
        pdf_url: [{ title: "Iblees aur Shaitaan", url: "https://iipccanada.com/urdu_pdf/shaitan_iblees.pdf" }],
      },
    }
  );
  console.log('  -> Updated "Iblees aur Shaitaan" (lec_id: 2, pdf: shaitan_iblees.pdf)');

  // -------------------------------------------------------------
  // STEP 4: Standardize pdf_url, pdf_link, pdf_booklet_urls across ALL lectures
  // -------------------------------------------------------------
  console.log("\n[STEP 4] Standardizing pdf_url, pdf_link, pdf_booklet_urls across all lectures...");
  const allLectures = await db.collection("lectures").find({}).toArray();
  let updatedPdfs = 0;

  for (const lec of allLectures) {
    const rawCandidates = [];

    // Check pdf_url
    if (typeof lec.pdf_url === "string" && lec.pdf_url.trim()) {
      rawCandidates.push(lec.pdf_url.trim());
    } else if (Array.isArray(lec.pdf_url)) {
      lec.pdf_url.forEach((p) => {
        if (typeof p === "string" && p.trim()) rawCandidates.push(p.trim());
        else if (p && typeof p === "object" && typeof p.url === "string" && p.url.trim()) {
          rawCandidates.push(p.url.trim());
        }
      });
    }

    // Check pdf_booklet_urls
    if (Array.isArray(lec.pdf_booklet_urls)) {
      lec.pdf_booklet_urls.forEach((u) => {
        if (typeof u === "string" && u.trim()) rawCandidates.push(u.trim());
      });
    }

    // Check pdf_link
    if (typeof lec.pdf_link === "string" && lec.pdf_link.trim()) {
      rawCandidates.push(lec.pdf_link.trim());
    }

    // Deduplicate valid URLs
    const seen = new Set();
    const validUrls = [];
    for (const u of rawCandidates) {
      if (u.startsWith("http") && !seen.has(u)) {
        seen.add(u);
        validUrls.push(u);
      }
    }

    const defaultTitle =
      (typeof lec.pdf_title === "string" && lec.pdf_title.trim()) ||
      (Array.isArray(lec.lecture_name) ? lec.lecture_name[0] : (typeof lec.lecture_name === "string" ? lec.lecture_name : ""));

    const standardizedPdfUrl = validUrls.map((u) => ({
      title: defaultTitle || "Open PDF Booklet",
      url: u,
    }));

    const updateFields = {
      pdf_url: standardizedPdfUrl,
      pdf_link: validUrls[0] || "",
      pdf_booklet_urls: validUrls,
    };

    await db.collection("lectures").updateOne(
      { _id: lec._id },
      { $set: updateFields }
    );
    if (validUrls.length > 0) updatedPdfs++;
  }
  console.log(`  -> Standardized PDF data for all ${allLectures.length} lectures (${updatedPdfs} have valid PDF documents)`);

  // -------------------------------------------------------------
  // STEP 5: Recalculate total_ayats on all lectures and total_lectures on all categories
  // -------------------------------------------------------------
  console.log("\n[STEP 5] Recalculating lecture total_ayats and category total_lectures...");

  for (const lec of allLectures) {
    const aCount = await db.collection("ayats").countDocuments({
      $or: [
        { lecture_id: lec._id },
        { lecture_id: String(lec._id) },
        ...(mongoose.Types.ObjectId.isValid(lec._id) ? [{ lecture_id: new mongoose.Types.ObjectId(lec._id) }] : [])
      ],
    });

    await db.collection("lectures").updateOne(
      { _id: lec._id },
      { $set: { total_ayats: aCount } }
    );
  }

  const allCategories = await db.collection("categories").find({}).toArray();
  for (const cat of allCategories) {
    const lCount = await db.collection("lectures").countDocuments({
      $or: [
        { category_id_ref: cat._id },
        { category_id_ref: String(cat._id) },
        ...(mongoose.Types.ObjectId.isValid(cat._id) ? [{ category_id_ref: new mongoose.Types.ObjectId(cat._id) }] : [])
      ],
    });

    await db.collection("categories").updateOne(
      { _id: cat._id },
      { $set: { total_lectures: lCount } }
    );
  }

  console.log(`  -> Recalculated stats for ${allLectures.length} lectures and ${allCategories.length} categories.`);
  console.log("\n=== MIGRATION COMPLETED SUCCESSFULLY ===");

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
