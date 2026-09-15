import Ajv from 'ajv';
const ajv = new Ajv({ allErrors: true });

const createWlsSessionSchema = {
  type: 'object',
  properties: {
    topicName: { type: 'string', minLength: 3 },
    sessionDateTimeToronto: { type: 'string' },
    pdfBookletUrl: { type: 'string' },
    quranVideoUrl: { type: 'string' },
    groupAssignments: { type: 'object' }
  },
  required: ['topicName', 'sessionDateTimeToronto'],
  additionalProperties: true
};

export const validateCreateWlsSession = ajv.compile(createWlsSessionSchema);