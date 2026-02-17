import { createServer } from "node:http";
import { Server } from "socket.io";
import app from "./app.js";
import env from "./config/env.js";
import connectDB from "./config/db.js";
import registerSocketHandlers from "./sockets/poll.socket.js";

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: env.CLIENT_URLS,
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

registerSocketHandlers(io);

const start = async () => {
  await connectDB();
  httpServer.listen(env.PORT, () => {
    if (env.NODE_ENV !== "production") {
      console.log(`Server running on port ${env.PORT}`);
    }
  });
};

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
