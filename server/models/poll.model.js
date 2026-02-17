import mongoose from "mongoose";
import { nanoid } from "nanoid";

const pollSchema = new mongoose.Schema(
  {
    _id: {
      type: String,
      default: () => nanoid(10),
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    totalVotes: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    _id: false,
  }
);

pollSchema.index({ createdAt: -1 });

const Poll = mongoose.model("Poll", pollSchema);

export default Poll;
