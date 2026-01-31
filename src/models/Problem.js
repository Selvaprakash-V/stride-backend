import mongoose from "mongoose";

const exampleSchema = new mongoose.Schema(
  {
    input: { type: String, required: true },
    output: { type: String, required: true },
    explanation: { type: String },
  },
  { _id: false }
);

const descriptionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    notes: [{ type: String }],
  },
  { _id: false }
);

const problemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true }, // slug, e.g. "two-sum"
    title: { type: String, required: true },
    difficulty: { type: String, required: true }, // e.g. "Easy", "Medium", "Hard"
    category: { type: String, required: true },
    description: { type: descriptionSchema, required: true },
    examples: [exampleSchema],
    constraints: [{ type: String }],
    // language => code / output mappings
    starterCode: { type: mongoose.Schema.Types.Mixed, required: true },
    expectedOutput: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

const Problem = mongoose.model("Problem", problemSchema);

export default Problem;
