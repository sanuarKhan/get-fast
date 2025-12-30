import express from "express";
import { protect, restrictTo } from "../middleware/auth.middleware.js";

import { ROLES } from "../constants.js";
import {
  agentLocation,
  publicAgentLocation,
} from "../controllers/agent.controller.js";

const router = express.Router();

router.patch("/location", protect, restrictTo(ROLES.AGENT), agentLocation);

router.get("/:id/location", protect, publicAgentLocation);

export default router;
