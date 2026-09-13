import { AssessmentModel } from './data/assessment.model.js';

export class AssessmentRepository {
  async findAll() {
    return await AssessmentModel.find({})
      .populate('userId', 'name email profilePictureUrl city country')
      .populate('evaluatorId', 'name email')
      .populate('sessionId', 'weekNumber title');
  }

  async findById(id) {
    return await AssessmentModel.findById(id)
      .populate('userId', 'name email profilePictureUrl city country')
      .populate('evaluatorId', 'name email')
      .populate('sessionId', 'weekNumber title');
  }

  async findByUserId(userId) {
    return await AssessmentModel.find({ userId }).populate('sessionId', 'weekNumber title');
  }

  async findByEvaluatorId(evaluatorId) {
    return await AssessmentModel.find({ evaluatorId })
      .populate('userId', 'name email profilePictureUrl city country')
      .populate('sessionId', 'weekNumber title');
  }

  async upsertSubmission(sessionId, userId, videoUrl) {
    return await AssessmentModel.findOneAndUpdate(
      { sessionId, userId },
      { videoUrl },
      { new: true, upsert: true, runValidators: true }
    );
  }

  async submitGrade(id, evaluatorId, marks, feedbackComments) {
    return await AssessmentModel.findByIdAndUpdate(
      id,
      { evaluatorId, marks, feedbackComments },
      { new: true, runValidators: true }
    );
  }
}

export class AssessmentUseCase {
  constructor(assessmentRepository) {
    this.assessmentRepository = assessmentRepository;
  }

  async getAllAssessments() {
    return await this.assessmentRepository.findAll();
  }

  async getAssessmentById(id) {
    return await this.assessmentRepository.findById(id);
  }

  async getUserSubmissions(userId) {
    return await this.assessmentRepository.findByUserId(userId);
  }

  async getEvaluatorQueue(evaluatorId) {
    return await this.assessmentRepository.findByEvaluatorId(evaluatorId);
  }

  async submitVideoLink(sessionId, userId, videoUrl) {
    return await this.assessmentRepository.upsertSubmission(sessionId, userId, videoUrl);
  }

  async gradeSubmission(assessmentId, evaluatorId, marks, feedbackComments) {
    return await this.assessmentRepository.submitGrade(assessmentId, evaluatorId, marks, feedbackComments);
  }
}

const assessmentRepository = new AssessmentRepository();
const assessmentUseCase = new AssessmentUseCase(assessmentRepository);

export {
  AssessmentModel,
  assessmentRepository,
  assessmentUseCase
};