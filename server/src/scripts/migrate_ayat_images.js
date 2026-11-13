import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { AyatModel, LectureModel } from "../features/category-lectures/categoryLectures.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

export const AYAT_IMAGE_TARGETS = [
  {
    surah_number: 25,
    ayat_number: 43,
    images: ["/quran/25/43.png"],
    engImages: ["/quran/25/43.png"],
  },
  {
    surah_number: 53,
    ayat_number: 19,
    images: ["/quran/53/019.png"],
    engImages: ["/quran/53/019.png", "/iipc/slides/ayat_53_19_20_eng.png"],
  },
  {
    surah_number: 53,
    ayat_number: 20,
    images: ["/quran/53/020.png"],
    engImages: ["/quran/53/020.png", "/iipc/slides/ayat_53_19_20_eng.png"],
  },
];

export async function runAyatImageMigration(forceUri = null) {
  const uri = forceUri || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/wls-portal-db";

  if (mongoose.connection.readyState === 0) {
    console.log(`[Ayat Migration] Connecting to MongoDB: ${uri}`);
    await mongoose.connect(uri);
  }

  let totalAyatsUpdated = 0;

  for (const target of AYAT_IMAGE_TARGETS) {
    const filter = {
      surah_number: target.surah_number,
      ayat_number: target.ayat_number,
    };

    const updateDoc = {
      $set: {
        imageUrl: target.images,
        imageUrls: target.images,
        ayat_image_eng_url: target.engImages,
        ayat_image_eng_urls: target.engImages,
      },
    };

    const res = await AyatModel.updateMany(filter, updateDoc);
    const count = res.modifiedCount || res.nModified || 0;
    totalAyatsUpdated += count;

    console.log(
      `[Ayat Migration] Surah ${target.surah_number}:${target.ayat_number} -> matched: ${res.matchedCount || res.n || 0}, updated: ${count}`
    );
  }

  // Also check if any lectures have embedded ayat_references arrays containing these verses
  try {
    for (const target of AYAT_IMAGE_TARGETS) {
      await LectureModel.updateMany(
        {
          "ayat_references.surah_number": target.surah_number,
          "ayat_references.ayat_number": target.ayat_number,
        },
        {
          $set: {
            "ayat_references.$[elem].imageUrl": target.images,
            "ayat_references.$[elem].imageUrls": target.images,
            "ayat_references.$[elem].ayat_image_eng_url": target.engImages,
            "ayat_references.$[elem].ayat_image_eng_urls": target.engImages,
          },
        },
        {
          arrayFilters: [
            {
              "elem.surah_number": target.surah_number,
              "elem.ayat_number": target.ayat_number,
            },
          ],
        }
      );
    }
  } catch (lecErr) {
    console.warn("[Ayat Migration] Lecture embedded update notice:", lecErr.message);
  }

  console.log(`[Ayat Migration] Complete! Total Ayat records updated: ${totalAyatsUpdated}`);
  return { totalAyatsUpdated };
}

// Standalone execution: node server/src/scripts/migrate_ayat_images.js
if (
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href.toLowerCase() === import.meta.url.toLowerCase()
) {
  runAyatImageMigration()
    .then(() => {
      console.log("[Ayat Migration] Script completed successfully.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("[Ayat Migration] Error running script:", err);
      process.exit(1);
    });
}
