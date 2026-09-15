import { WlsSessionModel } from './wlsSession.model.js';
import { WlsSessionMapper } from './wlsSession.mapper.js';

export class WlsSessionUseCase {
  async getAllSessions() {
    const docs = await WlsSessionModel.find().sort({ createdAt: -1 });
    return WlsSessionMapper.toResponseList(docs);
  }

  async createSession(dto) {
    const created = await WlsSessionModel.create(dto);
    return WlsSessionMapper.toResponse(created);
  }

  async deleteSession(id) {
    await WlsSessionModel.findByIdAndDelete(id);
    return { success: true };
  }
}