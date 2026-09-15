import { AssessmentModel } from './assessment.model.js';

export class AssessmentUseCase {
  static async getAllAssessments() {
    return await AssessmentModel.find({})
      .populate('userId', 'name email profilePictureUrl city country')
      .populate('sessionId', 'weekNumber title');
  }

  static async getAssessmentById(id) {
    return await AssessmentModel.findById(id)
      .populate('userId', 'name email profilePictureUrl city country')
      .populate('sessionId', 'weekNumber title');
  }

  static async getUserSubmissions(userId) {
    return await AssessmentModel.find({ userId }).populate('sessionId', 'weekNumber title');
  }

  static async getEvaluatorQueue(evaluatorId) {
    return await AssessmentModel.find({ "evaluations.evaluatorId": evaluatorId })
      .populate('userId', 'name email profilePictureUrl city country')
      .populate('sessionId', 'weekNumber title');
  }

  static async submitVideoLink(dto) {
    return await AssessmentModel.findOneAndUpdate(
      { sessionId: dto.sessionId, userId: dto.userId },
      { submissionUrl: dto.videoUrl, groupNumber: dto.groupNumber, status: 'PENDING' },
      { new: true, upsert: true, runValidators: true }
    );
  }

  static async gradeSubmission(assessmentId, dto) {
    const assessment = await AssessmentModel.findById(assessmentId);
    if (!assessment) return null;

    assessment.evaluations = assessment.evaluations.filter(
      e => e.evaluatorId.toString() !== dto.evaluatorId.toString()
    );
    assessment.evaluations.push(dto);

    let totalObtained = 0;
    const totalPossible = assessment.evaluations.length * 30; // 3 categories * 10 max

    assessment.evaluations.forEach(ev => {
      totalObtained += (ev.scores.presentation + ev.scores.recitation + ev.scores.reflection);
    });

    const percentage = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;
    assessment.finalScore = percentage;
    assessment.conclusionStatus = percentage >= 70 ? 'PASSED' : 'FAILED';
    assessment.status = 'COMPLETED';

    return await assessment.save();
  }
}

export const assessmentUseCase = AssessmentUseCase;