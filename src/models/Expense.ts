import mongoose, { Schema, models } from "mongoose";

const SplitSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

const ExpenseSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: "Meeting",
      required: false,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    splits: {
      type: [SplitSchema],
      required: true,
    },
    splitType: {
      type: String,
      enum: ["EQUAL", "CUSTOM"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Expense =
  models.Expense || mongoose.model("Expense", ExpenseSchema);

export default Expense;