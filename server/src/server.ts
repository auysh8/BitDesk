import http from "http";
import app from "./app.js";
import appConfig from "./config/config.js";
import { connectDB, disconnectDB } from "./database/db.js";
import { initSocket } from "./socket.js";

const PORT = appConfig.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const httpServer = http.createServer(app);
    initSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`[BitDesk Server] Running on http://localhost:${PORT}`);
      console.log(`[BitDesk Server] Health Check: http://localhost:${PORT}/api/health`);
      console.log(`[BitDesk Server] API Docs: http://localhost:${PORT}/api-docs`);
      console.log(`[BitDesk Server] Environment: ${appConfig.NODE_ENV}`);
      console.log(`[BitDesk Server] Socket.IO initialized for real-time collaboration`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n[BitDesk Server] ${signal} signal received: closing HTTP server...`);
      httpServer.close(async () => {
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