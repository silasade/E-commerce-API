import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";

dotenv.config();
try {
  dns.setServers(["8.8.8.8", "8.8.8.4"]);
} catch (e) {
  console.warn("[Database] Custom DNS server set warning:", e);
}
const mongoDBURL = process.env.MONGODB_URL || "";

const connectDb = async () => {
  try {
    await mongoose.connect(mongoDBURL, {
      serverSelectionTimeoutMS: 30000,
    });
    console.log("MONGODB Connected!");
  } catch (error) {
    console.error(`Failed to connect to databasee ${error as Error}`);
    throw error;
  }
};

export { connectDb };
