import * as voteService from "../services/vote.service.js";
import * as pollService from "../services/poll.service.js";

const registerSocketHandlers = (io) => {
  io.on("connection", (socket) => {
    socket.on("join_poll", (pollId) => {
      if (typeof pollId === "string" && pollId.length > 0) {
        socket.join(`poll_${pollId}`);
      }
    });

    socket.on("leave_poll", (pollId) => {
      socket.leave(`poll_${pollId}`);
    });

    socket.on("submit_vote", async (data, callback) => {
      const cb = typeof callback === "function" ? callback : () => {};

      try {
        const { pollId, optionId, fingerprint } = data;
        const clientIP =
          socket.handshake.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
          socket.handshake.address ||
          "unknown";

        const result = await voteService.castVote(
          pollId,
          optionId,
          clientIP,
          fingerprint
        );

        io.to(`poll_${pollId}`).emit("vote_update", result);
        cb({ status: "success", data: result });
      } catch (err) {
        cb({
          status: "error",
          statusCode: err.statusCode || 500,
          message: err.message || "Vote failed.",
        });
      }
    });

    socket.on("request_results", async (pollId, callback) => {
      const cb = typeof callback === "function" ? callback : () => {};
      try {
        const results = await pollService.getPollResults(pollId);
        cb({ status: "success", data: results });
      } catch (err) {
        cb({
          status: "error",
          statusCode: err.statusCode || 500,
          message: err.message || "Failed to fetch results.",
        });
      }
    });
  });
};

export default registerSocketHandlers;
