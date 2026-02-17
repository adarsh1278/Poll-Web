import Poll from "../models/poll.model.js";
import Option from "../models/option.model.js";
import { sanitizeString, sanitizeOptions } from "../utils/sanitize.js";
import { ValidationError, NotFoundError, GoneError } from "../utils/errors.js";

const validatePollInput = (question, options) => {
  if (!question || typeof question !== "string") {
    throw new ValidationError("Question is required.");
  }
  if (question.length > 200) {
    throw new ValidationError("Question must be 200 characters or less.");
  }
  if (!Array.isArray(options) || options.length < 2) {
    throw new ValidationError("At least 2 options are required.");
  }
  if (options.length > 10) {
    throw new ValidationError("Maximum 10 options allowed.");
  }

  const normalized = options.map((o) => o.toLowerCase());
  const unique = new Set(normalized);
  if (unique.size !== normalized.length) {
    throw new ValidationError("Duplicate options are not allowed.");
  }
};

export const createPoll = async (rawQuestion, rawOptions, expiresAt) => {
  const question = sanitizeString(rawQuestion);
  const options = sanitizeOptions(rawOptions);
  validatePollInput(question, options);

  if (expiresAt) {
    const expDate = new Date(expiresAt);
    if (isNaN(expDate.getTime()) || expDate <= new Date()) {
      throw new ValidationError("Expiration date must be in the future.");
    }
  }

  const poll = await Poll.create({
    question,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
  });

  const optionDocs = await Option.insertMany(
    options.map((text) => ({ pollId: poll._id, text }))
  );

  return { poll, options: optionDocs };
};

export const getPollById = async (pollId) => {
  const poll = await Poll.findById(pollId).lean();
  if (!poll) throw new NotFoundError("Poll not found.");

  const options = await Option.find({ pollId }).lean();
  return { poll, options };
};

export const assertPollActive = (poll) => {
  if (poll.expiresAt && new Date(poll.expiresAt) < new Date()) {
    throw new GoneError("This poll has expired.");
  }
};

export const getPollResults = async (pollId) => {
  const poll = await Poll.findById(pollId).lean();
  if (!poll) throw new NotFoundError("Poll not found.");

  const options = await Option.find({ pollId }).lean();
  return {
    pollId: poll._id,
    question: poll.question,
    totalVotes: poll.totalVotes,
    expiresAt: poll.expiresAt,
    options: options.map((o) => ({
      _id: o._id,
      text: o.text,
      voteCount: o.voteCount,
    })),
  };
};
