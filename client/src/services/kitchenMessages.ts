import type { KitchenMessage, OrderThreadMessage } from "@/store/kitchenStore";
import http from "@/services/http";

export const kitchenMessagesService = {
  async list(): Promise<KitchenMessage[]> {
    const { data } = await http.get("/kitchen/messages");
    return data;
  },
  async create(message: KitchenMessage): Promise<KitchenMessage> {
    const { data } = await http.post("/kitchen/messages", message);
    return data;
  },
  async createThreadMessage(orderId: string, message: OrderThreadMessage): Promise<{ orderId: string; message: OrderThreadMessage }> {
    const { data } = await http.post("/kitchen/messages", {
      orderId,
      body: message.body,
      sender: message.sender,
      targetRole: "KITCHEN",
    });
    return {
      orderId,
      message: {
        ...message,
        id: String(data?._id || data?.id || Date.now()),
        createdAt: data?.createdAt || new Date().toISOString(),
      },
    };
  },
};
