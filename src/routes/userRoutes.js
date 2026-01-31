import express from "express";
import { protectRoute } from "../middleware/protectRoute.js";
import { getMe, updateMe, searchUsers, syncAllUsersFromClerk } from "../controllers/userController.js";

const router = express.Router();

router.get("/me", protectRoute, getMe);
router.put("/me", protectRoute, updateMe);
router.get("/search", protectRoute, searchUsers);
router.post("/sync-from-clerk", protectRoute, syncAllUsersFromClerk);

export default router;
