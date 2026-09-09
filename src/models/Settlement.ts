import mongoose, { Schema, models } from "mongoose";

const SettlementSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    fromUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUser: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    status: {
      type: String,
      enum: ["PENDING", "SETTLED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true,
  }
);

const Settlement =
  models.Settlement || mongoose.model("Settlement", SettlementSchema);

export default Settlement;