import fs from "fs";
import mongoose from "mongoose";

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const CATEGORY_ORDER = [
  { id: 101, name: "Apnay Khuda Ko Pehchano", matchNames: ["Apnay Khuda Ko Pehchano", "Apnay Khuda ko pehchano"] },
  { id: 102, name: "Chuni Hui Shakhsiyat", matchNames: ["Chuni Hui Shakhsiyat", "Chuni hui shakhsiyat"] },
  { id: 103, name: "Allah Ki Kitab", matchNames: ["Allah Ki Kitab", "Allah ki kitab"] },
  { id: 104, name: "Apni Pehchan", matchNames: ["Apni Pehchan"] },
  { id: 105, name: "Gharelo Zindagi", matchNames: ["Gharelo Zindagi"] },
  { id: 106, name: "Maal Ka Istamal", matchNames: ["Maal Ka Istamal", "Maal ka istamal"] },
  { id: 107, name: "Iman Ki Simt", matchNames: ["Iman Ki Simt", "Iman ki simt"] },
  { id: 108, name: "Ahkam wali ayat se apny uper Hakomat", matchNames: ["Ahkam wali ayat se apny uper Hakomat"] },
  { id: 111, name: "Mohammad Shaikh Kay Bare Main", matchNames: ["Mohammad Shaikh Kay Bare Main"] },
  { id: 112, name: "Mohammad Shaikh Mukalma", matchNames: ["Mohammad Shaikh Mukalma"] },
];

const CANONICAL_PDFS = {
  // Apnay Khuda Ko Pehchano
  "Allah Aur Aalihah": "https://iipccanada.com/urdu_pdf/allah_illah.pdf",
  "Iblees aur Shaitaan": "https://iipccanada.com/urdu_pdf/satan_devil.pdf",

  // Chuni Hui Shakhsiyat
  "Ibraheem pbuh Ka Khuwab": "https://iipccanada.com/urdu_pdf/vision_of_ibraheem.pdf",
  "Moosa pbuh Ki Kitab": "https://iipccanada.com/urdu_pdf/book_of_moses.pdf",
  "Maryam PBUH": "https://iipccanada.com/urdu_pdf/maryam.pdf",
  "Essa PBUH": "https://iipccanada.com/urdu_pdf/essa.pdf",
  "Mohammad PBUH": "https://iipccanada.com/urdu_pdf/mohammad_pbuh.pdf",
  "Allah Bashar se kaisay kalam karta hai": "https://iipccanada.com/urdu_pdf/allah_bashr.pdf",
  "Nabi aur Rasool": "https://iipccanada.com/urdu_pdf/nabi_rasool.pdf",
  "Malka Saba ke Takht": "https://iipccanada.com/urdu_pdf/malka_saba.pdf",
  "Nuh Ki Kashti": "https://iipccanada.com/urdu_pdf/fulk_nooh.pdf",

  // Allah Ki Kitab
  "Al Kitab": "https://iipccanada.com/urdu_pdf/al_kitab_the_Book.pdf",
  "Quran": "https://iipccanada.com/urdu_pdf/al_quran_the_reading.pdf",
  "Taurat Aur Injeel": "https://iipccanada.com/urdu_pdf/taurat_injeel.pdf",
  "Zaboor Suhuf Aur Alwah": "https://iipccanada.com/urdu_pdf/zaboor_suhuf_alwah.pdf",
  "Hadees": "https://iipccanada.com/urdu_pdf/hadees_event.pdf",
  "Sunnah": "https://iipccanada.com/urdu_pdf/sunnatullah_the_practice_of_allah.pdf",
  "Hikmat": "https://iipccanada.com/urdu_pdf/hikmah_wisdom.pdf",
  "Rooh": "https://iipccanada.com/urdu_pdf/rooh_spirit.pdf",
  "Zabanain": "https://iipccanada.com/urdu_pdf/lisan_language.pdf",
  "Hidayat": "https://iipccanada.com/urdu_pdf/hidayah_guidance.pdf",
  "Zikr / Yaad dehani": "https://iipccanada.com/urdu_pdf/zikr.pdf",
  "Nazil Aur Wahi": "https://iipccanada.com/urdu_pdf/wahi_nazil.pdf",

  // Apni Pehchan
  "Muslim": "https://iipccanada.com/urdu_pdf/muslim.pdf",
  "Ahl e Kitab": "https://iipccanada.com/urdu_pdf/people_of_the_book.pdf",
  "Bani Israeel": "https://iipccanada.com/urdu_pdf/children_of_israel.pdf",
  "Aulia Surparast": "https://iipccanada.com/urdu_pdf/aulia.pdf",
  "Khalifa": "https://iipccanada.com/urdu_pdf/khalifa_successor.pdf",
  "Imam": "https://iipccanada.com/urdu_pdf/imam_leader.pdf",
  "Firqay": "https://iipccanada.com/urdu_pdf/sect.pdf",
  "Munafiq": "https://iipccanada.com/urdu_pdf/munafiq.pdf",
  "Shaheed": "https://iipccanada.com/urdu_pdf/shaheed.pdf",
  "Yahood Aur Nasara": "https://iipccanada.com/urdu_pdf/yahood_&_nasara.pdf",
  "Jinn Aur Ins": "https://iipccanada.com/urdu_pdf/jinn.pdf",

  // Gharelo Zindagi
  "Hijab": "https://iipccanada.com/urdu_pdf/hijab_veil.pdf",
  "Nikah": "https://iipccanada.com/urdu_pdf/nikah_marriage.pdf",
  "Mian Aur Biwi Kay Taluqat": "https://iipccanada.com/urdu_pdf/husband_wife_relationship.pdf",
  "Fahisha": "https://iipccanada.com/urdu_pdf/fahishah_obscenity.pdf",
  "Talaaq": "https://iipccanada.com/urdu_pdf/talaaq_divorce.pdf",
  "Waldain Aur Aulad key Taluqat": "https://iipccanada.com/urdu_pdf/parent_children_relationship.pdf",

  // Maal Ka Istamal
  "Sadqa aur Zakat": "https://iipccanada.com/urdu_pdf/sadqa_charity_zakah_justification.pdf",
  "Riba Sood": "https://iipccanada.com/urdu_pdf/riba_increase.pdf",
  "Rizq": "https://iipccanada.com/urdu_pdf/rizq.pdf",

  // Iman Ki Simt
  "Islam": "https://iipccanada.com/urdu_pdf/islam_to_attain_peace.pdf",
  "Islam Aur Muslim": "https://iipccanada.com/urdu_pdf/islam_to_attain_peace.pdf",
  "Ibraheem pbuh Ka Mazhab": "https://iipccanada.com/urdu_pdf/religion_of_abraham.pdf",
  "Sirat e Mustaqeem": "https://iipccanada.com/urdu_pdf/straight_path.pdf",
  "Shafaat Sifarish": "https://iipccanada.com/urdu_pdf/shafaat_intercession.pdf",
  "Kaaba Aur Qibla": "https://iipccanada.com/urdu_pdf/kaaba_qibla.pdf",
  "Masajid": "https://iipccanada.com/urdu_pdf/masjid_mosque.pdf",
  "Salah / Namaz": "https://iipccanada.com/urdu_pdf/salah_prayer.pdf",
  "Muhtaram Maheeney": "https://iipccanada.com/urdu_pdf/sacred_months.pdf",
  "Roza": "https://iipccanada.com/urdu_pdf/saum_fasting.pdf",
  "Umrah aur Hajj": "https://iipccanada.com/urdu_pdf/hajj_pilgrimage.pdf",
  "Ummul Qura / Shehron Ki Maa": "https://iipccanada.com/urdu_pdf/ummul_qura.pdf",
  "Tur e Sina": "https://iipccanada.com/urdu_pdf/jabal_e_noor.pdf",
  "Saat aasman, zameen aur samandar": "https://iipccanada.com/urdu_pdf/skies.pdf",

  // Ahkam wali ayat se apny uper Hakomat
  "Jihad / Jad o Jehad": "https://iipccanada.com/urdu_pdf/jihad_strive.pdf",
  "Qatal": "https://iipccanada.com/urdu_pdf/physical_killing.pdf",
  "Nafsiyati Qatal": "https://iipccanada.com/urdu_pdf/psychological_killing.pdf",
  "Dehshat Gardi": "https://iipccanada.com/urdu_pdf/terrorism.pdf",
  "Jung": "https://iipccanada.com/urdu_pdf/harab_war.pdf",
  "Qisaas / Evaz / Badal": "https://iipccanada.com/urdu_pdf/qisaas_requital.pdf",
  "Nafsiyati Zakhmon Ki Tasalli": "https://iipccanada.com/urdu_pdf/consolation_of_psychological_hurts.pdf",
  "Ikhlaq": "https://iipccanada.com/urdu_pdf/morality_akhlaq.pdf",
  "Bai / Deal": "https://iipccanada.com/urdu_pdf/bai.pdf",
  "Maut / Death": "http://iipccanada.com/urdu_pdf/maut.pdf",
};

async function executeWipeAndReimport() {
  console.log("=== CONNECTING TO DATABASE ===");
  await mongoose.connect("mongodb://127.0.0.1:27017/wls-portal-db");
  const db = mongoose.connection.db;

  // 1. Identify English entities to protect
  const engCats = await db.collection("categories").find({ language: "eng" }).toArray();
  const engCatIds = engCats.map(c => c._id);
  const engCatIdStrs = engCatIds.map(String);

  const engLecs = await db.collection("lectures").find({
    $or: [
      { language: "eng" },
      { category_id_ref: { $in: engCatIds } }
    ]
  }).toArray();
  const engLecIds = engLecs.map(l => l._id);
  const engLecIdStrs = engLecIds.map(String);

  const engAyatsCount = await db.collection("ayats").countDocuments({
    $or: [
      { lecture_id: { $in: engLecIds } },
      { lecture_id: { $in: engLecIdStrs } }
    ]
  });

  console.log(`Protected English records: ${engCats.length} categories, ${engLecs.length} lectures, ${engAyatsCount} ayats.`);

  // 2. Identify Non-English entities to delete
  const catsToDelete = await db.collection("categories").find({
    _id: { $nin: engCatIds }
  }).toArray();
  const catIdsToDelete = catsToDelete.map(c => c._id);
  const catIdStrsToDelete = catIdsToDelete.map(String);

  const lecsToDelete = await db.collection("lectures").find({
    _id: { $nin: engLecIds }
  }).toArray();
  const lecIdsToDelete = lecsToDelete.map(l => l._id);
  const lecIdStrsToDelete = lecIdsToDelete.map(String);

  console.log(`\nIdentified for deletion: ${catsToDelete.length} non-English categories, ${lecsToDelete.length} non-English lectures.`);

  // 3. Delete Non-English Ayats
  const delAyatsRes = await db.collection("ayats").deleteMany({
    $or: [
      { lecture_id: { $in: lecIdsToDelete } },
      { lecture_id: { $in: lecIdStrsToDelete } },
      { language: { $in: ["urdu", "hindi", "hin"] } }
    ]
  });
  console.log(`Deleted non-English ayats: ${delAyatsRes.deletedCount}`);

  // 4. Delete Non-English Lectures
  const delLecsRes = await db.collection("lectures").deleteMany({
    _id: { $in: lecIdsToDelete }
  });
  console.log(`Deleted non-English lectures: ${delLecsRes.deletedCount}`);

  // 5. Delete Non-English Categories
  const delCatsRes = await db.collection("categories").deleteMany({
    _id: { $in: catIdsToDelete }
  });
  console.log(`Deleted non-English categories: ${delCatsRes.deletedCount}`);

  // 6. Verify English data remains intact
  const verifyEngCats = await db.collection("categories").countDocuments({ language: "eng" });
  const verifyEngLecs = await db.collection("lectures").countDocuments({
    $or: [{ language: "eng" }, { category_id_ref: { $in: engCatIds } }]
  });
  const verifyEngAyats = await db.collection("ayats").countDocuments({
    $or: [{ lecture_id: { $in: engLecIds } }, { lecture_id: { $in: engLecIdStrs } }]
  });
  console.log(`\nVerification of English preservation:`);
  console.log(`  Categories: ${verifyEngCats} (Expected: 10)`);
  console.log(`  Lectures:   ${verifyEngLecs} (Expected: 80)`);
  console.log(`  Ayats:      ${verifyEngAyats} (Expected: ${engAyatsCount})`);

  if (verifyEngCats !== 10 || verifyEngLecs !== 80 || verifyEngAyats !== engAyatsCount) {
    throw new Error("Safety check failed: English data was affected! Aborting.");
  }

  // 7. Parse CSV and build Urdu categories and lectures
  console.log("\n=== PARSING URDU CSV FOR FRESH INSERTION ===");
  const content = fs.readFileSync("server/src/data/urdu_lectures.csv", "utf8");
  const lines = content.split(/\r?\n/).filter(l => l.trim().length > 0);
  const rows = lines.slice(1).map(parseCSVLine);

  const categoryMap = new Map();
  for (const cDef of CATEGORY_ORDER) {
    categoryMap.set(cDef.id, {
      category_id: cDef.id,
      category_name: cDef.name,
      language: "urdu",
      source: "IIPC Canada",
      compiler: "Muhammad Shaikh",
      lecturesMap: new Map()
    });
  }

  for (const r of rows) {
    const [lang, catName, lectureTitle, year, season, epNum, epTitle, showUrl, epUrl, pdfLink] = r;
    if (!catName || !lectureTitle) continue;

    const trimmedCat = catName.trim().toLowerCase();
    const cDef = CATEGORY_ORDER.find(c => c.matchNames.some(m => m.toLowerCase() === trimmedCat));
    if (!cDef) continue;

    const catObj = categoryMap.get(cDef.id);
    const trimmedLec = lectureTitle.trim();

    if (!catObj.lecturesMap.has(trimmedLec)) {
      catObj.lecturesMap.set(trimmedLec, {
        lecture_name: [trimmedLec],
        year_delivered: year || "2024",
        language: "urdu",
        seasonsMap: new Map(),
        pdfLink: (pdfLink && pdfLink.trim()) || CANONICAL_PDFS[trimmedLec] || ""
      });
    }

    const lecObj = catObj.lecturesMap.get(trimmedLec);
    if (pdfLink && pdfLink.trim() && !lecObj.pdfLink) {
      lecObj.pdfLink = pdfLink.trim();
    }

    const sName = (season && season.trim()) || "Season 1";
    if (!lecObj.seasonsMap.has(sName)) {
      lecObj.seasonsMap.set(sName, {
        season_name: sName,
        year_delivered: year || "2024",
        episodes: []
      });
    }

    if (epNum || epTitle || epUrl) {
      lecObj.seasonsMap.get(sName).episodes.push({
        episode_number: epNum || "",
        episode_title: epTitle || "",
        episode_url: epUrl || "",
        show_page_url: showUrl || "",
        tags: []
      });
    }
  }

  // 8. Insert new clean Urdu Categories and Lectures
  console.log("\n=== INSERTING CLEAN URDU CATEGORIES & LECTURES ===");
  let insertedCats = 0;
  let insertedLecs = 0;

  for (const cDef of CATEGORY_ORDER) {
    const catData = categoryMap.get(cDef.id);
    const totalLecturesInCat = catData.lecturesMap.size;

    // Create Category document
    const categoryDoc = {
      category_id: catData.category_id,
      category_name: catData.category_name,
      language: "urdu",
      source: "IIPC Canada",
      compiler: "Muhammad Shaikh",
      total_lectures: totalLecturesInCat,
      icon_url: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const catInsertRes = await db.collection("categories").insertOne(categoryDoc);
    const savedCatId = catInsertRes.insertedId;
    insertedCats++;

    console.log(`\nCreated Category [urdu] ${cDef.id}: "${cDef.name}" (_id: ${savedCatId})`);

    let lecIdSeq = 1;
    for (const [title, lData] of catData.lecturesMap.entries()) {
      const allVideoUrls = [];
      const seasonsList = [];

      for (const [sName, sData] of lData.seasonsMap.entries()) {
        seasonsList.push({
          season_name: sName,
          year_delivered: sData.year_delivered,
          episodes: sData.episodes,
          tags: []
        });
        for (const ep of sData.episodes) {
          if (ep.episode_url && !allVideoUrls.includes(ep.episode_url)) {
            allVideoUrls.push(ep.episode_url);
          }
        }
      }

      // PDF formatting
      const finalPdfUrl = lData.pdfLink || CANONICAL_PDFS[title] || "";
      const pdfUrlArray = finalPdfUrl ? [{ title: title, url: finalPdfUrl }] : [];

      const lectureDoc = {
        category_id_ref: savedCatId,
        lecture_id: lecIdSeq++,
        lecture_name: [title],
        language: "urdu",
        year_delivered: lData.year_delivered,
        season: seasonsList[0]?.season_name || "Season 1",
        episode: seasonsList[0]?.episodes[0]?.episode_number || "",
        video_url: allVideoUrls[0] || "",
        video_urls: allVideoUrls,
        youtube_urls: [],
        facebook_urls: [],
        full_lecture_video_url: "",
        seasons: seasonsList,
        episodes: seasonsList[0]?.episodes || [],
        pdf_url: pdfUrlArray,
        pdf_link: finalPdfUrl,
        pdf_booklet_urls: finalPdfUrl ? [finalPdfUrl] : [],
        pdf_title: finalPdfUrl ? title : "",
        icon_url: [],
        total_ayats: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection("lectures").insertOne(lectureDoc);
      insertedLecs++;
      console.log(`  -> Lec ${lectureDoc.lecture_id}: "${title}" (Seasons: ${seasonsList.length}, Videos: ${allVideoUrls.length}, PDF: ${finalPdfUrl || "NONE"})`);
    }
  }

  console.log(`\n=== COMPLETED SUCCESSFULLY ===`);
  console.log(`Inserted ${insertedCats} Urdu categories and ${insertedLecs} Urdu lectures.`);

  // Final database audit
  const finalCats = await db.collection("categories").find({}).sort({ category_id: 1 }).toArray();
  console.log(`\nFinal categories count in MongoDB: ${finalCats.length}`);
  for (const c of finalCats) {
    const lCount = await db.collection("lectures").countDocuments({
      $or: [{ category_id_ref: c._id }, { category_id_ref: String(c._id) }]
    });
    console.log(`  [${c.language}] Cat ${c.category_id}: "${c.category_name}" -> ${lCount} lectures`);
  }

  await mongoose.disconnect();
}

executeWipeAndReimport().catch((err) => {
  console.error("Execution error:", err);
  process.exit(1);
});
