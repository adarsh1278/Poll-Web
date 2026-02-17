import * as voteService from "../services/vote.service.js";
import { getClientIP } from "../utils/ip.js";

export const vote = async (req, res) => {
  const { pollId, optionId, fingerprint } = req.body;
  const clientIP = getClientIP(req);
  const result = await voteService.castVote(
    pollId,
    optionId,
    clientIP,
    fingerprint
  );
  res.json({
    status: "success",
    data: result,
  });
};
