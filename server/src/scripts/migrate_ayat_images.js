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
    "surah_number": 2,
    "ayat_number": 23,
    "images": [
      "/quran/02/23.png"
    ],
    "engImages": [
      "/quran/02/23.png"
    ]
  },
  {
    "surah_number": 2,
    "ayat_number": 24,
    "images": [
      "/quran/02/24.png"
    ],
    "engImages": [
      "/quran/02/24.png"
    ]
  },
  {
    "surah_number": 2,
    "ayat_number": 148,
    "images": [
      "/quran/02/148.png"
    ],
    "engImages": [
      "/quran/02/148.png"
    ]
  },
  {
    "surah_number": 2,
    "ayat_number": 200,
    "images": [
      "/quran/02/200.png"
    ],
    "engImages": [
      "/quran/02/200.png"
    ]
  },
  {
    "surah_number": 2,
    "ayat_number": 255,
    "images": [
      "/quran/02/255.png"
    ],
    "engImages": [
      "/quran/02/255.png"
    ]
  },
  {
    "surah_number": 3,
    "ayat_number": 31,
    "images": [
      "/quran/03/31.png"
    ],
    "engImages": [
      "/quran/03/31.png"
    ]
  },
  {
    "surah_number": 3,
    "ayat_number": 32,
    "images": [
      "/quran/03/32.png"
    ],
    "engImages": [
      "/quran/03/32.png"
    ]
  },
  {
    "surah_number": 4,
    "ayat_number": 59,
    "images": [
      "/quran/04/59.png"
    ],
    "engImages": [
      "/quran/04/59.png"
    ]
  },
  {
    "surah_number": 5,
    "ayat_number": 44,
    "images": [
      "/quran/05/44.png"
    ],
    "engImages": [
      "/quran/05/44.png"
    ]
  },
  {
    "surah_number": 6,
    "ayat_number": 19,
    "images": [
      "/quran/06/19.png"
    ],
    "engImages": [
      "/quran/06/19.png"
    ]
  },
  {
    "surah_number": 6,
    "ayat_number": 74,
    "images": [
      "/quran/06/74.png"
    ],
    "engImages": [
      "/quran/06/74.png"
    ]
  },
  {
    "surah_number": 6,
    "ayat_number": 103,
    "images": [
      "/quran/06/103.png"
    ],
    "engImages": [
      "/quran/06/103.png"
    ]
  },
  {
    "surah_number": 6,
    "ayat_number": 104,
    "images": [
      "/quran/06/104.png"
    ],
    "engImages": [
      "/quran/06/104.png"
    ]
  },
  {
    "surah_number": 7,
    "ayat_number": 180,
    "images": [
      "/quran/07/180.png"
    ],
    "engImages": [
      "/quran/07/180.png"
    ]
  },
  {
    "surah_number": 9,
    "ayat_number": 24,
    "images": [
      "/quran/09/24.png"
    ],
    "engImages": [
      "/quran/09/24.png"
    ]
  },
  {
    "surah_number": 9,
    "ayat_number": 111,
    "images": [
      "/quran/09/111.png"
    ],
    "engImages": [
      "/quran/09/111.png"
    ]
  },
  {
    "surah_number": 14,
    "ayat_number": 35,
    "images": [
      "/quran/14/35.png"
    ],
    "engImages": [
      "/quran/14/35.png"
    ]
  },
  {
    "surah_number": 14,
    "ayat_number": 36,
    "images": [
      "/quran/14/36.png"
    ],
    "engImages": [
      "/quran/14/36.png"
    ]
  },
  {
    "surah_number": 14,
    "ayat_number": 41,
    "images": [
      "/quran/14/41.png"
    ],
    "engImages": [
      "/quran/14/41.png"
    ]
  },
  {
    "surah_number": 15,
    "ayat_number": 9,
    "images": [
      "/quran/15/9.png"
    ],
    "engImages": [
      "/quran/15/9.png"
    ]
  },
  {
    "surah_number": 21,
    "ayat_number": 30,
    "images": [
      "/quran/21/30.png"
    ],
    "engImages": [
      "/quran/21/30.png"
    ]
  },
  {
    "surah_number": 21,
    "ayat_number": 57,
    "images": [
      "/quran/21/57.png"
    ],
    "engImages": [
      "/quran/21/57.png"
    ]
  },
  {
    "surah_number": 21,
    "ayat_number": 58,
    "images": [
      "/quran/21/58.png"
    ],
    "engImages": [
      "/quran/21/58.png"
    ]
  },
  {
    "surah_number": 21,
    "ayat_number": 59,
    "images": [
      "/quran/21/59.png"
    ],
    "engImages": [
      "/quran/21/59.png"
    ]
  },
  {
    "surah_number": 21,
    "ayat_number": 60,
    "images": [
      "/quran/21/60.png"
    ],
    "engImages": [
      "/quran/21/60.png"
    ]
  },
  {
    "surah_number": 21,
    "ayat_number": 61,
    "images": [
      "/quran/21/61.png"
    ],
    "engImages": [
      "/quran/21/61.png"
    ]
  },
  {
    "surah_number": 21,
    "ayat_number": 62,
    "images": [
      "/quran/21/62.png"
    ],
    "engImages": [
      "/quran/21/62.png"
    ]
  },
  {
    "surah_number": 21,
    "ayat_number": 63,
    "images": [
      "/quran/21/63.png"
    ],
    "engImages": [
      "/quran/21/63.png"
    ]
  },
  {
    "surah_number": 21,
    "ayat_number": 64,
    "images": [
      "/quran/21/64.png"
    ],
    "engImages": [
      "/quran/21/64.png"
    ]
  },
  {
    "surah_number": 21,
    "ayat_number": 65,
    "images": [
      "/quran/21/65.png"
    ],
    "engImages": [
      "/quran/21/65.png"
    ]
  },
  {
    "surah_number": 21,
    "ayat_number": 66,
    "images": [
      "/quran/21/66.png"
    ],
    "engImages": [
      "/quran/21/66.png"
    ]
  },
  {
    "surah_number": 21,
    "ayat_number": 67,
    "images": [
      "/quran/21/67.png"
    ],
    "engImages": [
      "/quran/21/67.png"
    ]
  },
  {
    "surah_number": 22,
    "ayat_number": 5,
    "images": [
      "/quran/22/05.png"
    ],
    "engImages": [
      "/quran/22/05.png"
    ]
  },
  {
    "surah_number": 25,
    "ayat_number": 43,
    "images": [
      "/quran/25/043.png"
    ],
    "engImages": [
      "/quran/25/043.png"
    ]
  },
  {
    "surah_number": 29,
    "ayat_number": 25,
    "images": [
      "/quran/29/25.png"
    ],
    "engImages": [
      "/quran/29/25.png"
    ]
  },
  {
    "surah_number": 30,
    "ayat_number": 22,
    "images": [
      "/quran/30/22.png"
    ],
    "engImages": [
      "/quran/30/22.png"
    ]
  },
  {
    "surah_number": 37,
    "ayat_number": 91,
    "images": [
      "/quran/37/91.png"
    ],
    "engImages": [
      "/quran/37/91.png"
    ]
  },
  {
    "surah_number": 37,
    "ayat_number": 92,
    "images": [
      "/quran/37/92.png"
    ],
    "engImages": [
      "/quran/37/92.png"
    ]
  },
  {
    "surah_number": 37,
    "ayat_number": 93,
    "images": [
      "/quran/37/93.png"
    ],
    "engImages": [
      "/quran/37/93.png"
    ]
  },
  {
    "surah_number": 37,
    "ayat_number": 95,
    "images": [
      "/quran/37/95.png"
    ],
    "engImages": [
      "/quran/37/95.png"
    ]
  },
  {
    "surah_number": 37,
    "ayat_number": 125,
    "images": [
      "/quran/37/125.png"
    ],
    "engImages": [
      "/quran/37/125.png"
    ]
  },
  {
    "surah_number": 38,
    "ayat_number": 5,
    "images": [
      "/quran/38/05.png"
    ],
    "engImages": [
      "/quran/38/05.png"
    ]
  },
  {
    "surah_number": 38,
    "ayat_number": 6,
    "images": [
      "/quran/38/06.png"
    ],
    "engImages": [
      "/quran/38/06.png"
    ]
  },
  {
    "surah_number": 38,
    "ayat_number": 7,
    "images": [
      "/quran/38/07.png"
    ],
    "engImages": [
      "/quran/38/07.png"
    ]
  },
  {
    "surah_number": 42,
    "ayat_number": 51,
    "images": [
      "/quran/42/51.png"
    ],
    "engImages": [
      "/quran/42/51.png"
    ]
  },
  {
    "surah_number": 42,
    "ayat_number": 52,
    "images": [
      "/quran/42/52.png"
    ],
    "engImages": [
      "/quran/42/52.png"
    ]
  },
  {
    "surah_number": 53,
    "ayat_number": 19,
    "images": [
      "/quran/53/019.png"
    ],
    "engImages": [
      "/quran/53/019.png"
    ]
  },
  {
    "surah_number": 53,
    "ayat_number": 20,
    "images": [
      "/quran/53/020.png"
    ],
    "engImages": [
      "/quran/53/020.png"
    ]
  },
  {
    "surah_number": 53,
    "ayat_number": 21,
    "images": [
      "/quran/53/21.png"
    ],
    "engImages": [
      "/quran/53/21.png"
    ]
  },
  {
    "surah_number": 53,
    "ayat_number": 22,
    "images": [
      "/quran/53/22.png"
    ],
    "engImages": [
      "/quran/53/22.png"
    ]
  },
  {
    "surah_number": 53,
    "ayat_number": 23,
    "images": [
      "/quran/53/23.png"
    ],
    "engImages": [
      "/quran/53/23.png"
    ]
  },
  {
    "surah_number": 59,
    "ayat_number": 22,
    "images": [
      "/quran/59/22.png"
    ],
    "engImages": [
      "/quran/59/22.png"
    ]
  },
  {
    "surah_number": 59,
    "ayat_number": 23,
    "images": [
      "/quran/59/23.png"
    ],
    "engImages": [
      "/quran/59/23.png"
    ]
  },
  {
    "surah_number": 59,
    "ayat_number": 24,
    "images": [
      "/quran/59/24.png"
    ],
    "engImages": [
      "/quran/59/24.png"
    ]
  },
  {
    "surah_number": 61,
    "ayat_number": 5,
    "images": [
      "/quran/61/05.png"
    ],
    "engImages": [
      "/quran/61/05.png"
    ]
  },
  {
    "surah_number": 61,
    "ayat_number": 6,
    "images": [
      "/quran/61/06.png"
    ],
    "engImages": [
      "/quran/61/06.png"
    ]
  },
  {
    "surah_number": 71,
    "ayat_number": 22,
    "images": [
      "/quran/71/22.png"
    ],
    "engImages": [
      "/quran/71/22.png"
    ]
  },
  {
    "surah_number": 71,
    "ayat_number": 23,
    "images": [
      "/quran/71/23.png"
    ],
    "engImages": [
      "/quran/71/23.png"
    ]
  }
];

export async function runAyatImageMigration(forceUri = null) {
  const uri = forceUri || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/wls-portal-db";

  if (mongoose.connection.readyState === 0) {
    console.log(`[Ayat Migration] Connecting to MongoDB: ${uri}`);
    await mongoose.connect(uri);
  }

  let totalAyatsUpdated = 0;
  let totalAyatsMatched = 0;

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
        ayat_image_urdu_url: [],
        ayat_image_urdu_urls: [],
        ayat_image_hindi_url: [],
        ayat_image_hindi_urls: [],
      },
    };

    const res = await AyatModel.updateMany(filter, updateDoc);
    const count = res.modifiedCount || res.nModified || 0;
    const matched = res.matchedCount || res.n || 0;
    totalAyatsUpdated += count;
    totalAyatsMatched += matched;

    if (matched > 0) {
      console.log(
        `[Ayat Migration] Surah ${target.surah_number}:${target.ayat_number} -> matched: ${matched}, updated: ${count}`
      );
    }
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
            "ayat_references.$[elem].ayat_image_urdu_url": [],
            "ayat_references.$[elem].ayat_image_urdu_urls": [],
            "ayat_references.$[elem].ayat_image_hindi_url": [],
            "ayat_references.$[elem].ayat_image_hindi_urls": [],
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

  console.log(
    `[Ayat Migration] Complete! Total matched in DB: ${totalAyatsMatched}, total updated: ${totalAyatsUpdated}`
  );
  return { totalAyatsMatched, totalAyatsUpdated };
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
