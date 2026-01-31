import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { createProblem, getProblemById, getProblems, markProblemSolved, getMySolvedProblems } from "../controllers/problemController.js";

const router = express.Router();

// Public endpoint to fetch all coding problems
router.get("/", getProblems);

// Host-only endpoint to create a new problem
router.post("/", protectRoute, createProblem);

// Solved problems endpoints (MUST come before /:id to avoid route conflicts)
router.post("/solved", protectRoute, markProblemSolved);
router.get("/my-solved", protectRoute, getMySolvedProblems);

// Get single problem by id (MUST be last to avoid matching "solved" or "my-solved" as :id)
router.get("/:id", getProblemById);

export default router;
