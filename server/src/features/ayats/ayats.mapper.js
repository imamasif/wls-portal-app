// server/src/features/ayats/ayats.mapper.js
import { AyatRes, AyatListRes } from "./ayats.res.js";

export class AyatMapper {
  static toResponse(doc, extra = {}) {
    if (!doc) return null;
    const raw = doc.toObject ? doc.toObject() : doc;
    return new AyatRes({
      ...raw,
      ...extra,
    });
  }

  static toListResponse({ items, total, page, limit, totalPages }) {
    return new AyatListRes({
      items,
      total,
      page,
      limit,
      totalPages,
    });
  }
}
