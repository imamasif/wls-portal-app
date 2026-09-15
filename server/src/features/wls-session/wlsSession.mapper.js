import { WlsSessionResDto } from './wlsSession.res.js';

export const WlsSessionMapper = {
  toResponse(doc) {
    if (!doc) return null;
    return new WlsSessionResDto(doc);
  },
  toResponseList(docs = []) {
    return docs.map((doc) => this.toResponse(doc));
  }
};