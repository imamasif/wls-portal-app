export const CreateSessionSchema = {
  type: 'object',
  properties: {
    week: { type: 'integer', minimum: 1 },
    topicTitle: { type: 'string', minLength: 3 },
    verseSequences: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          order: { type: 'integer' },
          text: { type: 'string' }
        },
        required: ['order', 'text']
      }
    }
  },
  required: ['week', 'topicTitle'],
  additionalProperties: false
};

export const UpdateSessionSchema = {
  type: 'object',
  properties: {
    week: { type: 'integer', minimum: 1 },
    topicTitle: { type: 'string', minLength: 3 },
    verseSequences: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          order: { type: 'integer' },
          text: { type: 'string' }
        },
        required: ['order', 'text']
      }
    }
  },
  additionalProperties: false
};