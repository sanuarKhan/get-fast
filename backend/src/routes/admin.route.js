import express from "express";
import { getAllUsers } from "../controllers/admin.controller.js";
import { protect, restrictTo } from "../middleware/auth.middleware.js";
import { ROLES } from "../constants.js";

const router = express.Router();

router.get("/users", protect, restrictTo(ROLES.ADMIN), getAllUsers);

export default router;
