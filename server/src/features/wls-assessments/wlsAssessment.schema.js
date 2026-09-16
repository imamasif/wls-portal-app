// src/features/wls-assessments/wlsAssessment.schema.js

export const submitAssessmentSchema = {
  type: 'object',
  properties: {
    sessionId: { type: 'string' },
    userId: { type: 'string' },
    videoUrl: { type: 'string' },
    groupNumber: { type: 'number' }
  },
  required: ['sessionId', 'userId', 'videoUrl'],
  additionalProperties: true
};

export const gradeAssessmentSchema = {
  type: 'object',
  required: ['evaluatorId', 'scores'],
  properties: {
    evaluatorId: { type: 'string' },
    evaluatorName: { type: 'string' },
    feedback: { type: 'string' },
    scores: {
      type: 'object',
      additionalProperties: { type: 'number' } // Allows any numeric score keys
    }
  }
};