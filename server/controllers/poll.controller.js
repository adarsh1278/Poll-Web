import * as pollService from "../services/poll.service.js";

export const create = async (req, res) => {
  const { question, options, expiresAt } = req.body;
  const result = await pollService.createPoll(question, options, expiresAt);
  res.status(201).json({
    status: "success",
    data: {
      pollId: result.poll._id,
      question: result.poll.question,
      options: result.options,
      expiresAt: result.poll.expiresAt,
    },
  });
};

export const getById = async (req, res) => {
  const result = await pollService.getPollById(req.params.id);
  pollService.assertPollActive(result.poll);
  res.json({
    status: "success",
    data: result,
  });
};

export const getResults = async (req, res) => {
  const results = await pollService.getPollResults(req.params.id);
  res.json({
    status: "success",
    data: results,
  });
};
