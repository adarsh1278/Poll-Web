import mongoose from "mongoose";

const optionSchema = new mongoose.Schema(
  {
    pollId: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    voteCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: false,
  }
);

optionSchema.index({ pollId: 1 });

const Option = mongoose.model("Option", optionSchema);

export default Option;
