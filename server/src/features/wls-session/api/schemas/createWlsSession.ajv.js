const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });

const createWlsSessionSchema = {
  type: 'object',
  properties: {
    topicName: { type: 'string', minLength: 3 },
    sessionDateTimeToronto: { type: 'string' },
    pdfBookletUrl: { type: 'string' },
    quranVideoUrl: { type: 'string' },
    numberOfGroups: { type: 'integer', minimum: 1, maximum: 100 }
  },
  required: ['topicName', 'sessionDateTimeToronto', 'pdfBookletUrl', 'quranVideoUrl', 'numberOfGroups'],
  additionalProperties: false
};

module.exports = ajv.compile(createWlsSessionSchema);