import mongoose from "mongoose";
import env from "./env.js";

const connectDB = async () => {
  const conn = await mongoose.connect(env.MONGO_URI, {
    maxPoolSize: 10,
  });
  if (env.NODE_ENV !== "production") {
    console.log(`MongoDB connected: ${conn.connection.host}`);
  }
};

export default connectDB;
