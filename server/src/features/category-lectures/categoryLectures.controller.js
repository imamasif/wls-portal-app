import express from "express";
import { CategoryLecturesUsecase } from "./categoryLectures.usecase.js";
import { CategoryMapper } from "./categoryLectures.mapper.js";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const data = await CategoryLecturesUsecase.getAllCategoriesData();
    res.status(200).json(CategoryMapper.toResponseList(data));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/meta", async (req, res) => {
  try {
    const meta = await CategoryLecturesUsecase.getMetaCategories();
    res.status(200).json(meta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const savedData = await CategoryLecturesUsecase.insertCategoryData(
      req.body,
    );
    res.status(201).json({
      message:
        "Category document saved successfully across normalized collections!",
      data: CategoryMapper.toResponse(savedData),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
export default router;
