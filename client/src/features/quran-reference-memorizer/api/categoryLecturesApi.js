// client/src/features/quran/api/categoryLecturesApi.js
export const fetchCategoryLecturesMeta = async () => {
  try {
    const response = await fetch("/api/category-lectures/meta");
    if (!response.ok) throw new Error("Failed to fetch lecture metadata");
    return await response.json();
  } catch (error) {
    console.error("Error fetching category lectures meta:", error);
    return [];
  }
};
