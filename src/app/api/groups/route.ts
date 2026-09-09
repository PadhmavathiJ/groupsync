import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";
import User from "@/models/User";

async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.email) {
    return null;
  }

  await connectDB();

  return User.findOne({
    email: session.user.email.toLowerCase(),
  });
}

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const groups = await Group.find({
      members: user._id,
    })
      .populate("createdBy", "name email avatar")
      .populate("members", "name email avatar")
      .sort({ createdAt: -1 });

    return Response.json({
      success: true,
      groups,
    });
  } catch (error) {
    console.error("Failed to fetch groups:", error);

    return Response.json(
      { message: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { message: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const name =
      typeof body.name === "string"
        ? body.name.trim()
        : "";

    if (!name) {
      return Response.json(
        { message: "Group name is required" },
        { status: 400 }
      );
    }

    const group = await Group.create({
      name,
      createdBy: user._id,
      members: [user._id],
    });

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

    return Response.json(
      {
        success: true,
        group,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create group:", error);

    return Response.json(
      { message: "Failed to create group" },
      { status: 500 }
    );
  }
}