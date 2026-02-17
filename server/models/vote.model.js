import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    pollId: {
      type: String,
      required: true,
    },
    optionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Option",
    },
    hashedIP: {
      type: String,
    },
    fingerprintHash: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

voteSchema.index({ pollId: 1 });
voteSchema.index({ pollId: 1, fingerprintHash: 1 }, { unique: true });

const Vote = mongoose.model("Vote", voteSchema);

export default Vote;
