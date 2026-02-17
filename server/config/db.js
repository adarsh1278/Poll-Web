import mongoose from "mongoose";
import env from "./env.js";

const connectDB = async () => {
  const conn = await mongoose.connect(env.MONGO_URI, {
    maxPoolSize: 10,
  });
  if (env.NODE_ENV !== "production") {
    console.log(`MongoDB connected: ${conn.connection.host}`);
  }

  // Drop the old IP-based unique index if it still exists
  try {
    const votesCollection = conn.connection.collection("votes");
    const indexes = await votesCollection.indexes();
    const hasOldIndex = indexes.some((idx) => idx.name === "pollId_1_hashedIP_1");
    if (hasOldIndex) {
      await votesCollection.dropIndex("pollId_1_hashedIP_1");
      console.log("Dropped old pollId_1_hashedIP_1 unique index");
    }
  } catch (err) {
    // Ignore if collection or index doesn't exist
    if (err.code !== 26 && err.code !== 27) {
      console.warn("Could not drop old IP index:", err.message);
    }
  }
};

export default connectDB;
