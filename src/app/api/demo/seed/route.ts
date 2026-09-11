import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";
import User from "@/models/User";

const demoUsers = [
  {
    name: "Aarav",
    email: "aarav.demo@groupsync.local",
  },
  {
    name: "Diya",
    email: "diya.demo@groupsync.local",
  },
  {
    name: "Rahul",
    email: "rahul.demo@groupsync.local",
  },
];

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { message: "Demo seeding is disabled in production." },
      { status: 403 }
    );
  }

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

    const body = await request.json();
    const groupId = body.groupId;

    if (!groupId) {
      return Response.json(
        { message: "Group ID is required" },
        { status: 400 }
      );
    }

    const group = await Group.findById(groupId);

    if (!group) {
      return Response.json(
        { message: "Group not found" },
        { status: 404 }
      );
    }

    const isMember = group.members.some(
      (memberId: { toString(): string }) =>
        memberId.toString() === currentUser._id.toString()
    );

    if (!isMember) {
      return Response.json(
        { message: "Not allowed" },
        { status: 403 }
      );
    }

    const createdUsers = [];

    for (const demoUser of demoUsers) {
      const user = await User.findOneAndUpdate(
        { email: demoUser.email },
        {
          $setOnInsert: {
            name: demoUser.name,
            email: demoUser.email,
          },
        },
        {
          upsert: true,
          returnDocument: "after",
        }
      );

      if (
        user &&
        !group.members.some(
          (memberId: { toString(): string }) =>
            memberId.toString() === user._id.toString()
        )
      ) {
        group.members.push(user._id);
      }

      if (user) {
        createdUsers.push({
          _id: user._id,
          name: user.name,
          email: user.email,
        });
      }
    }

    await group.save();

    return Response.json({
      success: true,
      users: createdUsers,
    });
  } catch (error) {
    console.error("Failed to seed demo users:", error);

    return Response.json(
      { message: "Failed to create demo users" },
      { status: 500 }
    );
  }
}