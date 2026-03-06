import type { StockAlert } from "@/store/kitchenStore";
import http from "@/services/http";

export const kitchenAlertsService = {
  async list(): Promise<StockAlert[]> {
    const { data } = await http.get("/kitchen/alerts");
    return data;
  },
  async create(alert: StockAlert): Promise<StockAlert> {
    const { data } = await http.post("/kitchen/alerts", alert);
    return data;
  },
  async update(alertId: string, patch: Partial<StockAlert>): Promise<{ id: string; patch: Partial<StockAlert> }> {
    if (patch.status === "ACK") {
      const { data } = await http.patch(`/kitchen/alerts/${alertId}/ack`);
      return { id: String(data?._id || alertId), patch: data };
    }
    if (patch.status === "RESOLVED") {
      const { data } = await http.patch(`/kitchen/alerts/${alertId}/resolve`);
      return { id: String(data?._id || alertId), patch: data };
    }
    if (patch.actionType) {
      const { data } = await http.patch(`/kitchen/alerts/${alertId}/action-type`, {
        actionType: patch.actionType,
      });
      return { id: String(data?._id || alertId), patch: data };
    }
    return { id: alertId, patch };
  },
};
