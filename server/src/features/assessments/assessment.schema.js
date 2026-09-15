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
  properties: {
    evaluatorId: { type: 'string' },
    evaluatorName: { type: 'string' },
    scores: {
      type: 'object',
      properties: {
        presentation: { type: 'number', minimum: 0, maximum: 10 },
        recitation: { type: 'number', minimum: 0, maximum: 10 },
        reflection: { type: 'number', minimum: 0, maximum: 10 }
      },
      required: ['presentation', 'recitation', 'reflection']
    },
    feedback: { type: 'string' }
  },
  required: ['evaluatorId', 'scores'],
  additionalProperties: true
};