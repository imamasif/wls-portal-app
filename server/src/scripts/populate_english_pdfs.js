import mongoose from "mongoose";

const englishPdfMap = [
  // Family Life (6ac7e7644f6dc255a810117e)
  { catId: "6ac7e7644f6dc255a810117e", lecId: 1, pdf: "https://iipccanada.com/english_pdf/hijab_veil.pdf" },
  { catId: "6ac7e7644f6dc255a810117e", lecId: 2, pdf: "https://iipccanada.com/english_pdf/nikah_marriage.pdf" },

  // Direction of Belief (6ac7e7644f6dc255a8101184)
  { catId: "6ac7e7644f6dc255a8101184", lecId: 11, pdf: "https://iipccanada.com/english_pdf/hajj_pilgrimage.pdf" },

  // Govern ourselves... (6ac7e7644f6dc255a8101187)
  { catId: "6ac7e7644f6dc255a8101187", lecId: 1, pdf: "https://iipccanada.com/english_pdf/jihad_strive.pdf" },
  { catId: "6ac7e7644f6dc255a8101187", lecId: 2, pdf: "https://iipccanada.com/english_pdf/physical_killing.pdf" },
  { catId: "6ac7e7644f6dc255a8101187", lecId: 3, pdf: "https://iipccanada.com/english_pdf/psychological_killing.pdf" },
  { catId: "6ac7e7644f6dc255a8101187", lecId: 4, pdf: "https://iipccanada.com/english_pdf/terrorism.pdf" },
  { catId: "6ac7e7644f6dc255a8101187", lecId: 5, pdf: "https://iipccanada.com/english_pdf/harab_war.pdf" },
  { catId: "6ac7e7644f6dc255a8101187", lecId: 6, pdf: "https://iipccanada.com/english_pdf/qisaas_requital.pdf" },
  { catId: "6ac7e7644f6dc255a8101187", lecId: 7, pdf: "https://iipccanada.com/english_pdf/consolation_of_psychological_hurts.pdf" },
  { catId: "6ac7e7644f6dc255a8101187", lecId: 8, pdf: "https://iipccanada.com/english_pdf/morality_akhlaq.pdf" },
  { catId: "6ac7e7644f6dc255a8101187", lecId: 9, pdf: "https://iipccanada.com/english_pdf/maut.pdf" },

  // Book of Allah (6ac7e7644f6dc255a8101178)
  { catId: "6ac7e7644f6dc255a8101178", lecId: 1, nameMatch: "The Book", pdf: "https://iipccanada.com/english_pdf/al_kitab_the_Book.pdf" },
  { catId: "6ac7e7644f6dc255a8101178", lecId: 2, nameMatch: "Reading", pdf: "https://iipccanada.com/english_pdf/al_quran_the_reading.pdf" },
  { catId: "6ac7e7644f6dc255a8101178", lecId: 5, nameMatch: "Torah", pdf: "https://iipccanada.com/english_pdf/taurat_injeel.pdf" },
  { catId: "6ac7e7644f6dc255a8101178", lecId: 6, nameMatch: "Psalms", pdf: "https://iipccanada.com/english_pdf/zaboor_suhuf_alwah.pdf" },
  { catId: "6ac7e7644f6dc255a8101178", lecId: 7, nameMatch: "Hadith", pdf: "https://iipccanada.com/english_pdf/hadees_event.pdf" },
  { catId: "6ac7e7644f6dc255a8101178", lecId: 8, nameMatch: "Sunnah", pdf: "https://iipccanada.com/english_pdf/sunnatullah_the_practice_of_allah.pdf" },
  { catId: "6ac7e7644f6dc255a8101178", lecId: 9, nameMatch: "Wisdom", pdf: "https://iipccanada.com/english_pdf/hikmah_wisdom.pdf" },
  { catId: "6ac7e7644f6dc255a8101178", lecId: 10, nameMatch: "Ghost", pdf: "https://iipccanada.com/english_pdf/rooh_spirit.pdf" },
  { catId: "6ac7e7644f6dc255a8101178", lecId: 11, nameMatch: "Languages", pdf: "https://iipccanada.com/english_pdf/lisan_language.pdf" },
  { catId: "6ac7e7644f6dc255a8101178", lecId: 12, nameMatch: "Guidance", pdf: "https://iipccanada.com/english_pdf/hidayah_guidance.pdf" },

  // Know Yourself (6ac7e7644f6dc255a810117b)
  { catId: "6ac7e7644f6dc255a810117b", lecId: 1, nameMatch: "Muslim", pdf: "https://iipccanada.com/english_pdf/muslim.pdf" },
  { catId: "6ac7e7644f6dc255a810117b", lecId: 2, nameMatch: "People", pdf: "https://iipccanada.com/english_pdf/people_of_the_book.pdf" },
  { catId: "6ac7e7644f6dc255a810117b", lecId: 3, nameMatch: "Children", pdf: "https://iipccanada.com/english_pdf/children_of_israel.pdf" },
  { catId: "6ac7e7644f6dc255a810117b", lecId: 4, nameMatch: "Aulia", pdf: "https://iipccanada.com/english_pdf/aulia.pdf" },
  { catId: "6ac7e7644f6dc255a810117b", lecId: 5, nameMatch: "Khalifa", pdf: "https://iipccanada.com/english_pdf/khalifa_successor.pdf" },
  { catId: "6ac7e7644f6dc255a810117b", lecId: 6, nameMatch: "Imam", pdf: "https://iipccanada.com/english_pdf/imam_leader.pdf" },
  { catId: "6ac7e7644f6dc255a810117b", lecId: 7, nameMatch: "Sect", pdf: "https://iipccanada.com/english_pdf/sect.pdf" },
  { catId: "6ac7e7644f6dc255a810117b", lecId: 9, nameMatch: "Jews", pdf: "https://iipccanada.com/english_pdf/yahood_&_nasara.pdf" },
];

async function run() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wls-portal-db");
  const db = mongoose.connection.db;

  console.log("=== POPULATING ENGLISH LECTURES WITH VERIFIED PDF URLS ===");

  for (const m of englishPdfMap) {
    const filter = {
      $or: [
        { category_id_ref: m.catId },
        { category_id_ref: new mongoose.Types.ObjectId(m.catId) }
      ],
      lecture_id: m.lecId,
    };
    if (m.nameMatch) {
      filter.lecture_name = { $regex: new RegExp(m.nameMatch, "i") };
    }

    const doc = await db.collection("lectures").findOne(filter);
    if (doc) {
      const title = doc.pdf_title || doc.lecture_name?.[0] || "Open PDF Booklet";
      await db.collection("lectures").updateOne(
        { _id: doc._id },
        {
          $set: {
            pdf_link: m.pdf,
            pdf_booklet_urls: [m.pdf],
            pdf_url: [{ title, url: m.pdf }],
          },
        }
      );
      console.log(`Updated lecture "${doc.lecture_name?.[0]}" (lec ${m.lecId}) -> ${m.pdf}`);
    } else {
      console.warn(`Could not find lecture for cat ${m.catId}, lec ${m.lecId}`);
    }
  }

  await mongoose.disconnect();
}

run().catch(console.error);
