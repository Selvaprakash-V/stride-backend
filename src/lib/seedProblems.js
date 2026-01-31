import Problem from "../models/Problem.js";
import { PROBLEMS } from "../data/problems.js";

export async function ensureProblemsSeeded() {
  try {
    const count = await Problem.estimatedDocumentCount();
    if (count > 0) return; // already seeded

    await Problem.insertMany(PROBLEMS);
    console.log("✅ Seeded problems collection");
  } catch (error) {
    console.error("Error seeding problems:", error);
  }
}
