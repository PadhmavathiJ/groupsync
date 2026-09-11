import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import Group from "@/models/Group";
import Schedule from "@/models/Schedule";
import User from "@/models/User";

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

    const group = await Group.findById(groupId);

    if (!group) {
      return Response.json(
        { message: "Group not found" },
        { status: 404 }
      );
    }

    const demoUsers = await User.find({
      email: {
        $in: [
          "aarav.demo@groupsync.local",
          "diya.demo@groupsync.local",
          "rahul.demo@groupsync.local",
        ],
      },
    });

    const scheduleMap = {
      "aarav.demo@groupsync.local": [
        { startTime: "11:00", endTime: "12:00" },
      ],
      "diya.demo@groupsync.local": [
        { startTime: "14:00", endTime: "15:00" },
      ],
      "rahul.demo@groupsync.local": [
        { startTime: "09:00", endTime: "10:00" },
      ],
    };

    for (const user of demoUsers) {
      const busySlots =
        scheduleMap[
          user.email as keyof typeof scheduleMap
        ];

      await Schedule.findOneAndUpdate(
        {
          groupId,
          userId: user._id,
          dayOfWeek: "Monday",
        },
        {
          groupId,
          userId: user._id,
          dayOfWeek: "Monday",
          busySlots,
        },
        {
          upsert: true,
          returnDocument: "after",
          runValidators: true,
        }
      );
    }

    return Response.json({
      success: true,
      message: "Demo schedules created",
    });
  } catch (error) {
    console.error("Failed to create demo schedules:", error);

    return Response.json(
      { message: "Failed to create demo schedules" },
      { status: 500 }
    );
  }
}