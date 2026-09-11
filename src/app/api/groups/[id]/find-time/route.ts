import mongoose from "mongoose";

import { auth } from "@/auth";
import { findMeetingSlots } from "@/algorithms/meetWhen";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";
import Schedule from "@/models/Schedule";
import User from "@/models/User";

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

    const group = await Group.findById(id).populate(
      "members",
      "name email"
    );

    if (!group) {
      return Response.json(
        { message: "Group not found" },
        { status: 404 }
      );
    }

    const isMember = group.members.some(
      (member: { _id: mongoose.Types.ObjectId }) =>
        member._id.toString() === currentUser._id.toString()
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

    const searchStart =
      typeof body.searchStart === "string"
        ? body.searchStart
        : "";

    const searchEnd =
      typeof body.searchEnd === "string"
        ? body.searchEnd
        : "";

    const durationMinutes = Number(body.durationMinutes);

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

    if (!searchStart || !searchEnd || searchEnd <= searchStart) {
      return Response.json(
        { message: "Invalid search time range" },
        { status: 400 }
      );
    }

    if (
      !Number.isFinite(durationMinutes) ||
      durationMinutes <= 0
    ) {
      return Response.json(
        { message: "Invalid meeting duration" },
        { status: 400 }
      );
    }

    const schedules = await Schedule.find({
      groupId: id,
      dayOfWeek,
    });

    const memberSchedules = group.members.map(
      (member: {
        _id: mongoose.Types.ObjectId;
        name: string;
      }) => {
        const savedSchedule = schedules.find(
          (schedule) =>
            schedule.userId.toString() ===
            member._id.toString()
        );

        return {
          userId: member._id.toString(),
          name: member.name,
          busySlots: savedSchedule?.busySlots ?? [],
        };
      }
    );

    const results = findMeetingSlots(
      memberSchedules,
      searchStart,
      searchEnd,
      durationMinutes
    );

    return Response.json({
      success: true,
      dayOfWeek,
      durationMinutes,
      results,
    });
  } catch (error) {
    console.error("Failed to find meeting time:", error);

    return Response.json(
      { message: "Failed to find meeting time" },
      { status: 500 }
    );
  }
}