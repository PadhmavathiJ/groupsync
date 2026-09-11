import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";
import Schedule from "@/models/Schedule";
import User from "@/models/User";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return Response.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectDB();

    const currentUser = await User.findOne({
      email: session.user.email.toLowerCase(),
    });

    if (!currentUser) {
      return Response.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return Response.json(
        { message: "Invalid group ID" },
        { status: 400 }
      );
    }

    const group = await Group.findById(id);

    if (!group) {
      return Response.json(
        { message: "Group not found" },
        { status: 404 }
      );
    }

    const isMember = group.members.some(
      (memberId: mongoose.Types.ObjectId) =>
        memberId.toString() === currentUser._id.toString()
    );

    if (!isMember) {
      return Response.json(
        { message: "You are not a member of this group" },
        { status: 403 }
      );
    }

    const schedules = await Schedule.find({
      groupId: id,
    }).populate("userId", "name email avatar");

    return Response.json({
      success: true,
      schedules,
    });
  } catch (error) {
    console.error("Failed to fetch schedules:", error);

    return Response.json(
      { message: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return Response.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    await connectDB();

    const currentUser = await User.findOne({
      email: session.user.email.toLowerCase(),
    });

    if (!currentUser) {
      return Response.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const { id } = await context.params;

    if (!mongoose.isValidObjectId(id)) {
      return Response.json(
        { message: "Invalid group ID" },
        { status: 400 }
      );
    }

    const group = await Group.findById(id);

    if (!group) {
      return Response.json(
        { message: "Group not found" },
        { status: 404 }
      );
    }

    const isMember = group.members.some(
      (memberId: mongoose.Types.ObjectId) =>
        memberId.toString() === currentUser._id.toString()
    );

    if (!isMember) {
      return Response.json(
        { message: "You are not a member of this group" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const dayOfWeek =
      typeof body.dayOfWeek === "string"
        ? body.dayOfWeek.trim()
        : "";

    const busySlots = Array.isArray(body.busySlots)
      ? body.busySlots
      : [];

    const validDays = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];

    if (!validDays.includes(dayOfWeek)) {
      return Response.json(
        { message: "Invalid day of week" },
        { status: 400 }
      );
    }

    for (const slot of busySlots) {
      if (
        typeof slot.startTime !== "string" ||
        typeof slot.endTime !== "string" ||
        !slot.startTime ||
        !slot.endTime
      ) {
        return Response.json(
          { message: "Invalid busy slot" },
          { status: 400 }
        );
      }

      if (slot.endTime <= slot.startTime) {
        return Response.json(
          {
            message:
              "Busy slot end time must be after start time",
          },
          { status: 400 }
        );
      }
    }

    const schedule = await Schedule.findOneAndUpdate(
      {
        groupId: id,
        userId: currentUser._id,
        dayOfWeek,
      },
      {
        groupId: id,
        userId: currentUser._id,
        dayOfWeek,
        busySlots,
      },
      {
        upsert: true,
        returnDocument: "after",
        runValidators: true,
      }
    ).populate("userId", "name email avatar");

    return Response.json({
      success: true,
      schedule,
    });
  } catch (error) {
    console.error("Failed to save schedule:", error);

    return Response.json(
      { message: "Failed to save schedule" },
      { status: 500 }
    );
  }
}