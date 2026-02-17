import mongoose from "mongoose";
import Poll from "../models/poll.model.js";
import Option from "../models/option.model.js";
import Vote from "../models/vote.model.js";
import { hashValue } from "../utils/hash.js";
import {
  ValidationError,
  NotFoundError,
  GoneError,
  ForbiddenError,
} from "../utils/errors.js";

const validateVoteInput = (pollId, optionId, fingerprint) => {
  if (!pollId || typeof pollId !== "string") {
    throw new ValidationError("Valid pollId is required.");
  }
  if (!optionId || !mongoose.Types.ObjectId.isValid(optionId)) {
    throw new ValidationError("Valid optionId is required.");
  }
  if (!fingerprint || typeof fingerprint !== "string") {
    throw new ValidationError("Fingerprint is required.");
  }
};

export const castVote = async (pollId, optionId, clientIP, fingerprint) => {
  validateVoteInput(pollId, optionId, fingerprint);

  const poll = await Poll.findById(pollId).lean();
  if (!poll) throw new NotFoundError("Poll not found.");
  if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) {
    throw new GoneError("This poll has expired.");
  }

  const option = await Option.findOne({ _id: optionId, pollId }).lean();
  if (!option) throw new ValidationError("Invalid option for this poll.");

  const hashedIP = clientIP ? hashValue(clientIP) : undefined;
  const fingerprintHash = hashValue(fingerprint);

  try {
    await Vote.create({
      pollId,
      optionId,
      ...(hashedIP && { hashedIP }),
      fingerprintHash,
    });
  } catch (err) {
    if (err.code === 11000) {
      throw new ForbiddenError("You have already voted on this poll.");
    }
    throw err;
  }

  await Option.updateOne({ _id: optionId }, { $inc: { voteCount: 1 } });
  await Poll.updateOne({ _id: pollId }, { $inc: { totalVotes: 1 } });

  const options = await Option.find({ pollId }).lean();
  const updatedPoll = await Poll.findById(pollId).lean();

  return {
    pollId: updatedPoll._id,
    question: updatedPoll.question,
    totalVotes: updatedPoll.totalVotes,
    expiresAt: updatedPoll.expiresAt,
    options: options.map((o) => ({
      _id: o._id,
      text: o.text,
      voteCount: o.voteCount,
    })),
  };
};
