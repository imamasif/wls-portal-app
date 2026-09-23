import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  questionType: { type: String, required: true },
  selectedAnswer: { type: mongoose.Schema.Types.Mixed, required: true },
  gradingStatus: {
    type: String,
    enum: ["PENDING", "CORRECT", "SOMEWHAT_CORRECT", "WRONG"],
    default: "PENDING",
  },
  isCorrect: { type: Boolean, default: false },
  awardedPoints: { type: Number, default: 0 },
  instructorFeedback: { type: String, default: "" },
});

const quizSubmissionSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Quiz",
      required: true,
    },
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    answers: [answerSchema],
    totalScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    isFullyGraded: { type: Boolean, default: false },
    submittedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

export const QuizSubmissionModel = mongoose.model(
  "QuizSubmission",
  quizSubmissionSchema,
);
