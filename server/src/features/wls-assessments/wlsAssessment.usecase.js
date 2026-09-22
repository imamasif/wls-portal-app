import mongoose from 'mongoose'; // Make sure mongoose is imported at the top
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

  // UNIFIED GET OR CREATE: Guarantees Student & Admin always point to the same doc
  static async getOrCreateAssessment(sessionId, userId) {
    const sessionObjId = new mongoose.Types.ObjectId(sessionId);
    const userObjId = new mongoose.Types.ObjectId(userId);

    return await AssessmentModel.findOneAndUpdate(
      { sessionId: sessionObjId, userId: userObjId },
      { 
        $setOnInsert: { 
          status: 'PENDING', 
          submissionUrl: '', 
          messages: [], 
          evaluations: [],
          groupNumber: 1
        } 
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    .populate('userId', 'name email profilePictureUrl city country')
    .populate('sessionId', 'weekNumber title');
  }

  static async getUserSubmissions(userId) {
    return await AssessmentModel.find({ userId }).populate('sessionId', 'weekNumber title');
  }

  static async submitVideoLink(dto) {
    const sessionIdObj = new mongoose.Types.ObjectId(dto.sessionId);
    const userIdObj = new mongoose.Types.ObjectId(dto.userId);

    return await AssessmentModel.findOneAndUpdate(
      { sessionId: sessionIdObj, userId: userIdObj },
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