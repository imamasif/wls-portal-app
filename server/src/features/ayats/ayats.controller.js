// server/src/features/ayats/ayats.controller.js
import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { AyatsUsecase } from "./ayats.usecase.js";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const slidesUploadDir = path.resolve(__dirname, "../../../../client/public/iipc/slides");
if (!fs.existsSync(slidesUploadDir)) {
  fs.mkdirSync(slidesUploadDir, { recursive: true });
}

const slideStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, slidesUploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".png";
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, "_");
    cb(null, `slide_${Date.now()}_${base}${ext}`);
  },
});

const slideUpload = multer({
  storage: slideStorage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed."));
    }
  },
});

/**
 * POST /api/ayats/upload-image
 * Upload slide image file and return the public URL.
 */
router.post("/upload-image", slideUpload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file provided." });
    }
    const publicUrl = `/iipc/slides/${req.file.filename}`;
    res.status(200).json({
      message: "Image uploaded successfully",
      url: publicUrl,
      filename: req.file.filename,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/ayats
 * List ayats with pagination, text search, and category/lecture/surah filters.
 */
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      categoryId = "",
      lectureId = "",
      surahNumber,
      ayatNumber,
    } = req.query;

    const result = await AyatsUsecase.getAyatsList({
      page,
      limit,
      search,
      categoryId,
      lectureId,
      surahNumber,
      ayatNumber,
    });

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ayats/references
 * Reverse lookup: Find all places where a specific verse is referenced across all lectures and categories.
 */
router.get("/references", async (req, res) => {
  try {
    const { surah_number, ayat_number } = req.query;
    if (!surah_number || !ayat_number) {
      return res.status(400).json({
        error: "surah_number and ayat_number query parameters are required",
      });
    }

    const data = await AyatsUsecase.getVerseReferences(surah_number, ayat_number);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ayats/:id
 * Get single Ayat record details.
 */
router.get("/:id", async (req, res) => {
  try {
    const item = await AyatsUsecase.getAyatById(req.params.id);
    if (!item) {
      return res.status(404).json({ error: "Ayat record not found" });
    }
    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/ayats
 * Create a new Ayat record.
 */
router.post("/", async (req, res) => {
  try {
    const created = await AyatsUsecase.createAyat(req.body);
    res.status(201).json({
      message: "Ayat reference created successfully",
      data: created,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PUT /api/ayats/:id or PATCH /api/ayats/:id
 * Update/Patch an Ayat record.
 */
const handleUpdate = async (req, res) => {
  try {
    const updated = await AyatsUsecase.updateAyat(req.params.id, req.body);
    res.status(200).json({
      message: "Ayat reference updated successfully",
      data: updated,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

router.put("/:id", handleUpdate);
router.patch("/:id", handleUpdate);

/**
 * DELETE /api/ayats/:id
 * Delete an Ayat record.
 */
router.delete("/:id", async (req, res) => {
  try {
    const result = await AyatsUsecase.deleteAyat(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
