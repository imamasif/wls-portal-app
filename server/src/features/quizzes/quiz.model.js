// quiz.model.js
import mongoose from "mongoose";
import { QUESTION_TYPE_VALUES } from "../../common/constants/enums.js";

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  questionImage: { type: String }, // Optional snapshot or image URL
  questionType: {
    type: String,
    enum: QUESTION_TYPE_VALUES,
    required: true,
    default: QUESTION_TYPE_VALUES.SINGLE_SELECT,
  },
  points: { type: Number, default: 5 },
  orderIndex: { type: Number, default: 0 },

  // Choice-Based (Single, Multiple, True/False)
  options: [{ type: String }],
  correctAnswers: [{ type: String }],

  // Text Validation Rules
  textValidation: {
    caseSensitive: { type: Boolean, default: false },
  },

  // Sequence & Ordering Questions
  sequenceItems: [{ type: String }],
  correctSequence: [{ type: String }], // The correct ordered array of strings
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    isPublished: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    questions: [questionSchema],
  },
  { timestamps: true },
);

export const QuizModel = mongoose.model("Quiz", quizSchema);
