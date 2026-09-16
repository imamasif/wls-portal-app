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

  // wlsAssessment.usecase.js
static async gradeSubmission(assessmentId, dto) {
  const assessment = await AssessmentModel.findById(assessmentId);
  if (!assessment) return null;

  // Filter out existing evaluations by the same evaluator
  assessment.evaluations = assessment.evaluations.filter(
    e => e.evaluatorId && e.evaluatorId.toString() !== dto.evaluatorId.toString()
  );
  
  assessment.evaluations.push(dto);

  let totalObtained = 0;

  assessment.evaluations.forEach(ev => {
    // Handle both Map and plain Object formats safely with fallback to 0
    const scores = ev.scores instanceof Map ? Object.fromEntries(ev.scores) : (ev.scores || {});
    
    const presentation = Number(scores.presentation) || 0;
    const recitation = Number(scores.recitation) || 0;
    const reflection = Number(scores.reflection) || 0;

    totalObtained += (presentation + recitation + reflection);
  });

  const totalPossible = assessment.evaluations.length * 30; // 3 categories * 10 max
  
  // Guard against NaN by ensuring percentage falls back to 0
  const percentage = (totalPossible > 0 && !isNaN(totalObtained)) 
    ? Math.round((totalObtained / totalPossible) * 100) 
    : 0;

  assessment.finalScore = isNaN(percentage) ? 0 : percentage;
  assessment.conclusionStatus = assessment.finalScore >= 70 ? 'PASSED' : 'FAILED';
  assessment.status = 'COMPLETED';

  return await assessment.save();
}
}

export const assessmentUseCase = AssessmentUseCase;