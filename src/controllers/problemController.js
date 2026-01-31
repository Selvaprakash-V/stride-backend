import Problem from "../models/Problem.js";
import SolvedProblem from "../models/SolvedProblem.js";

export async function getProblems(req, res) {
  try {
    const problems = await Problem.find().sort({ title: 1 }).select("-__v");
    res.status(200).json({ problems });
  } catch (error) {
    console.error("Error in getProblems controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getProblemById(req, res) {
  try {
    const { id } = req.params; // slug
    const problem = await Problem.findOne({ id }).select("-__v");

    if (!problem) return res.status(404).json({ message: "Problem not found" });

    res.status(200).json({ problem });
  } catch (error) {
    console.error("Error in getProblemById controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Mark a problem as solved
export async function markProblemSolved(req, res) {
  try {
    const userId = req.user._id;
    const { problem, problemId, difficulty, sessionId, code, language } = req.body;

    console.log("markProblemSolved called:", { userId, problem, difficulty, sessionId });

    if (!problem || !difficulty) {
      return res.status(400).json({ message: "Problem and difficulty are required" });
    }

    // Check if already solved - if so, update the record
    const existingSolved = await SolvedProblem.findOne({ user: userId, problem });

    if (existingSolved) {
      // Update with latest code if provided
      if (code) existingSolved.code = code;
      if (language) existingSolved.language = language;
      existingSolved.solvedAt = new Date();
      await existingSolved.save();
      console.log("Problem already solved, record updated:", existingSolved._id);
      return res.status(200).json({ message: "Problem already solved, record updated", solvedProblem: existingSolved });
    }

    // Create new solved problem record
    const solvedProblem = await SolvedProblem.create({
      user: userId,
      problem,
      problemId: problemId || "",
      difficulty: difficulty.toLowerCase(),
      session: sessionId || null,
      code: code || "",
      language: language || "javascript",
    });

    console.log("New solved problem created:", solvedProblem._id);
    res.status(201).json({ message: "Problem marked as solved", solvedProblem });
  } catch (error) {
    console.error("Error in markProblemSolved controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

// Get solved problems for a user
export async function getMySolvedProblems(req, res) {
  try {
    const userId = req.user._id;

    const solvedProblems = await SolvedProblem.find({ user: userId })
      .sort({ solvedAt: -1 })
      .select("-code -__v"); // Exclude code for list view

    // Count by difficulty
    const stats = {
      total: solvedProblems.length,
      easy: solvedProblems.filter(p => p.difficulty.toLowerCase() === "easy").length,
      medium: solvedProblems.filter(p => p.difficulty.toLowerCase() === "medium").length,
      hard: solvedProblems.filter(p => p.difficulty.toLowerCase() === "hard").length,
    };

    res.status(200).json({ solvedProblems, stats });
  } catch (error) {
    console.error("Error in getMySolvedProblems controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function createProblem(req, res) {
  try {
    const user = req.user; // attached by protectRoute

    if (!user || user.role !== "host") {
      return res.status(403).json({ message: "Only hosts can create problems" });
    }

    const {
      id,
      title,
      difficulty,
      category,
      descriptionText,
      notes,
      examples,
      constraints,
      starterCode,
      expectedOutput,
    } = req.body;

    if (!id || !title || !difficulty || !category || !descriptionText) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const existing = await Problem.findOne({ id });
    if (existing) {
      return res.status(409).json({ message: "Problem with this id already exists" });
    }

    const problem = new Problem({
      id,
      title,
      difficulty,
      category,
      description: {
        text: descriptionText,
        notes: notes || [],
      },
      examples: examples || [],
      constraints: constraints || [],
      starterCode: starterCode || {},
      expectedOutput: expectedOutput || {},
    });

    await problem.save();

    res.status(201).json({ problem });
  } catch (error) {
    console.error("Error in createProblem controller:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
