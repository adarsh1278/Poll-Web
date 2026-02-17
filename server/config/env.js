import { config } from "dotenv";
config();

const env = Object.freeze({
  PORT: parseInt(process.env.PORT, 10) || 4000,
  MONGO_URI: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/polling",
  CLIENT_URLS: (process.env.CLIENT_URL || "http://localhost:3000")
    .split(",")
    .map((u) => u.trim()),
  NODE_ENV: process.env.NODE_ENV || "development",
  HASH_SALT: process.env.HASH_SALT || "default-salt-change-in-production",
});

export default env;
