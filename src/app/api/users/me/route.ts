import { auth } from "@/auth";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export async function GET() {
  const session = await auth();

  if (!session?.user?.email) {
    return Response.json(
      { message: "Not authenticated" },
      { status: 401 }
    );
  }

  await connectDB();

  const user = await User.findOneAndUpdate(
    { email: session.user.email.toLowerCase() },
    {
      name: session.user.name || "GroupSync User",
      email: session.user.email.toLowerCase(),
      avatar: session.user.image || undefined,
    },
    {
  returnDocument: "after",
  upsert: true,
  runValidators: true,
}
  );

  return Response.json({
    success: true,
    user,
  });
}