import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mapping = [
  ["Rehbania Terrorism","Terrorism - English"],
  ["The Strive","Al-Jihad / The Strive - English"],
  ["Forbidden Months","The Forbidden Months - English"],
  ["Qisas Requital Compensation","Qisaas / Requital - English"],
  ["Consolation of Psychological Hurts","Consolation of Psychological Hurts - English"],
  ["Mount Sinai","Tur e Sina"],
  ["Harab War","The War - English"],
  ["Saum Fasting","The Fasting - English"],
  ["Umrah and Hajj","Umrah and Hajj - English"],
  ["Psychological Killing","Psychological Killing - English"],
  ["Salah Prayer","Salah / The Prayer - English"],
  ["Physical Killing","Physical Killing - English"],
  ["Mohammad Shaikh Journey of Guidance from The Quran","Mohammad Shaikh Journey of Guidance - English from The Quran"],
  ["Mohammad Shaikh's Interview by Rehan Allahwala","Mohammad Shaikh's Interview by Rehan Allahwala"],
  ["Mohammad Shaikh Documentary","Mohammad Shaikh Documentary"],
  ["Muhammad Shaikh Casually Speaking with Americans","Muhammad Shaikh Casually Speaking with Americans"],
  ["Muhammad Shaikh v/s Zaid Shakir Symposium","Muhammad Shaikh v/s Zaid Shakir Symposium"],
  ["Muhammad Shaikh Discussion With IDCI BANGLADESHI","Muhammad Shaikh Discussion With IDCI BANGLADESHI"],
  ["Muhammad Shaikh v/s Arabs Speakers","Muhammad Shaikh v/s Arabs Speakers"],
  ["Muhammad Shaikh Discussion With Somali Imams","Muhammad Shaikh Discussion With Somali Imams"],
  ["Discussion Yemini Arabs And Muhammad Shaikh","Discussion Yemini Arabs And Muhammad Shaikh"],
  ["Muhammad Shaikh Debates with Pastor Jeffery Wright","Muhammad Shaikh Debates with Pastor Jeffery Wright"],
  ["Muhammad Shaikh Interactive Session with Canadian Youth","Muhammad Shaikh Interactive Session with Canadian Youth"],
  ["Muhammad Shaikh Encounters With Ahmadiyya Muslims","Muhammad Shaikh Encounters With Ahmadiyya Muslims"],
  ["Muhammad Shaikh v/s Christian Missionary","Muhammad Shaikh v/s Christian Missionary"],
  ["Muhammad Shaikh v/s Joseph Cohen","Muhammad Shaikh v/s Joseph Cohen"],
  ["Muhammad Shaikh Discussion At Cruise Ship Turkey","Muhammad Shaikh Discussion At Cruise Ship Turkey"],
  ["Gods And Allah","Gods & Allah - English"],
  ["Satan / Devil","Devil / Satan - English"],
  ["Is Mary pbuh the only parent of Jesus pbuh","Is Mary (pbuh) the only parent of Jesus Christ (pbuh)? - English"],
  ["The Vision of Abraham pbuh","The Vision of Ibraheem pbuh - English"],
  ["Prophecies of Jesus pbuh about his life and death","Prophecies of Jesus (pbuh) about his life and death - English"],
  ["Mary pbuh","Mary pbuh - English"],
  ["Muhammad (pbuh)","Mohammad pbuh - English"],
  ["The Book Of Moses pbuh","The Book of Moses pbuh - English"],
  ["Jesus pbuh","Jesus / Christ pbuh - English"],
  ["The Wisdom","The Wisdom - English"],
  ["Torah and Gospel","Torah & Gospel - English"],
  ["The Book","The Book - English"],
  ["Is Quran the Book of God?","Is The Quran Word of Allah/God? - English"],
  ["Languages","The Languages - English"],
  ["Al","Psalms - English"],
  ["Sunnah Practice","Sunnah / Practice - English"],
  ["Guidance","Guidance - English"],
  ["Zaboor Psalms","Psalms - English"],
  ["Book of Allah","Book of Allah - English"],
  ["Hadith Event Narration","Hadith / Event - English"],
  ["Rooh Spirit Holy Ghost","Holy Ghost - English"],
  ["Muslim Submitter","Muslim / Submitter - English"],
  ["Aulia Protectors","Aulia / Protectors - English"],
  ["People of The Book","People of The Book - English"],
  ["Lenient And Helpers","Jews and Christians - English"],
  ["Book and People of The Book","People of The Book - English"],
  ["Khalifa Successor","Khalifa / Successor - English"],
  ["Imam Leader","Imam / Leader - English"],
  ["Shia Sects","Sect - English"],
  ["Children Of Israeel","Children of Israel - English"],
  ["Hijab Veil and Fahisha Obscenity","Hijab Veil and Fahisha Obscenity"],
  ["Nikah Marriage","Marriage - English"],
  ["Hijab Veil","Hijab / Veil - English"],
  ["Talaaq Divorce","Divorce - English"],
  ["Husband and Wife Relationship","Husband And Wife Relationship - English"],
  ["Fahisha Obscenity","Obscenity - English"],
  ["Parent and Children Relationship","Parent & Children Relationship - English"],
  ["Riba Interest","The Interest - English"],
  ["Zakat Justification and Sadaqah Charity","Charity - English"],
  ["Kabah and Direction of Belief","Kabah and Direction of Belief - English"],
  ["Sirat e Mustaqeem Upright Straight Path","Upright / Straight Path - English"],
  ["Islam and Muslim","Islam and Muslim"],
  ["Mosques Masajid","Mosques / Masajid - English"],
  ["Islam Peace","Islam - English"],
  ["Shafaat Intercession","Shafaat / Intercession - English"],
  ["Religion of Abraham pbuh","Religion of Abraham pbuh - English"],
  ["Morality","Akhlaq / Morality - English"],
  ["Nafsiyati Qatal","Nafsiyati Qatal - Urdu"],
  ["Nafsiyati Zakhmon Ki Tasalli","Nafsiyati Zakhmon Ki Tasalli - Urdu"],
  ["Nuh Ki Kashti","Nooh A.S ki Fulk - Urdu"],
  ["Qatal","Qatal - Urdu"],
  ["Dehshat Gardi","Rehbaniya / Dehshat Gardi - Urdu"],
  ["Qisaas / Evaz / Badal","Qisaas / Evaz / Badal - Urdu"],
  ["Jinn Aur Ins","Jinn - Urdu"],
  ["Malka Saba ke Takht","Malka Saba ka Arsh / Takht - Urdu"],
  ["Alwida e Taqreeb","Alwida e Taqreeb"],
  ["Britian Main Musalmano Kay Saath Aik Nishist","Britian Main Musalmano Kay Saath Aik Nishist"],
  ["Saat aasman, zameen aur samandar","Saat aasman, zameen aur samandar - Urdu"],
  ["Muhammad Shaikh Response Does God Exist?","Muhammad Shaikh Response Does God Exist?"],
  ["Muhammad Shaikh per qatilana hamla","Muhammad Shaikh per qatilana hamla"],
  ["Muhammad Shaikh ka Quran se hidayat ka safar","Muhammad Shaikh ka Quran se hidayat ka safar"],
  ["Debate: Muhammad Shaikh vs Mufti Abdul Baqi","Debate: Muhammad Shaikh vs Mufti Abdul Baqi"],
  ["Muhammad Shaikh v/s Journalist","Muhammad Shaikh v/s Journalist"],
  ["Muhammad Shaikh ka Perveziyon se Mukalma","Muhammad Shaikh ka Perveziyon se Mukalma"],
  ["Muhammad Shaikh v/s Alima Naila","Muhammad Shaikh v/s Alima Naila"],
  ["Quran Ke Muktalif Mozuaat Per Ghuftago Hyde Park UK","Quran Ke Muktalif Mozuaat Per Ghuftago Hyde Park UK"],
  ["Muhammad Shaikh v/s Ismaili Doctor","Muhammad Shaikh v/s Ismaili Doctor"],
  ["Muhammad Shaikh v/s Murabbi Ansar Raza Ahmedi","Muhammad Shaikh v/s Murabbi Ansar Raza Ahmedi"],
  ["Muhammad Shaikh v/s Ghamidi Followers","Muhammad Shaikh v/s Ghamidi Followers"],
  ["Canada Kay Musalmano Se Mukalma","Canada Kay Musalmano Se Mukalma"],
  ["Allah Aur Aalihah","Aaliha aur Allah - Urdu"],
  ["Iblees aur Shaitaan","Iblees / Shaitaan - Urdu"],
  ["Essa PBUH","Essa Ibn-e-Maryam pbuh - Urdu"],
  ["Nabi aur Rasool","Nabi aur Rasool - Urdu"],
  ["Maryam PBUH","Mary pbuh - English"],
  ["Moosa pbuh Ki Kitab","Moosa ki Kitab - Urdu"],
  ["Ibraheem pbuh Ka Khuwab","Ibraheem ka khuwab - Urdu"],
  ["Allah Bashar se kaisay kalam karta hai","Allah Bashr se kaisi kalam karta hai - Urdu"],
  ["Mohammad PBUH","Mohammad pbuh - English"],
  ["Zaboor Suhuf Aur Alwah","Zaboor - Urdu"],
  ["Nazil Aur Wahi","Wahi Nazil - Urdu"],
  ["Rooh","Rooh - Urdu"],
  ["Zabanain","Zabanain - Urdu"],
  ["Hidayat","Hidayat - Urdu"],
  ["Al Kitab","Al-Kitab - Urdu"],
  ["Hikmat","Al-Hikmah - Urdu"],
  ["Hadees","Hadees - Urdu"],
  ["Quran","Al-Quran - Urdu"],
  ["Taurat Aur Injeel","Taurat aur Injeel - Urdu"],
  ["Sunnah","Sunnat - Urdu"],
  ["Zikr / Yaad dehani","Zikr - Urdu"],
  ["Ahl e Kitab","Ahl-e-Kitab - Urdu"],
  ["Muslim","Muslim - Urdu"],
  ["Yahood Aur Nasara","Yahood aur Nasara - Urdu"],
  ["Aulia Surparast","Aulia - Urdu"],
  ["Bani Israeel","Bani Israel - Urdu"],
  ["Khalifa","Khalifa - Urdu"],
  ["Quran Se Apni Pehchan","Quran Se Apni Pehchan"],
  ["Imam","Imam - Urdu"],
  ["Hijab","Hijab / Veil - English"],
  ["Nikah","Nikah - Urdu"],
  ["Talaaq","Talaq - Urdu"],
  ["Mian Aur Biwi Kay Taluqat","Mian aur Biwi kay taluqat - Urdu"],
  ["Waldain Aur Aulad key Taluqat","Waldain aur bachon kay taluqat - Urdu"],
  ["Fahisha","Fahisha - Urdu"],
  ["Riba Sood","Riba - Urdu"],
  ["Sadqa aur Zakat","Sadqa aur Zakat - Urdu"],
  ["Roza","Saum / Roza - Urdu"],
  ["Kaaba Aur Qibla","Kabah aur Qiblah - Urdu"],
  ["Salah / Namaz","Salah / Namaz - Urdu"],
  ["Shafaat Sifarish","Shafaat - Urdu"],
  ["Umrah aur Hajj","Umrah and Hajj - English"],
  ["Ummul Qura / Shehron Ki Maa","Umm-ul-Qura / Shehron ki Maa - Urdu"],
  ["Muhtaram Maheeney","Motharam Mahinay - Urdu"],
  ["Tur e Sina","Tur e Sina"],
  ["Masajid","Masajid - Urdu"],
  ["Sirat e Mustaqeem","Sirat-e-Mustaqeem - Urdu"],
  ["Ibraheem pbuh Ka Mazhab","Ibraheem pbuh ka mazhab - Urdu"],
  ["Jung","Jang - Urdu"],
  ["Jihad / Jad o Jehad","Al-Jihad / The Strive - English"],
  ["Ikhlaq","Akhlaq / Morality - English"]
];

export async function runLectureMigration() {
  const Lecture = mongoose.models.Lecture || mongoose.model('Lecture', new mongoose.Schema({}, { strict: false }));

  // Quick check: if no string lecture_names exist and multiple names already exist, skip
  const stringLecture = await Lecture.findOne({ lecture_name: { $type: "string" } });
  const hasMultiple = await Lecture.findOne({ "lecture_name.1": { $exists: true } });

  if (!stringLecture && hasMultiple) {
    return;
  }

  console.log('[Migration] Ensuring all lecture_names are array of strings and Column A aliases are applied...');
  const allLectures = await Lecture.find({});

  let stringToArrayCount = 0;
  for (const doc of allLectures) {
    if (typeof doc.lecture_name === 'string') {
      doc.lecture_name = [doc.lecture_name.trim()];
      await Lecture.updateOne({ _id: doc._id }, { $set: { lecture_name: doc.lecture_name } });
      stringToArrayCount++;
    } else if (!Array.isArray(doc.lecture_name)) {
      doc.lecture_name = [];
      await Lecture.updateOne({ _id: doc._id }, { $set: { lecture_name: doc.lecture_name } });
    }
  }

  let updatedCount = 0;
  for (const [colA, colB] of mapping) {
    const aTrimmed = colA.trim();

    const matchingDocs = await Lecture.find({
      $or: [
        { lecture_name: { $regex: new RegExp(`^${escapeRegex(colB.trim())}$`, 'i') } },
        { lecture_name: colB.trim() },
        { lecture_name: { $elemMatch: { $regex: new RegExp(`^${escapeRegex(colB.trim())}$`, 'i') } } }
      ]
    });

    if (matchingDocs.length === 0) {
      if (colB.includes("Journey of Guidance")) {
        const fallbackDocs = await Lecture.find({
          lecture_name: { $regex: /Journey of Guidance/i }
        });
        for (const doc of fallbackDocs) {
          const names = Array.isArray(doc.lecture_name) ? doc.lecture_name : [doc.lecture_name];
          if (!names.some(n => n.toLowerCase() === aTrimmed.toLowerCase())) {
            names.push(aTrimmed);
            await Lecture.updateOne({ _id: doc._id }, { $set: { lecture_name: names } });
            updatedCount++;
          }
        }
      }
      continue;
    }

    for (const doc of matchingDocs) {
      const names = Array.isArray(doc.lecture_name) ? doc.lecture_name : [doc.lecture_name];
      if (!names.some(n => n.toLowerCase() === aTrimmed.toLowerCase())) {
        names.push(aTrimmed);
        await Lecture.updateOne({ _id: doc._id }, { $set: { lecture_name: names } });
        updatedCount++;
      }
    }
  }

  console.log(`[Migration] Lecture migration finished. Updated ${updatedCount} documents with aliases.`);
}

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

// Standalone runner
if (import.meta.url === `file://${process.argv[1]?.replace(/\\/g, '/')}`) {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/wls-portal-db';
  mongoose.connect(uri)
    .then(() => runLectureMigration())
    .then(() => mongoose.disconnect())
    .catch((err) => {
      console.error('Migration error:', err);
      process.exit(1);
    });
}
