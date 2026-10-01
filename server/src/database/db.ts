import mongoose from "mongoose";
import appConfig from "../config/config.js";

export const connectDB = async (): Promise<void> => {
  try {
    if (!appConfig.MONGO_URI) {
      throw new Error("MONGO_URI is not defined in environment variables.");
    }

    const conn = await mongoose.connect(appConfig.MONGO_URI);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on("error", (err) => {
      console.error(`[Database] MongoDB runtime connection error:`, err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn(`[Database] MongoDB connection lost. Attempting reconnect...`);
    });
  } catch (error) {
    console.error("[Database] Connection failed:", error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.connection.close();
    console.log("[Database] MongoDB connection closed gracefully.");
  } catch (error) {
    console.error("[Database] Error closing MongoDB connection:", error);
  }
};
