import Ajv from 'ajv';

const ajv = new Ajv();

const createRuleValidationSchema = {
  type: 'object',
  properties: {
    criterion: { type: 'string', minLength: 1 },
    description: { type: 'string' }
  },
  required: ['criterion'],
  additionalProperties: false
};

export const validateCreateRule = ajv.compile(createRuleValidationSchema);