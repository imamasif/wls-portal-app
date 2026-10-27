import fs from "fs";
import mongoose from "mongoose";

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

const URDU_CATEGORY_DEFS = [
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

const CANONICAL_PDF_FALLBACKS = {
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
  "Rizq": "https://iipccanada.com/urdu_pdf/rizq.pdf",

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

async function redoFullCleanImport() {
  console.log("=== STEP 1: CONNECT TO DATABASE ===");
  await mongoose.connect("mongodb://127.0.0.1:27017/wls-portal-db");
  const db = mongoose.connection.db;

  // -------------------------------------------------------------
  // PART A: FIX ENGLISH CATEGORIES & LECTURES
  // -------------------------------------------------------------
  console.log("\n=== PART A: FIX ENGLISH CATEGORIES & LECTURES ===");
  const engCat3 = await db.collection("categories").findOne({ category_id: 3, language: "eng" });
  const engCat11 = await db.collection("categories").findOne({ category_id: 11, language: "eng" });

  if (engCat3 && engCat11) {
    const misplacedTitles = [
      "Mohammad Shaikh Journey of Guidance from The Quran",
      "Mohammad Shaikh's Interview by Rehan Allahwala",
      "Mohammad Shaikh Documentary",
      "Alwida e Taqreeb",
      "Muhammad Shaikh per qatilana hamla",
      "Muhammad Shaikh ka Quran se hidayat ka safar",
    ];

    console.log("Moving misplaced Mohammad Shaikh documentary lectures from English Cat 3 to English Cat 11...");
    let lec11Seq = 1;
    for (const title of misplacedTitles) {
      const match = await db.collection("lectures").findOne({
        category_id_ref: engCat3._id,
        lecture_name: title,
      });
      if (match) {
        await db.collection("lectures").updateOne(
          { _id: match._id },
          {
            $set: {
              category_id_ref: engCat11._id,
              lecture_id: lec11Seq++,
            },
          }
        );
        console.log(`  Moved "${title}" -> Cat 11, lecture_id: ${lec11Seq - 1}`);
      }
    }

    // Re-sequence remaining Cat 3 lectures to 1..12
    const remainingCat3 = await db.collection("lectures")
      .find({ category_id_ref: engCat3._id })
      .sort({ lecture_id: 1, _id: 1 })
      .toArray();

    console.log(`Re-sequencing Cat 3 lectures (found: ${remainingCat3.length})...`);
    for (let i = 0; i < remainingCat3.length; i++) {
      await db.collection("lectures").updateOne(
        { _id: remainingCat3[i]._id },
        { $set: { lecture_id: i + 1 } }
      );
    }

    await db.collection("categories").updateOne({ _id: engCat3._id }, { $set: { total_lectures: remainingCat3.length } });
    await db.collection("categories").updateOne({ _id: engCat11._id }, { $set: { total_lectures: lec11Seq - 1 } });
  }

  // Populate missing video_urls / video_url / full_lecture_video_url for English lectures from their seasons
  console.log("\nPopulating video links for all English lectures from their seasons...");
  const allEngLectures = await db.collection("lectures").find({
    category_id_ref: { $in: (await db.collection("categories").find({ language: "eng" }).toArray()).map(c => c._id) }
  }).toArray();

  for (const lec of allEngLectures) {
    const episodes = [];
    if (Array.isArray(lec.seasons)) {
      for (const s of lec.seasons) {
        if (Array.isArray(s.episodes)) {
          episodes.push(...s.episodes);
        }
      }
    }
    const epUrls = episodes.map(e => e.episode_url).filter(Boolean);
    const uniqueVideoUrls = Array.from(new Set([...(lec.video_urls || []), ...epUrls]));
    const firstVideo = uniqueVideoUrls[0] || lec.video_url || "";
    const showPage = episodes.find(e => e.show_page_url)?.show_page_url || "";

    const updates = {};
    if ((!lec.video_urls || lec.video_urls.length === 0) && uniqueVideoUrls.length > 0) {
      updates.video_urls = uniqueVideoUrls;
    }
    if (!lec.video_url && firstVideo) {
      updates.video_url = firstVideo;
    }
    if (!lec.full_lecture_video_url && (showPage || firstVideo)) {
      updates.full_lecture_video_url = showPage || firstVideo;
    }
    if (Object.keys(updates).length > 0) {
      await db.collection("lectures").updateOne({ _id: lec._id }, { $set: updates });
    }
  }

  // -------------------------------------------------------------
  // PART B: PURGE ALL URDU AND HINDI DATA
  // -------------------------------------------------------------
  console.log("\n=== PART B: PURGE ALL URDU AND HINDI DATA ===");
  const engCatDocs = await db.collection("categories").find({ language: "eng" }).toArray();
  const engCatIds = engCatDocs.map(c => c._id);

  const nonEngCats = await db.collection("categories").find({ _id: { $nin: engCatIds } }).toArray();
  const nonEngCatIds = nonEngCats.map(c => c._id);
  const nonEngCatIdStrs = nonEngCatIds.map(String);

  const nonEngLecs = await db.collection("lectures").find({
    $or: [
      { category_id_ref: { $in: nonEngCatIds } },
      { category_id_ref: { $in: nonEngCatIdStrs } },
      { language: { $in: ["urdu", "hindi", "hin"] } },
    ]
  }).toArray();
  const nonEngLecIds = nonEngLecs.map(l => l._id);
  const nonEngLecIdStrs = nonEngLecIds.map(String);

  console.log(`Found ${nonEngCats.length} non-English categories and ${nonEngLecs.length} non-English lectures to delete.`);

  await db.collection("ayats").deleteMany({
    $or: [
      { lecture_id: { $in: nonEngLecIds } },
      { lecture_id: { $in: nonEngLecIdStrs } },
      { language: { $in: ["urdu", "hindi", "hin"] } },
    ]
  });

  await db.collection("lectures").deleteMany({ _id: { $in: nonEngLecIds } });
  await db.collection("categories").deleteMany({ _id: { $in: nonEngCatIds } });

  console.log("Purge complete. Checking remaining English baseline:");
  const remainingEngCats = await db.collection("categories").countDocuments({ language: "eng" });
  const remainingEngLecs = await db.collection("lectures").countDocuments({ category_id_ref: { $in: engCatIds } });
  const remainingEngAyats = await db.collection("ayats").countDocuments({});
  console.log(`  English Categories: ${remainingEngCats} (Expected: 10)`);
  console.log(`  English Lectures:   ${remainingEngLecs} (Expected: 80)`);
  console.log(`  English Ayats:      ${remainingEngAyats} (Expected: 3182)`);

  if (remainingEngCats !== 10 || remainingEngLecs !== 80 || remainingEngAyats !== 3182) {
    throw new Error("Baseline English safety check failed! Aborting.");
  }

  // -------------------------------------------------------------
  // PART C: RE-IMPORT CLEAN URDU DATA FROM CSV
  // -------------------------------------------------------------
  console.log("\n=== PART C: RE-IMPORT CLEAN URDU DATA FROM CSV ===");
  const csvContent = fs.readFileSync("server/src/data/urdu_lectures.csv", "utf8");
  const csvLines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);
  const dataRows = csvLines.slice(1).map(parseCSVLine);

  console.log(`Loaded ${dataRows.length} data rows from server/src/data/urdu_lectures.csv.`);

  // Prepare categories structure
  const urduCategoryMap = new Map();
  for (const cDef of URDU_CATEGORY_DEFS) {
    urduCategoryMap.set(cDef.id, {
      category_id: cDef.id,
      category_name: cDef.name,
      language: "urdu",
      source: "IIPC Canada",
      compiler: "Muhammad Shaikh",
      lecturesMap: new Map(),
    });
  }

  for (const row of dataRows) {
    if (row.length < 3) continue;
    const [lang, catName, lectureTitle, year, season, epNum, epTitle, showUrl, epUrl, pdfLink] = row;
    if (!catName || !lectureTitle) continue;

    const trimmedCat = catName.trim().toLowerCase();
    const cDef = URDU_CATEGORY_DEFS.find(c => c.matchNames.some(m => m.toLowerCase() === trimmedCat));
    if (!cDef) {
      console.warn(`Category not found for row: ${catName}`);
      continue;
    }

    const catObj = urduCategoryMap.get(cDef.id);
    const cleanTitle = lectureTitle.trim();

    if (!catObj.lecturesMap.has(cleanTitle)) {
      catObj.lecturesMap.set(cleanTitle, {
        title: cleanTitle,
        year_delivered: year || "2024",
        pdfLink: (pdfLink && pdfLink.trim().startsWith("http")) ? pdfLink.trim() : "",
        seasonsMap: new Map(),
      });
    }

    const lecObj = catObj.lecturesMap.get(cleanTitle);
    if (pdfLink && pdfLink.trim().startsWith("http") && !lecObj.pdfLink) {
      lecObj.pdfLink = pdfLink.trim();
    }

    const sName = (season && season.trim()) || "Season 1";
    if (!lecObj.seasonsMap.has(sName)) {
      lecObj.seasonsMap.set(sName, {
        season_name: sName,
        year_delivered: year || "2024",
        episodes: [],
      });
    }

    if (epNum || epTitle || epUrl) {
      lecObj.seasonsMap.get(sName).episodes.push({
        episode_number: epNum || "",
        episode_title: epTitle || "",
        episode_url: epUrl || "",
        show_page_url: showUrl || "",
        tags: [],
      });
    }
  }

  let totalUrduCatsInserted = 0;
  let totalUrduLecsInserted = 0;

  for (const cDef of URDU_CATEGORY_DEFS) {
    const catData = urduCategoryMap.get(cDef.id);
    const totalLecs = catData.lecturesMap.size;

    const catDoc = {
      category_id: catData.category_id,
      category_name: catData.category_name,
      language: "urdu",
      source: "IIPC Canada",
      compiler: "Muhammad Shaikh",
      total_lectures: totalLecs,
      icon_url: [],
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const catRes = await db.collection("categories").insertOne(catDoc);
    const savedCatId = catRes.insertedId;
    totalUrduCatsInserted++;

    console.log(`\nInserted Urdu Category ${cDef.id}: "${cDef.name}" (${totalLecs} lectures)`);

    let lecId = 1;
    for (const [title, lData] of catData.lecturesMap.entries()) {
      const allVideoUrls = [];
      const seasonsList = [];

      for (const [sName, sData] of lData.seasonsMap.entries()) {
        seasonsList.push({
          season_name: sName,
          year_delivered: sData.year_delivered,
          episodes: sData.episodes,
          tags: [],
        });
        for (const ep of sData.episodes) {
          if (ep.episode_url && !allVideoUrls.includes(ep.episode_url)) {
            allVideoUrls.push(ep.episode_url);
          }
        }
      }

      // Canonical PDF link from CSV or reliable fallback
      let finalPdfUrl = lData.pdfLink || CANONICAL_PDF_FALLBACKS[title] || "";
      if (title.includes("Saat aasman") && (!finalPdfUrl || !finalPdfUrl.includes(".pdf"))) {
        finalPdfUrl = "https://iipccanada.com/urdu_pdf/skies.pdf";
      }
      if (title === "Rizq" && (!finalPdfUrl || finalPdfUrl.includes("islam_to_attain_peace"))) {
        finalPdfUrl = "https://iipccanada.com/urdu_pdf/rizq.pdf";
      }

      const pdfUrlArr = finalPdfUrl ? [{ title: title, url: finalPdfUrl }] : [];

      const lecDoc = {
        category_id_ref: savedCatId,
        lecture_id: lecId++,
        lecture_name: [title], // Single clean canonical title
        language: "urdu",
        year_delivered: lData.year_delivered,
        season: seasonsList[0]?.season_name || "Season 1",
        episode: seasonsList[0]?.episodes[0]?.episode_number || "",
        video_url: allVideoUrls[0] || "",
        video_urls: allVideoUrls,
        youtube_urls: [],
        facebook_urls: [],
        full_lecture_video_url: (seasonsList[0]?.episodes[0]?.show_page_url) || allVideoUrls[0] || "",
        seasons: seasonsList,
        episodes: seasonsList[0]?.episodes || [],
        pdf_url: pdfUrlArr,
        pdf_link: finalPdfUrl,
        pdf_booklet_urls: finalPdfUrl ? [finalPdfUrl] : [],
        pdf_title: finalPdfUrl ? title : "",
        icon_url: [],
        total_ayats: 0,
        tags: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await db.collection("lectures").insertOne(lecDoc);
      totalUrduLecsInserted++;
      console.log(`  ${lecDoc.lecture_id}. "${title}" (Seasons: ${seasonsList.length}, Eps: ${allVideoUrls.length}, PDF: ${finalPdfUrl || "NONE"})`);
    }
  }

  // -------------------------------------------------------------
  // PART D: FINAL AUDIT
  // -------------------------------------------------------------
  console.log("\n=== PART D: FINAL DATABASE AUDIT ===");
  const allCats = await db.collection("categories").find({}).sort({ language: 1, category_id: 1 }).toArray();
  console.log(`Total categories in DB: ${allCats.length}`);

  for (const c of allCats) {
    const lecs = await db.collection("lectures").find({ category_id_ref: c._id }).sort({ lecture_id: 1 }).toArray();
    console.log(`[${c.language.toUpperCase()}] Category ${c.category_id}: "${c.category_name}" (${lecs.length} lectures)`);
    // verify no duplicate IDs
    const ids = lecs.map(l => l.lecture_id);
    const hasDup = ids.some((id, idx) => ids.indexOf(id) !== idx);
    if (hasDup) {
      console.error(`  ERROR: DUPLICATE LECTURE IDS FOUND:`, ids);
    }
  }

  await mongoose.disconnect();
  console.log("\n=== ALL COMPLETE AND VERIFIED ===");
}

redoFullCleanImport().catch((err) => {
  console.error("FATAL ERROR:", err);
  process.exit(1);
});
