export type CouponStatus = "DRAFT" | "ACTIVE" | "PAUSED" | "EXPIRED" | "ARCHIVED";
export type CouponAudienceType = "GENERAL" | "TARGETED" | "RECOMMENDED";
export type CouponSourceType = "ADMIN" | "SYSTEM";
export type CouponDiscountType = "PERCENT" | "FLAT" | "FREE_DELIVERY";

export type Coupon = {
  _id: string;
  code: string;
  name: string;
  description: string;
  status: CouponStatus;
  sourceType: CouponSourceType;
  audienceType: CouponAudienceType;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minOrderAmount: number;
  applicableOrderTypes: ("Delivery" | "Pickup")[];
  membershipTiers: string[];
  validFrom: string | null;
  validUntil: string | null;
  globalUsageLimit: number | null;
  perUserUsageLimit: number | null;
  perDayUsageLimit: number | null;
  usageCount: number;
  metrics?: {
    issuedCount?: number;
    reservedCount?: number;
    redeemedCount?: number;
    revenueLift?: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type CouponPricing = {
  code: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  discountAmount: number;
  subtotal: number;
  orderType: string;
  deliveryCharge: number;
};

export type CouponAssignment = {
  _id: string;
  status: string;
  issuedBy: string;
  issuedReason: string;
  validFrom: string | null;
  validUntil: string | null;
};

export type CouponValidationResponse = {
  ok: boolean;
  coupon: Coupon;
  pricing: CouponPricing;
  assignment: CouponAssignment | null;
};

export type CouponReservationResponse = {
  ok: boolean;
  reservationToken: string;
  expiresAt: string;
  coupon: Coupon;
  pricing: CouponPricing;
};

export type AppliedCouponState = {
  code: string;
  couponId: string;
  discountType: CouponDiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  discountAmount: number;
  reservationToken: string | null;
  reservationExpiresAt: string | null;
};

export type CouponSummaryResponse = {
  byStatus: Record<string, number>;
  totalDiscountGiven: number;
  totalRedemptions: number;
  redemptionsToday: number;
  expiringSoon: number;
};
