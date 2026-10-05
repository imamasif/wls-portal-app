// quiz.model.js
import mongoose from "mongoose";
import { QUESTION_TYPE_VALUES } from "../../common/constants/enums.js";

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  questionImage: { type: String },
  questionImageUrl: { type: String },
  imageUrl: { type: String }, // Added to match frontend payload directly
  questionType: {
    type: String,
    enum: QUESTION_TYPE_VALUES,
    required: true,
    default: QUESTION_TYPE_VALUES.SINGLE_SELECT,
  },
  points: { type: Number, default: 5 },
  orderIndex: { type: Number, default: 0 },

  options: [{ type: String }],
  correctAnswers: [{ type: String }],
  sampleAnswer: { type: String },

  textValidation: {
    caseSensitive: { type: Boolean, default: false },
  },

  sequenceItems: [{ type: String }],
  correctSequence: [{ type: String }],
});

const quizSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    createdBy: {
      type: String, // Changed from ObjectId to String to accept "super_user"
      default: "super_user",
      required: false,
    },
    isPublished: { type: Boolean, default: false },
    isActive: { type: Boolean, default: false },
    questions: [questionSchema],
  },
  { timestamps: true },
);

export const QuizModel = mongoose.model("Quiz", quizSchema);
