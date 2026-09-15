export { AssessmentModel } from './wlsAssessment.model.js';
export { AssessmentMapper } from './wlsAssessment.mapper.js';
export { assessmentUseCase } from './wlsAssessment.usecase.js';
export { submitAssessmentSchema, gradeAssessmentSchema } from './wlsAssessment.schema.js';
export { default as assessmentController } from './wlsAssessment.controller.js';

// Add default export for server router mounting
import assessmentController from './wlsAssessment.controller.js';
export default assessmentController;