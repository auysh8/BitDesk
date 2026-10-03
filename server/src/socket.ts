import { Server as SocketIOServer } from "socket.io";
import type { Server as HTTPServer } from "http";
import appConfig from "./config/config.js";

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HTTPServer): SocketIOServer => {
  const configuredOrigins = (appConfig.CORS_ORIGIN || "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const cleanOrigin = origin.replace(/\/+$/, "");
        if (
          configuredOrigins.includes(cleanOrigin) ||
          cleanOrigin === "http://localhost:5173" ||
          cleanOrigin === "http://localhost:3000" ||
          cleanOrigin.endsWith(".onrender.com") ||
          cleanOrigin.endsWith(".vercel.app")
        ) {
          return callback(null, true);
        }
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // Client joins a specific ticket room for live thread updates
    socket.on("join:ticket", (ticketId: string) => {
      if (ticketId) {
        socket.join(`ticket:${ticketId}`);
      }
    });

    socket.on("leave:ticket", (ticketId: string) => {
      if (ticketId) {
        socket.leave(`ticket:${ticketId}`);
      }
    });

    // Client joins global notifications room (for staff or dashboard)
    socket.on("join:global", () => {
      socket.join("global:updates");
    });
  });

  return io;
};

export const getIO = (): SocketIOServer | null => {
  return io;
};

// Helper methods to emit real-time events across the app
export const emitTicketMessage = (ticketId: string, message: any) => {
  if (io) {
    io.to(`ticket:${ticketId}`).emit("ticket:message_created", message);
  }
};

export const emitTicketStatusChanged = (ticketId: string, data: any) => {
  if (io) {
    io.to(`ticket:${ticketId}`).emit("ticket:status_changed", data);
    io.to("global:updates").emit("dashboard:refresh", { ticketId });
  }
};

export const emitTicketAssigned = (ticketId: string, data: any) => {
  if (io) {
    io.to(`ticket:${ticketId}`).emit("ticket:assigned", data);
    io.to("global:updates").emit("dashboard:refresh", { ticketId });
  }
};
