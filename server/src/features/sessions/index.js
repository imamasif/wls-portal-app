import { SessionModel } from './data/session.model.js';
import { SessionMapper } from './domain/session.mapper.js';
import { CreateSessionSchema, UpdateSessionSchema } from './dto/session.schema.js';

// 1. Repository Layer
export class SessionRepository {
  async findAll() {
    return await SessionModel.find({}).sort({ weekNumber: 1 });
  }

  async findById(id) {
    return await SessionModel.findById(id);
  }

  async create(data) {
    return await SessionModel.create(data);
  }

  async update(id, data) {
    return await SessionModel.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  }

  async delete(id) {
    return await SessionModel.findByIdAndDelete(id);
  }
}

// 2. Use Case Layer
export class SessionUseCase {
  constructor(sessionRepository) {
    this.sessionRepository = sessionRepository;
  }

  async createSession(dto) {
    return await this.sessionRepository.create(dto);
  }

  async getAllSessions() {
    return await this.sessionRepository.findAll();
  }

  async getSessionById(id) {
    return await this.sessionRepository.findById(id);
  }

  async updateSession(id, dto) {
    return await this.sessionRepository.update(id, dto);
  }

  async deleteSession(id) {
    return await this.sessionRepository.delete(id);
  }
}

// 3. Inject Dependencies and Export
const sessionRepository = new SessionRepository();
const sessionUseCase = new SessionUseCase(sessionRepository);

export {
  SessionModel,
  SessionMapper,
  CreateSessionSchema,
  UpdateSessionSchema,
  sessionRepository,
  sessionUseCase
};