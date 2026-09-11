import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";
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

    const user = await User.findOne({
      email: session.user.email.toLowerCase(),
    });

    if (!user) {
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

    const group = await Group.findById(id)
      .populate("createdBy", "name email avatar")
      .populate("members", "name email avatar");

    if (!group) {
      return Response.json(
        { message: "Group not found" },
        { status: 404 }
      );
    }

    const isMember = group.members.some(
  (member: { _id: mongoose.Types.ObjectId }) =>
    member._id.toString() === user._id.toString()
);

    if (!isMember) {
      return Response.json(
        { message: "You are not a member of this group" },
        { status: 403 }
      );
    }

    return Response.json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("Failed to fetch group:", error);

    return Response.json(
      { message: "Failed to fetch group" },
      { status: 500 }
    );
  }
}