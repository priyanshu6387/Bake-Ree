import { Server } from "socket.io";

let io = null;

/**
 * Initialize Socket.io server
 * @param {http.Server} httpServer - HTTP server instance
 * @returns {Server} Socket.io server instance
 */
export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CORS_ORIGIN || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Connection handling
  io.on("connection", (socket) => {
    console.log(`✅ Client connected: ${socket.id}`);

    // Handle joining rooms
    socket.on("join:kitchen", () => {
      socket.join("kitchen");
      console.log(`🔵 Client ${socket.id} joined kitchen room`);
    });

    socket.on("join:admin", () => {
      socket.join("admin");
      console.log(`🔵 Client ${socket.id} joined admin room`);
    });

    // Handle joining user-specific room for order updates
    socket.on("join:user", (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
        console.log(`🔵 Client ${socket.id} joined user room: user:${userId}`);
      }
    });

    // Handle joining staff-specific room for delivery updates
    socket.on("join:staff", (staffId) => {
      if (staffId) {
        socket.join(`staff:${staffId}`);
        console.log(`🔵 Client ${socket.id} joined staff room: staff:${staffId}`);
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Get Socket.io instance
 * @returns {Server} Socket.io server instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initializeSocket first.");
  }
  return io;
};

export default { initializeSocket, getIO };

