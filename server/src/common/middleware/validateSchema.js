import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true, removeAdditional: true });
addFormats(ajv);

export const validateSchema = (schema) => {
  const validate = ajv.compile(schema);
  return (req, res, next) => {
    const valid = validate(req.body);
    if (!valid) {
      return res.status(400).json({
        message: 'Validation Failed',
        errors: validate.errors.map(err => ({
          field: err.instancePath,
          message: err.message
        }))
      });
    }
    next();
  };
};