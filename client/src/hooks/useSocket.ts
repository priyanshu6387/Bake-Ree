"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

interface UseSocketOptions {
  room?: "kitchen" | "admin" | "user";
  userId?: string;
  enabled?: boolean;
}

let sharedSocket: Socket | null = null;
let activeConsumers = 0;

const createSharedSocket = () => {
  if (sharedSocket) return sharedSocket;

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  sharedSocket = io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    auth: token ? { token } : undefined,
  });
  return sharedSocket;
};

const disconnectSharedSocketIfIdle = () => {
  if (activeConsumers > 0) return;
  if (!sharedSocket) return;
  sharedSocket.disconnect();
  sharedSocket = null;
};

/**
 * Custom hook for Socket.io connection
 * @param options - Configuration options
 * @returns Socket instance and connection status
 */
export const useSocket = (options: UseSocketOptions = {}) => {
  const { room, userId, enabled = true } = options;
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    const socketInstance = createSharedSocket();
    activeConsumers += 1;
    setSocket(socketInstance);
    setIsConnected(socketInstance.connected);

    const joinRoom = () => {
      if (room === "kitchen") {
        socketInstance.emit("join:kitchen");
      } else if (room === "admin") {
        socketInstance.emit("join:admin");
      } else if (room === "user" && userId) {
        socketInstance.emit("join:user", userId);
      }
    };

    // Connection handlers
    socketInstance.on("connect", () => {
      setIsConnected(true);
      joinRoom();
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("Socket.io connection error:", error?.message || error);
      setIsConnected(false);
    });

    if (socketInstance.connected) {
      joinRoom();
    }

    // Cleanup on unmount
    return () => {
      initializedRef.current = false;
      socketInstance.off("connect");
      socketInstance.off("disconnect");
      socketInstance.off("connect_error");
      activeConsumers = Math.max(0, activeConsumers - 1);
      disconnectSharedSocketIfIdle();
    };
  }, [room, userId, enabled]);

  return { socket, isConnected };
};

export default useSocket;
