// quiz.schema.js
import Ajv from "ajv";
import { QUESTION_TYPE_VALUES } from "../../common/constants/enums.js";

const ajv = new Ajv({ allErrors: true, allowUnionTypes: true });

const createQuizSchema = {
  type: "object",
  properties: {
    title: { type: "string", minLength: 3 },
    description: { type: "string" },
    createdBy: { type: "string" },
    isActive: { type: "boolean" },
    questions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          questionText: { type: "string", minLength: 1 },
          questionType: {
            enum: QUESTION_TYPE_VALUES, // Uses the exact shared enum array
          },
          imageUrl: { type: "string" },
          options: { type: "array", items: { type: "string" } },
          correctAnswers: { type: "array", items: { type: "string" } },
          sequenceItems: { type: "array", items: { type: "string" } },
          correctSequence: { type: "array", items: { type: "string" } },
          points: { type: "number", minimum: 1 },
        },
        required: ["questionText", "questionType"],
      },
    },
  },
  required: ["title", "createdBy", "questions"],
  additionalProperties: true,
};

export const validateCreateQuiz = ajv.compile(createQuizSchema);
