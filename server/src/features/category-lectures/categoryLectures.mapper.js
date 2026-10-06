export class CategoryMapper {
  static toResponse(doc) {
    return {
      id: doc._id,
      source: doc.source,
      compiler: doc.compiler,
      language: doc.language,
      category_id: doc.category_id,
      category_name: doc.category_name,
      total_lectures:
        doc.total_lectures || (doc.lectures ? doc.lectures.length : 0),
      lectures: (doc.lectures || []).map((l) => ({
        lecture_id: l.lecture_id,
        lecture_name: l.lecture_name,
        language: l.language,
        year_delivered: l.year_delivered,
        total_ayats:
          l.total_ayats || (l.ayat_references ? l.ayat_references.length : 0),
        ayat_references: l.ayat_references || [],
      })),
    };
  }

  static toResponseList(docs) {
    return docs.map((doc) => CategoryMapper.toResponse(doc));
  }
}
