import { Router } from "express";
import * as voteController from "../controllers/vote.controller.js";
import { asyncWrap } from "../middleware/asyncWrap.js";
import { voteRateLimiter } from "../middleware/rateLimiter.js";

const router = Router();

router.post("/", voteRateLimiter, asyncWrap(voteController.vote));

export default router;
