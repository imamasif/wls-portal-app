import mongoose from "mongoose";

const canonicalUrduMapping = [
  // =========================================================================
  // Category 101: Apnay Khuda ko pehchano (6ac7e7644f6dc255a8101173)
  // =========================================================================
  {
    catId: "6ac7e7644f6dc255a8101173",
    lectures: [
      {
        lecture_id: 1,
        matchRegex: /Allah Aur Aalihah|Aaliha aur Allah/i,
        names: ["Allah Aur Aalihah", "Aaliha aur Allah - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/allah_illah.pdf",
      },
      {
        lecture_id: 2,
        matchRegex: /Iblees|Shaitaan|Satan/i,
        names: ["Iblees aur Shaitaan", "Iblees / Shaitaan - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/satan_devil.pdf",
      },
    ],
  },

  // =========================================================================
  // Category 102: Chuni hui shakhsiyat (6ac7e7644f6dc255a8101176)
  // =========================================================================
  {
    catId: "6ac7e7644f6dc255a8101176",
    lectures: [
      {
        lecture_id: 1,
        matchRegex: /Ibraheem/i,
        names: ["Ibraheem pbuh Ka Khuwab", "Ibraheem ka khuwab - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/vision_of_ibraheem.pdf",
      },
      {
        lecture_id: 2,
        matchRegex: /Moosa/i,
        names: ["Moosa pbuh Ki Kitab", "Moosa ki Kitab - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/book_of_moses.pdf",
      },
      {
        lecture_id: 3,
        matchRegex: /^Maryam/i,
        names: ["Maryam PBUH", "Maryam pbuh - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/maryam.pdf",
      },
      {
        lecture_id: 4,
        matchRegex: /Essa/i,
        names: ["Essa PBUH", "Essa Ibn-e-Maryam pbuh - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/essa.pdf",
      },
      {
        lecture_id: 5,
        matchRegex: /Mohammad/i,
        names: ["Mohammad PBUH", "Mohammad pbuh - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/mohammad_pbuh.pdf",
      },
      {
        lecture_id: 6,
        matchRegex: /kalam/i,
        names: ["Allah Bashar se kaisay kalam karta hai"],
        pdf: "https://iipccanada.com/urdu_pdf/allah_bashr.pdf",
      },
      {
        lecture_id: 7,
        matchRegex: /wahi/i,
        names: ["Allah Bashr se kaisi wahi karta hai - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/allah_bashar_wahi.pdf",
      },
      {
        lecture_id: 8,
        matchRegex: /Nabi aur Rasool/i,
        names: ["Nabi aur Rasool", "Nabi aur Rasool - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/nabi_rasool.pdf",
      },
      {
        lecture_id: 9,
        matchRegex: /Malka Saba/i,
        names: ["Malka Saba ke Takht", "Malka Saba ka Arsh / Takht - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/malka_saba.pdf",
      },
      {
        lecture_id: 10,
        matchRegex: /Nuh|Nooh|Kashti|Fulk/i,
        names: ["Nuh Ki Kashti", "Nooh A.S ki Fulk - Urdu", "Nuh Ki Kashti - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/fulk_nooh.pdf",
      },
    ],
  },

  // =========================================================================
  // Category 103: Allah ki kitab (6ac7e7644f6dc255a8101179)
  // =========================================================================
  {
    catId: "6ac7e7644f6dc255a8101179",
    lectures: [
      {
        lecture_id: 1,
        matchRegex: /^Al Kitab/i,
        names: ["Al Kitab", "Al-Kitab - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/al_kitab_the_Book.pdf",
      },
      {
        lecture_id: 2,
        matchRegex: /Quran/i,
        names: ["Quran", "Al-Quran - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/al_quran_the_reading.pdf",
      },
      {
        lecture_id: 3,
        matchRegex: /Taurat/i,
        names: ["Taurat Aur Injeel", "Taurat aur Injeel - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/taurat_injeel.pdf",
      },
      {
        lecture_id: 4,
        matchRegex: /Zaboor/i,
        names: ["Zaboor Suhuf Aur Alwah"],
        pdf: "https://iipccanada.com/urdu_pdf/zaboor_suhuf_alwah.pdf",
      },
      {
        lecture_id: 5,
        matchRegex: /Hadees|Hadith/i,
        names: ["Hadees", "Hadith / Event - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/hadees_event.pdf",
      },
      {
        lecture_id: 6,
        matchRegex: /Sunnah/i,
        names: ["Sunnah", "Sunnah Practice - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/sunnatullah_the_practice_of_allah.pdf",
      },
      {
        lecture_id: 7,
        matchRegex: /Hikmat|Wisdom/i,
        names: ["Hikmat", "The Wisdom - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/hikmah_wisdom.pdf",
      },
      {
        lecture_id: 8,
        matchRegex: /Rooh/i,
        names: ["Rooh", "Rooh Spirit Holy Ghost - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/rooh_spirit.pdf",
      },
      {
        lecture_id: 9,
        matchRegex: /Zabanain|Lisan/i,
        names: ["Zabanain"],
        pdf: "https://iipccanada.com/urdu_pdf/lisan_language.pdf",
      },
      {
        lecture_id: 10,
        matchRegex: /Hidayat|Guidance/i,
        names: ["Hidayat", "Guidance - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/hidayah_guidance.pdf",
      },
      {
        lecture_id: 11,
        matchRegex: /Zikr/i,
        names: ["Zikr / Yaad dehani", "Zikr"],
        pdf: "https://iipccanada.com/urdu_pdf/zikr.pdf",
      },
      {
        lecture_id: 12,
        matchRegex: /^Nazil -/i,
        names: ["Nazil - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/nazil.pdf",
      },
      {
        lecture_id: 13,
        matchRegex: /^Wahi -/i,
        names: ["Wahi - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/wahi.pdf",
      },
      {
        lecture_id: 14,
        matchRegex: /Nazil Aur Wahi|Wahi Nazil/i,
        names: ["Nazil Aur Wahi", "Wahi Nazil - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/wahi_nazil.pdf",
      },
    ],
  },

  // =========================================================================
  // Category 104: Apni Pehchan (6ac7e7644f6dc255a810117c)
  // =========================================================================
  {
    catId: "6ac7e7644f6dc255a810117c",
    lectures: [
      {
        lecture_id: 1,
        matchRegex: /^Muslim/i,
        names: ["Muslim", "Muslim - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/muslim.pdf",
      },
      {
        lecture_id: 2,
        matchRegex: /Ahl e Kitab/i,
        names: ["Ahl e Kitab", "Ahl-e-Kitab - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/people_of_the_book.pdf",
      },
      {
        lecture_id: 3,
        matchRegex: /Bani Israeel|Bani Israel/i,
        names: ["Bani Israeel", "Bani Israel - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/children_of_israel.pdf",
      },
      {
        lecture_id: 4,
        matchRegex: /Aulia/i,
        names: ["Aulia Surparast", "Aulia / Protectors - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/aulia.pdf",
      },
      {
        lecture_id: 5,
        matchRegex: /Khalifa/i,
        names: ["Khalifa", "Khalifa / Successor - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/khalifa_successor.pdf",
      },
      {
        lecture_id: 6,
        matchRegex: /Imam/i,
        names: ["Imam", "Imam / Leader - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/imam_leader.pdf",
      },
      {
        lecture_id: 7,
        matchRegex: /Firqay|Sect/i,
        names: ["Firqay", "Sect - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/sect.pdf",
      },
      {
        lecture_id: 8,
        matchRegex: /Munafiq/i,
        names: ["Munafiq", "Munafiq - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/munafiq.pdf",
      },
      {
        lecture_id: 9,
        matchRegex: /Shaheed/i,
        names: ["Shaheed", "Shaheed - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/shaheed.pdf",
      },
      {
        lecture_id: 10,
        matchRegex: /Yahood/i,
        names: ["Yahood Aur Nasara", "Yahood aur Nasara - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/yahood_&_nasara.pdf",
      },
      {
        lecture_id: 11,
        matchRegex: /Jinn/i,
        names: ["Jinn Aur Ins", "Jinn / Ins - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/jinn.pdf",
      },
      {
        lecture_id: 12,
        matchRegex: /Quran Se Apni Pehchan/i,
        names: ["Quran Se Apni Pehchan", "Quran Se Apni Pehchan - Urdu"],
        pdf: "",
      },
    ],
  },

  // =========================================================================
  // Category 105: Gharelo Zindagi (6ac7e7644f6dc255a810117f)
  // =========================================================================
  {
    catId: "6ac7e7644f6dc255a810117f",
    lectures: [
      {
        lecture_id: 1,
        matchRegex: /Hijab/i,
        names: ["Hijab", "Hijab / Veil - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/hijab_veil.pdf",
      },
      {
        lecture_id: 2,
        matchRegex: /Nikah/i,
        names: ["Nikah", "Nikah / Marriage - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/nikah_marriage.pdf",
      },
      {
        lecture_id: 3,
        matchRegex: /Mian Aur Biwi|Husband/i,
        names: ["Mian Aur Biwi Kay Taluqat", "Mian Aur Biwi Kay Taluqat - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/husband_wife_relationship.pdf",
      },
      {
        lecture_id: 4,
        matchRegex: /Fahisha/i,
        names: ["Fahisha", "Fahisha / Obscenity - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/fahishah_obscenity.pdf",
      },
      {
        lecture_id: 5,
        matchRegex: /Talaaq/i,
        names: ["Talaaq", "Talaaq / Divorce - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/talaaq_divorce.pdf",
      },
      {
        lecture_id: 6,
        matchRegex: /Waldain/i,
        names: ["Waldain Aur Aulad key Taluqat", "Waldain aur Aulad key Taluqat - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/parent_children_relationship.pdf",
      },
    ],
  },

  // =========================================================================
  // Category 106: Maal ka istamal (6ac7e7644f6dc255a8101182)
  // =========================================================================
  {
    catId: "6ac7e7644f6dc255a8101182",
    lectures: [
      {
        lecture_id: 1,
        matchRegex: /Sadqa|Zakat/i,
        names: ["Sadqa aur Zakat", "Sadqa aur Zakat - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/sadqa_charity_zakah_justification.pdf",
      },
      {
        lecture_id: 2,
        matchRegex: /Riba|Sood/i,
        names: ["Riba Sood", "Riba / Sood - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/riba_increase.pdf",
      },
      {
        lecture_id: 3,
        matchRegex: /Rizq/i,
        names: ["Rizq", "Rizq - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/rizq.pdf",
      },
      {
        lecture_id: 4,
        matchRegex: /Wirasat|Inheritance/i,
        names: ["Wirasat", "Wirasat / Inheritance - Urdu"],
        pdf: "",
      },
    ],
  },

  // =========================================================================
  // Category 107: Iman ki simt (6ac7e7644f6dc255a8101185)
  // =========================================================================
  {
    catId: "6ac7e7644f6dc255a8101185",
    lectures: [
      {
        lecture_id: 1,
        matchRegex: /^Islam/i,
        names: ["Islam Aur Muslim", "Islam", "Islam - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/islam_to_attain_peace.pdf",
      },
      {
        lecture_id: 2,
        matchRegex: /Ibraheem/i,
        names: ["Ibraheem pbuh Ka Mazhab", "Ibraheem pbuh Ka Mazhab - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/religion_of_abraham.pdf",
      },
      {
        lecture_id: 3,
        matchRegex: /Sirat e Mustaqeem|Straight Path/i,
        names: ["Sirat e Mustaqeem", "Straight Path - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/straight_path.pdf",
      },
      {
        lecture_id: 4,
        matchRegex: /Shafaat/i,
        names: ["Shafaat Sifarish", "Shafaat Sifarish / Intercession - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/shafaat_intercession.pdf",
      },
      {
        lecture_id: 5,
        matchRegex: /Kaaba/i,
        names: ["Kaaba Aur Qibla", "Kaaba aur Qibla - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/kaaba_qibla.pdf",
      },
      {
        lecture_id: 6,
        matchRegex: /Masajid/i,
        names: ["Masajid", "Masajid / Mosque - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/masjid_mosque.pdf",
      },
      {
        lecture_id: 7,
        matchRegex: /Salah|Namaz/i,
        names: ["Salah / Namaz", "Salah / Prayer - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/salah_prayer.pdf",
      },
      {
        lecture_id: 8,
        matchRegex: /Muhtaram/i,
        names: ["Muhtaram Maheeney", "Sacred Months - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/sacred_months.pdf",
      },
      {
        lecture_id: 9,
        matchRegex: /Roza|Saum/i,
        names: ["Roza", "Saum / Fasting - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/saum_fasting.pdf",
      },
      {
        lecture_id: 10,
        matchRegex: /Umrah|Hajj/i,
        names: ["Umrah aur Hajj", "Hajj / Pilgrimage - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/hajj_pilgrimage.pdf",
      },
      {
        lecture_id: 11,
        matchRegex: /Ummul Qura/i,
        names: ["Ummul Qura / Shehron Ki Maa", "Ummul Qura - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/ummul_qura.pdf",
      },
      {
        lecture_id: 12,
        matchRegex: /Tur e Sina|Jabal e Noor/i,
        names: ["Tur e Sina", "Jabal e Noor / Tur e Sina - Urdu", "Mount Sinai"],
        pdf: "https://iipccanada.com/urdu_pdf/jabal_e_noor.pdf",
      },
      {
        lecture_id: 13,
        matchRegex: /Saat aasman|skies/i,
        names: ["Saat aasman, zameen aur samandar", "Saat Aasman Zameen Aur Samandar - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/skies.pdf",
      },
    ],
  },

  // =========================================================================
  // Category 108: Ahkam wali ayat se apny uper Hakomat (6ac7e7644f6dc255a8101188)
  // =========================================================================
  {
    catId: "6ac7e7644f6dc255a8101188",
    lectures: [
      {
        lecture_id: 1,
        matchRegex: /Jihad/i,
        names: ["Jihad / Jad o Jehad", "Jihad Strive - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/jihad_strive.pdf",
      },
      {
        lecture_id: 2,
        matchRegex: /^Qatal/i,
        names: ["Qatal", "Physical Killing - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/physical_killing.pdf",
      },
      {
        lecture_id: 3,
        matchRegex: /Nafsiyati Qatal/i,
        names: ["Nafsiyati Qatal", "Psychological Killing - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/psychological_killing.pdf",
      },
      {
        lecture_id: 4,
        matchRegex: /Dehshat Gardi|Terrorism/i,
        names: ["Dehshat Gardi", "Terrorism - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/terrorism.pdf",
      },
      {
        lecture_id: 5,
        matchRegex: /Jung|War/i,
        names: ["Jung", "Harab / War - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/harab_war.pdf",
      },
      {
        lecture_id: 6,
        matchRegex: /Qisaas/i,
        names: ["Qisaas / Evaz / Badal", "Qisaas / Evaz / Badal - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/qisaas_requital.pdf",
      },
      {
        lecture_id: 7,
        matchRegex: /Nafsiyati Zakhmon/i,
        names: ["Nafsiyati Zakhmon Ki Tasalli", "Consolation of Psychological Hurts - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/consolation_of_psychological_hurts.pdf",
      },
      {
        lecture_id: 8,
        matchRegex: /Ikhlaq|Morality/i,
        names: ["Ikhlaq", "Morality / Akhlaq - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/morality_akhlaq.pdf",
      },
      {
        lecture_id: 9,
        matchRegex: /Bai/i,
        names: ["Bai / Deal", "Bai - Urdu"],
        pdf: "https://iipccanada.com/urdu_pdf/bai.pdf",
      },
      {
        lecture_id: 10,
        matchRegex: /Maut|Death/i,
        names: ["Maut / Death", "Maut - Urdu"],
        pdf: "http://iipccanada.com/urdu_pdf/maut.pdf",
      },
    ],
  },
];

async function run() {
  console.log("=== APPLYING CANONICAL URDU LECTURE ORDER & PDF LINKS ===");
  await mongoose.connect("mongodb://127.0.0.1:27017/wls-portal-db");
  const db = mongoose.connection.db;

  for (const catMapping of canonicalUrduMapping) {
    const catObjectId = new mongoose.Types.ObjectId(catMapping.catId);
    console.log(`\nProcessing Category ${catMapping.catId}...`);

    // Fetch all current lectures in this category
    const currentLecs = await db.collection("lectures").find({
      $or: [
        { category_id_ref: catObjectId },
        { category_id_ref: catMapping.catId },
      ]
    }).toArray();

    console.log(`  Found ${currentLecs.length} existing lectures in database.`);

    const usedLecDocIds = new Set();

    for (const item of catMapping.lectures) {
      // Find matching lecture among currentLecs that has not been mapped yet
      const candidate = currentLecs.find((l) => {
        if (usedLecDocIds.has(String(l._id))) return false;
        const allNamesStr = Array.isArray(l.lecture_name) ? l.lecture_name.join(" ") : String(l.lecture_name || "");
        return item.matchRegex.test(allNamesStr);
      });

      if (!candidate) {
        console.warn(`  [WARNING] No match found for "${item.names[0]}" in category ${catMapping.catId}`);
        continue;
      }

      usedLecDocIds.add(String(candidate._id));

      const defaultTitle = item.names[0];
      const updateData = {
        lecture_id: item.lecture_id,
        lecture_name: item.names,
        language: "urdu",
        pdf_link: item.pdf || "",
        pdf_booklet_urls: item.pdf ? [item.pdf] : [],
        pdf_url: item.pdf ? [{ title: defaultTitle, url: item.pdf }] : [],
      };

      await db.collection("lectures").updateOne(
        { _id: candidate._id },
        { $set: updateData }
      );

      console.log(`  -> [Lec ${item.lecture_id}] Updated "${defaultTitle}" (_id: ${candidate._id}) with PDF: ${item.pdf || "NONE"}`);
    }

    // Clean up any remaining extra duplicate in Cat 107 if present (e.g. duplicate Umrah aur Hajj or Rizq)
    if (catMapping.catId === "6ac7e7644f6dc255a8101185") {
      const extraLecs = currentLecs.filter((l) => !usedLecDocIds.has(String(l._id)));
      for (const extra of extraLecs) {
        const extraNames = Array.isArray(extra.lecture_name) ? extra.lecture_name.join(" ") : String(extra.lecture_name || "");
        console.log(`  -> Found extra unmapped lecture in Cat 107: "${extraNames}" (_id: ${extra._id})`);
        if (/Rizq/i.test(extraNames)) {
          // Reassign Rizq to Category 106 ("Maal ka istamal")
          await db.collection("lectures").updateOne(
            { _id: extra._id },
            { $set: { category_id_ref: new mongoose.Types.ObjectId("6ac7e7644f6dc255a8101182") } }
          );
          console.log(`     Moved misplaced Rizq lecture to Category 106 (Maal ka istamal)`);
        } else if (/Umrah|Hajj/i.test(extraNames) && extra._id.toString() === "6adbfcea8f11cd3dca158316") {
          // It's the empty duplicate Umrah and Hajj lecture
          await db.collection("lectures").deleteOne({ _id: extra._id });
          console.log(`     Removed redundant duplicate Umrah and Hajj lecture`);
        } else if (/Islam Aur Muslim/i.test(extraNames) && extra._id.toString() === "6add79aa8f11cd3dca15831f") {
          // It's the duplicate Islam lecture
          await db.collection("lectures").deleteOne({ _id: extra._id });
          console.log(`     Removed redundant duplicate Islam lecture`);
        }
      }
    }
  }

  // Recalculate total_ayats on all lectures and total_lectures on all categories
  console.log("\nRecalculating stats across all lectures and categories...");
  const allLecs = await db.collection("lectures").find({}).toArray();
  for (const l of allLecs) {
    const aCount = await db.collection("ayats").countDocuments({
      $or: [
        { lecture_id: l._id },
        { lecture_id: String(l._id) },
        ...(mongoose.Types.ObjectId.isValid(l._id) ? [{ lecture_id: new mongoose.Types.ObjectId(l._id) }] : [])
      ]
    });
    await db.collection("lectures").updateOne({ _id: l._id }, { $set: { total_ayats: aCount } });
  }

  const allCats = await db.collection("categories").find({}).toArray();
  for (const c of allCats) {
    const lCount = await db.collection("lectures").countDocuments({
      $or: [
        { category_id_ref: c._id },
        { category_id_ref: String(c._id) },
        ...(mongoose.Types.ObjectId.isValid(c._id) ? [{ category_id_ref: new mongoose.Types.ObjectId(c._id) }] : [])
      ]
    });
    await db.collection("categories").updateOne({ _id: c._id }, { $set: { total_lectures: lCount } });
  }

  console.log("=== FINISHED CANONICAL URDU RE-INDEXING & PDF MAPPING ===");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
