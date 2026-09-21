import { AssessmentModel } from './wlsAssessment.model.js';

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
      e => e.evaluatorId && e.evaluatorId.toString() !== dto.evaluatorId.toString()
    );
    
    assessment.evaluations.push({
      evaluatorId: dto.evaluatorId,
      evaluatorName: dto.evaluatorName,
      scores: dto.scores,
      feedback: dto.feedback
    });

    let totalObtained = 0;
    let totalPossible = 0;

    assessment.evaluations.forEach(ev => {
      const scores = ev.scores instanceof Map ? Object.fromEntries(ev.scores) : (ev.scores || {});
      Object.values(scores).forEach(val => {
        totalObtained += Number(val) || 0;
        totalPossible += 10;
      });
    });

    const percentage = totalPossible > 0 ? Math.round((totalObtained / totalPossible) * 100) : 0;

    assessment.finalScore = percentage;
    assessment.conclusionStatus = assessment.finalScore >= 70 ? 'PASSED' : 'FAILED';
    assessment.status = dto.isDraft ? 'REVIEWED' : 'COMPLETED';

    return await assessment.save();
  }

  static async markAsCompleted(assessmentId) {
    return await AssessmentModel.findByIdAndUpdate(
      assessmentId,
      { status: 'SUBMITTED', completedAt: new Date() },
      { new: true }
    );
  }

  // 4. Add assessment-specific message handler
  static async addMessage(assessmentId, dto) {
    const assessment = await AssessmentModel.findById(assessmentId);
    if (!assessment) return null;

    assessment.messages.push({
      senderId: dto.senderId,
      senderName: dto.senderName,
      senderRole: dto.senderRole,
      text: dto.text,
      timestamp: new Date()
    });

    return await assessment.save();
  }
}

export const assessmentUseCase = AssessmentUseCase;