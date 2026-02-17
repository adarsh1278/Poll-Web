import { Router } from "express";
import * as pollController from "../controllers/poll.controller.js";
import { asyncWrap } from "../middleware/asyncWrap.js";
import { createPollLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/", createPollLimiter, asyncWrap(pollController.create));
router.get("/:id", asyncWrap(pollController.getById));
router.get("/:id/results", asyncWrap(pollController.getResults));

export default router;
