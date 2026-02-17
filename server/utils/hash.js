import { createHash } from "node:crypto";
import env from "../config/env.js";

export const hashValue = (value) => {
  return createHash("sha256")
    .update(`${env.HASH_SALT}:${value}`)
    .digest("hex");
};
