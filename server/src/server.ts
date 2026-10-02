import app from "./app.js";
import appConfig from "./config/config.js";
import { connectDB, disconnectDB } from "./database/db.js";

const PORT = appConfig.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(`[BitDesk Server] Running on http://localhost:${PORT}`);
      console.log(`[BitDesk Server] Health Check: http://localhost:${PORT}/api/health`);
      console.log(`[BitDesk Server] Environment: ${appConfig.NODE_ENV}`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n[BitDesk Server] ${signal} signal received: closing HTTP server...`);
      server.close(async () => {
        console.log("[BitDesk Server] HTTP server closed.");
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

  } catch (error) {
    console.error("[BitDesk Server] Failed to start:", error);
    process.exit(1);
  }
};

startServer();