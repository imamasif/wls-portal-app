import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI || "mongodb://127.0.0.1:27017/wls-portal-db";

export async function runPdfAndIconMigration() {
  const isDirectRun = !mongoose.connection.readyState;
  if (isDirectRun) {
    await mongoose.connect(MONGO_URI);
    console.log("[Migration] Connected to MongoDB");
  }

  const Lecture =
    mongoose.models.Lecture ||
    mongoose.model("Lecture", new mongoose.Schema({}, { strict: false }));
  const Category =
    mongoose.models.Category ||
    mongoose.model("Category", new mongoose.Schema({}, { strict: false }));

  console.log("[Migration] Running PDF and icon_url normalization...");

  // 1. Normalize Categories
  const categories = await Category.find({});
  let catUpdated = 0;
  for (const cat of categories) {
    const rawIcon = Array.isArray(cat.icon_url)
      ? cat.icon_url.filter(Boolean)
      : typeof cat.icon_url === "string" && cat.icon_url.trim()
      ? [cat.icon_url.trim()]
      : [];

    if (!Array.isArray(cat.icon_url) || cat.icon_url.length !== rawIcon.length) {
      await Category.updateOne(
        { _id: cat._id },
        { $set: { icon_url: rawIcon } }
      );
      catUpdated++;
    }
  }
  console.log(`[Migration] Categories processed. Updated: ${catUpdated}`);

  // 2. Normalize Lectures
  const lectures = await Lecture.find({});
  let lecUpdated = 0;
  for (const lec of lectures) {
    const rawPdf = Array.isArray(lec.pdf_url)
      ? lec.pdf_url.filter(Boolean)
      : typeof lec.pdf_url === "string" && lec.pdf_url.trim()
      ? [lec.pdf_url.trim()]
      : Array.isArray(lec.pdf_booklet_urls) && lec.pdf_booklet_urls.length > 0
      ? lec.pdf_booklet_urls.filter(Boolean)
      : typeof lec.pdf_link === "string" && lec.pdf_link.trim()
      ? [lec.pdf_link.trim()]
      : [];

    const rawIcon = Array.isArray(lec.icon_url)
      ? lec.icon_url.filter(Boolean)
      : typeof lec.icon_url === "string" && lec.icon_url.trim()
      ? [lec.icon_url.trim()]
      : [];

    const title = lec.title || lec.pdf_title || "";

    const updateSet = {
      pdf_url: rawPdf,
      icon_url: rawIcon,
      title: title,
    };

    const updateUnset = {};
    if ("pdf_link" in lec.toObject()) updateUnset.pdf_link = "";
    if ("pdf_booklet_urls" in lec.toObject()) updateUnset.pdf_booklet_urls = "";
    if ("pdf_title" in lec.toObject()) updateUnset.pdf_title = "";

    const updateOp = { $set: updateSet };
    if (Object.keys(updateUnset).length > 0) {
      updateOp.$unset = updateUnset;
    }

    await Lecture.updateOne({ _id: lec._id }, updateOp);
    lecUpdated++;
  }
  console.log(`[Migration] Lectures processed. Updated: ${lecUpdated}`);

  if (isDirectRun) {
    await mongoose.disconnect();
    console.log("[Migration] Disconnected from MongoDB");
  }
}

if (process.argv[1] && process.argv[1].includes("migrate_pdf_icon_urls")) {
  runPdfAndIconMigration()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("[Migration] Error:", err);
      process.exit(1);
    });
}
