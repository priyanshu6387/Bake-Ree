import type { DispatchRequest } from "@/store/kitchenStore";
import http from "@/services/http";

export const dispatchRequestsService = {
  async list(): Promise<DispatchRequest[]> {
    const { data } = await http.get("/kitchen/dispatch-requests");
    return data;
  },
  async create(request: DispatchRequest): Promise<DispatchRequest> {
    const { data } = await http.post("/kitchen/dispatch-requests", request);
    return data;
  },
  async update(requestId: string, patch: Partial<DispatchRequest>): Promise<{ id: string; patch: Partial<DispatchRequest> }> {
    if (patch.status === "ASSIGNED") {
      const { data } = await http.patch(`/kitchen/dispatch-requests/${requestId}/assign`, {
        assignee: patch.assignee ?? null,
      });
      return { id: String(data?._id || requestId), patch: data };
    }
    if (patch.status === "COMPLETED") {
      const { data } = await http.patch(`/kitchen/dispatch-requests/${requestId}/complete`);
      return { id: String(data?._id || requestId), patch: data };
    }
    return { id: requestId, patch };
  },
};
