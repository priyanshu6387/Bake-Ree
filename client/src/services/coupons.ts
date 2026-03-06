import http from "@/services/http";
import type {
  Coupon,
  CouponReservationResponse,
  CouponSummaryResponse,
  CouponValidationResponse,
} from "@/types/coupons";

export const CouponsAPI = {
  validate: async (payload: {
    code: string;
    subtotal: number;
    orderType?: "Delivery" | "Pickup";
    deliveryCharge?: number;
  }) => {
    const { data } = await http.post<CouponValidationResponse>("/coupons/validate", payload);
    return data;
  },

  reserve: async (payload: {
    code: string;
    subtotal: number;
    orderType?: "Delivery" | "Pickup";
    deliveryCharge?: number;
    cartItemsCount?: number;
  }) => {
    const { data } = await http.post<CouponReservationResponse>("/coupons/reserve", payload);
    return data;
  },

  release: async (reservationToken: string) => {
    const { data } = await http.post<{ ok: boolean }>("/coupons/release", { reservationToken });
    return data;
  },

  getMyCoupons: async () => {
    const { data } = await http.get<{
      general: Array<{ type: string; coupon: Coupon; assignment: null }>;
      targeted: Array<{ type: string; coupon: Coupon; assignment: Record<string, unknown> }>;
    }>("/coupons/my");
    return data;
  },

  getRecommendations: async () => {
    const { data } = await http.get<
      Array<{
        assignmentId: string;
        issuedReason: string;
        validFrom: string | null;
        validUntil: string | null;
        coupon: Coupon;
      }>
    >("/coupons/recommendations");
    return data;
  },

  // Admin
  create: async (payload: Record<string, unknown>) => {
    const { data } = await http.post<Coupon>("/coupons", payload);
    return data;
  },

  list: async (params?: Record<string, unknown>) => {
    const { data } = await http.get<{ items: Coupon[]; page: number; limit: number; total: number }>(
      "/coupons",
      { params }
    );
    return data;
  },

  update: async (couponId: string, payload: Record<string, unknown>) => {
    const { data } = await http.patch<Coupon>(`/coupons/${couponId}`, payload);
    return data;
  },

  updateStatus: async (couponId: string, status: string) => {
    const { data } = await http.patch<Coupon>(`/coupons/${couponId}/status`, { status });
    return data;
  },

  assign: async (couponId: string, payload: { userIds: string[]; validUntil?: string; issuedReason?: string }) => {
    const { data } = await http.post<{
      couponId: string;
      assignedCount: number;
      attemptedCount: number;
    }>(`/coupons/${couponId}/assign`, payload);
    return data;
  },

  runRecommendations: async () => {
    const { data } = await http.post<{ assignedCount: number; ruleCounters: Record<string, number> }>(
      "/coupons/system/run-recommendations"
    );
    return data;
  },

  getSummary: async () => {
    const { data } = await http.get<CouponSummaryResponse>("/coupons/analytics/summary");
    return data;
  },
};

export default CouponsAPI;
