import { io, Socket } from "socket.io-client";

const getSocketUrl = (): string => {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (envUrl) {
    return envUrl.replace(/\/api\/?$/, "");
  }
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return "https://bitdesk.onrender.com";
  }
  return "http://localhost:5000";
};

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(getSocketUrl(), {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on("connect", () => {
      console.log("[Socket.IO] Connected to BitDesk real-time server");
    });

    socket.on("disconnect", (reason) => {
      console.log("[Socket.IO] Disconnected:", reason);
    });
  }
  return socket;
};

export const joinTicketRoom = (ticketId: string) => {
  const s = getSocket();
  s.emit("join:ticket", ticketId);
};

export const leaveTicketRoom = (ticketId: string) => {
  const s = getSocket();
  s.emit("leave:ticket", ticketId);
};
