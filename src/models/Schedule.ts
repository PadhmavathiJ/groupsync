import mongoose, { Schema, models } from "mongoose";

const BusySlotSchema = new Schema(
  {
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const ScheduleSchema = new Schema(
  {
    groupId: {
      type: Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    dayOfWeek: {
      type: String,
      required: true,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
    },
    busySlots: {
      type: [BusySlotSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Schedule =
  models.Schedule || mongoose.model("Schedule", ScheduleSchema);

export default Schedule;