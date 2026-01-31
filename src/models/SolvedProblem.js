import mongoose from "mongoose";

const solvedProblemSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    problem: {
      type: String, // problem title or id
      required: true,
    },
    problemId: {
      type: String, // problem slug id
      default: "",
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard", "Easy", "Medium", "Hard"],
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },
    code: {
      type: String, // the solution code
      default: "",
    },
    language: {
      type: String,
      default: "javascript",
    },
    solvedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index to prevent duplicate entries for the same user-problem combination
solvedProblemSchema.index({ user: 1, problem: 1 }, { unique: true });

const SolvedProblem = mongoose.model("SolvedProblem", solvedProblemSchema);

export default SolvedProblem;
