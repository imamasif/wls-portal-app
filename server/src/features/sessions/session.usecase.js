import { SessionModel } from './session.model.js';

export class SessionUseCase {
  static async createSession(dto) {
    return await SessionModel.create(dto);
  }

  static async getAllSessions() {
    return await SessionModel.find();
  }

  static async getSessionById(id) {
    return await SessionModel.findById(id);
  }

  static async updateSession(id, dto) {
    return await SessionModel.findByIdAndUpdate(id, dto, { new: true });
  }

  static async deleteSession(id) {
    return await SessionModel.findByIdAndDelete(id);
  }
}

export const sessionUseCase = SessionUseCase;