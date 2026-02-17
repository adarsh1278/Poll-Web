import express from "express";
import helmet from "helmet";
import cors from "cors";
import mongoSanitize from "express-mongo-sanitize";
import env from "./config/env.js";
import pollRoutes from "./routes/poll.routes.js";
import voteRoutes from "./routes/vote.routes.js";
import errorHandler from "./middleware/errorHandler.js";
import { AppError } from "./utils/errors.js";

const app = express();

app.set("trust proxy", 1);

app.use(helmet());
app.use(
  cors({
    origin: env.CLIENT_URLS,
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json({ limit: "10kb" }));
app.use(mongoSanitize());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/polls", pollRoutes);
app.use("/api/votes", voteRoutes);

app.all("*", (req, _res, next) => {
  next(new AppError(`Route ${req.originalUrl} not found`, 404));
});

app.use(errorHandler);

export default app;
