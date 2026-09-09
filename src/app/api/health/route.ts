import { connectDB } from "@/lib/mongodb";

export async function GET() {
  try {
    await connectDB();

    return Response.json({
      success: true,
      database: "connected",
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    return Response.json(
      {
        success: false,
        database: "disconnected",
      },
      { status: 500 }
    );
  }
}