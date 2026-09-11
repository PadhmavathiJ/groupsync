import mongoose from "mongoose";

import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";
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
        { message: "Current user not found" },
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

    const currentUserIsMember = group.members.some(
      (memberId: mongoose.Types.ObjectId) =>
        memberId.toString() === currentUser._id.toString()
    );

    if (!currentUserIsMember) {
      return Response.json(
        { message: "You are not a member of this group" },
        { status: 403 }
      );
    }

    const body = await request.json();

    const email =
      typeof body.email === "string"
        ? body.email.trim().toLowerCase()
        : "";

    if (!email) {
      return Response.json(
        { message: "Member email is required" },
        { status: 400 }
      );
    }

    const userToAdd = await User.findOne({ email });

    if (!userToAdd) {
      return Response.json(
        {
          message:
            "No GroupSync account found for this email. Ask them to sign in once first.",
        },
        { status: 404 }
      );
    }

    const alreadyMember = group.members.some(
      (memberId: mongoose.Types.ObjectId) =>
        memberId.toString() === userToAdd._id.toString()
    );

    if (alreadyMember) {
      return Response.json(
        { message: "This user is already a group member" },
        { status: 409 }
      );
    }

    group.members.push(userToAdd._id);

    await group.save();

    await group.populate([
      {
        path: "createdBy",
        select: "name email avatar",
      },
      {
        path: "members",
        select: "name email avatar",
      },
    ]);

    return Response.json({
      success: true,
      group,
    });
  } catch (error) {
    console.error("Failed to add member:", error);

    return Response.json(
      { message: "Failed to add member" },
      { status: 500 }
    );
  }
}