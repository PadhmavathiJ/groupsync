import mongoose from "mongoose";

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

const MONGODB_URI: string = mongoUri;

export async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  await mongoose.connect(MONGODB_URI);

  return mongoose.connection;
}