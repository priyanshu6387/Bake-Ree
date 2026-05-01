import {
  crmComplaints,
  crmCustomerNotes,
  crmCustomerOrders,
  crmCustomers,
  crmLoyaltyActivity,
} from "@/lib/crm/minimalCrmMock";
import {
  crmSegmentDefinitions,
  getCrmSegmentLabel,
  getSegmentRecipients,
} from "@/lib/crm/crmSegments";
import {
  createCrmCampaign,
  createCrmComplaint,
  createCrmCustomerNote,
  createCrmLoyaltyAdjustment,
  duplicateCrmCampaign,
  getCrmCampaignRecipients,
  getCrmCampaigns,
  getCrmComplaints,
  getCrmCustomer,
  createCrmCustomer,
  getCrmCustomerComplaints,
  getCrmCustomerLoyaltyActivity,
  getCrmCustomerNotes,
  getCrmCustomerOrders,
  getCrmCustomers,
  getCrmLoyaltyOverview,
  updateCrmCampaignStatus,
  updateCrmComplaintStatus,
} from "@/services/crmService";
import type {
  CampaignStatus,
  CrmCampaign,
  CrmCampaignRecipient,
  CrmSegmentKey,
  CrmComplaint,
  CrmCustomer,
  CrmLoyaltyAdjustmentPayload,
  CrmLoyaltyAdjustmentResult,
  CrmLoyaltySummary,
  CrmCustomerNote,
  CrmCustomerOrder,
  CrmLoyaltyActivity,
  CrmNoteType,
  CrmCustomerCreatePayload,
} from "@/types/crm";

export const shouldUseCrmApi = process.env.NEXT_PUBLIC_CRM_USE_API === "true";

export type CrmDataResult<T> = {
  data: T;
  apiAttempted: boolean;
  usedMockFallback: boolean;
};

const toSafeIsoDate = (value: unknown): string | null => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
};

const sanitizeCustomerDates = (customer: CrmCustomer): CrmCustomer => ({
  ...customer,
  createdAt: toSafeIsoDate(customer.createdAt) ?? new Date().toISOString(),
  lastOrderDate: toSafeIsoDate(customer.lastOrderDate) ?? "",
});

const sortByDateDesc = <T>(items: T[], getDate: (item: T) => string) =>
  [...items].sort((a, b) => new Date(getDate(b)).getTime() - new Date(getDate(a)).getTime());

const devWarn = (message: string, error: unknown) => {
  if (process.env.NODE_ENV !== "development") return;
  console.warn(message, error);
};

const calculateLoyaltySummary = (
  customers: CrmCustomer[],
  activity: CrmLoyaltyActivity[]
): CrmLoyaltySummary => {
  const totalLoyaltyCustomers = customers.filter((customer) => customer.loyaltyPoints > 0).length;
  const totalActivePoints = customers.reduce((sum, customer) => sum + customer.loyaltyPoints, 0);
  const pointsEarned = activity
    .filter((item) => item.type === "earned")
    .reduce((sum, item) => sum + item.points, 0);
  const pointsRedeemed = activity
    .filter((item) => item.type === "redeemed")
    .reduce((sum, item) => sum + Math.abs(item.points), 0);
  const loyaltyChampions = customers.filter((customer) => customer.loyaltyPoints >= 500).length;
  const averagePointsPerCustomer =
    customers.length === 0 ? 0 : Math.round(totalActivePoints / customers.length);

  return {
    totalLoyaltyCustomers,
    totalActivePoints,
    pointsEarned,
    pointsRedeemed,
    loyaltyChampions,
    averagePointsPerCustomer,
  };
};

export const withCrmMockFallback = async <T>(
  apiFetcher: () => Promise<T>,
  mockFetcher: () => T,
  fallbackLabel: string
): Promise<CrmDataResult<T>> => {
  if (!shouldUseCrmApi) {
    return { data: mockFetcher(), apiAttempted: false, usedMockFallback: false };
  }

  try {
    const data = await apiFetcher();
    return { data, apiAttempted: true, usedMockFallback: false };
  } catch (error) {
    devWarn(`[CRM] API failed for ${fallbackLabel}, falling back to mock data.`, error);
    return { data: mockFetcher(), apiAttempted: true, usedMockFallback: true };
  }
};

export const getMockCrmCustomers = (): CrmCustomer[] => [...crmCustomers];

const getMockCrmLoyaltyOverview = (): {
  customers: CrmCustomer[];
  activity: CrmLoyaltyActivity[];
  summary: CrmLoyaltySummary;
} => {
  const customers = crmCustomers.map((customer) => ({ ...customer }));
  const activity = sortByDateDesc(
    crmLoyaltyActivity.map((item) => ({ ...item })),
    (item) => item.createdAt
  );
  return {
    customers,
    activity,
    summary: calculateLoyaltySummary(customers, activity),
  };
};

export const getMockCrmCustomerById = (id: string): CrmCustomer | null =>
  crmCustomers.find((customer) => customer.id === id) ?? null;

export const getMockCrmCustomerOrders = (id: string): CrmCustomerOrder[] =>
  sortByDateDesc(
    crmCustomerOrders.filter((order) => order.customerId === id),
    (order) => order.date
  );

export const getMockCrmCustomerNotes = (id: string): CrmCustomerNote[] =>
  sortByDateDesc(
    crmCustomerNotes.filter((note) => note.customerId === id),
    (note) => note.createdAt
  );

export const getMockCrmCustomerLoyaltyActivity = (id: string): CrmLoyaltyActivity[] =>
  sortByDateDesc(
    crmLoyaltyActivity.filter((activity) => activity.customerId === id),
    (activity) => activity.createdAt
  );

export const getMockCrmCustomerComplaints = (id: string): CrmComplaint[] =>
  sortByDateDesc(
    crmComplaints.filter((complaint) => complaint.customerId === id),
    (complaint) => complaint.createdAt
  );

export const loadCrmCustomers = (params?: { search?: string; status?: string; sort?: string }) =>
  withCrmMockFallback(
    async () => {
      const customers = await getCrmCustomers(params);
      return customers.map(sanitizeCustomerDates);
    },
    () => getMockCrmCustomers().map(sanitizeCustomerDates),
    "customers list"
  );

export const loadCrmCustomer = (id: string) =>
  withCrmMockFallback<CrmCustomer | null>(
    async () => getCrmCustomer(id),
    () => getMockCrmCustomerById(id),
    `customer ${id}`
  );

export const createCrmCustomerWithFallback = async (
  payload: CrmCustomerCreatePayload
): Promise<CrmDataResult<CrmCustomer>> => {
  const createLocalCustomer = (): CrmCustomer => {
    const now = new Date().toISOString();
    const normalizedLoyaltyPoints =
      payload.loyaltyPoints !== undefined && Number.isFinite(Number(payload.loyaltyPoints))
        ? Math.max(0, Number(payload.loyaltyPoints))
        : 0;
    return {
      id: `LOCAL-CUST-${Date.now()}`,
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      email: payload.email?.trim() || "",
      totalOrders: 0,
      totalSpend: 0,
      lastOrderDate: now,
      loyaltyPoints: normalizedLoyaltyPoints,
      status: payload.status ?? "active",
      favoriteProduct: payload.favoriteProduct?.trim() || "Not available",
      needsFollowUp: payload.needsFollowUp ?? false,
      createdAt: now,
      preferenceNotes: payload.preferenceNotes?.trim() || undefined,
      topPurchasedProducts: [],
    };
  };

  if (!shouldUseCrmApi) {
    return { data: createLocalCustomer(), apiAttempted: false, usedMockFallback: false };
  }

  try {
    const customer = await createCrmCustomer(payload);
    return { data: sanitizeCustomerDates(customer), apiAttempted: true, usedMockFallback: false };
  } catch (error) {
    devWarn("[CRM] API failed for customer creation, using local fallback customer.", error);
    return { data: sanitizeCustomerDates(createLocalCustomer()), apiAttempted: true, usedMockFallback: true };
  }
};

export const loadCrmCustomerOrders = (id: string) =>
  withCrmMockFallback(
    () => getCrmCustomerOrders(id),
    () => getMockCrmCustomerOrders(id),
    `customer ${id} orders`
  );

export const loadCrmCustomerNotes = (id: string) =>
  withCrmMockFallback(
    () => getCrmCustomerNotes(id),
    () => getMockCrmCustomerNotes(id),
    `customer ${id} notes`
  );

export const loadCrmCustomerLoyaltyActivity = (id: string) =>
  withCrmMockFallback(
    () => getCrmCustomerLoyaltyActivity(id),
    () => getMockCrmCustomerLoyaltyActivity(id),
    `customer ${id} loyalty activity`
  );

export const loadCrmCustomerComplaints = (id: string) =>
  withCrmMockFallback(
    () => getCrmCustomerComplaints(id),
    () => getMockCrmCustomerComplaints(id),
    `customer ${id} complaints`
  );

export const loadCrmLoyaltyOverview = () =>
  withCrmMockFallback(
    () => getCrmLoyaltyOverview(),
    () => getMockCrmLoyaltyOverview(),
    "loyalty overview"
  );

export const createCrmLoyaltyAdjustmentWithFallback = async (
  payload: CrmLoyaltyAdjustmentPayload,
  currentCustomers?: CrmCustomer[]
): Promise<CrmDataResult<CrmLoyaltyAdjustmentResult>> => {
  const createLocalAdjustmentResult = (): CrmLoyaltyAdjustmentResult => {
    const baseCustomers = currentCustomers ?? crmCustomers;
    const targetCustomer = baseCustomers.find((customer) => customer.id === payload.customerId);
    const basePoints = targetCustomer?.loyaltyPoints ?? 0;
    const pointsValue = Math.abs(payload.points);
    const nextPoints =
      payload.type === "earned"
        ? basePoints + pointsValue
        : payload.type === "redeemed"
          ? Math.max(0, basePoints - pointsValue)
          : basePoints + pointsValue;

    return {
      activity: {
        id: `LOCAL-LA-${Date.now()}`,
        customerId: payload.customerId,
        type: payload.type,
        points: payload.type === "redeemed" ? -pointsValue : pointsValue,
        description: payload.description.trim(),
        createdAt: new Date().toISOString(),
      },
      customer: {
        id: payload.customerId,
        loyaltyPoints: nextPoints,
      },
    };
  };

  if (!shouldUseCrmApi) {
    return { data: createLocalAdjustmentResult(), apiAttempted: false, usedMockFallback: false };
  }

  try {
    const adjustment = await createCrmLoyaltyAdjustment(payload);
    return { data: adjustment, apiAttempted: true, usedMockFallback: false };
  } catch (error) {
    devWarn("[CRM] API failed for loyalty adjustment, using local fallback adjustment.", error);
    return { data: createLocalAdjustmentResult(), apiAttempted: true, usedMockFallback: true };
  }
};

export const saveCrmCustomerNote = (id: string, payload: { text: string; type: CrmNoteType }) =>
  createCrmCustomerNote(id, payload);

export const createCrmCustomerNoteWithFallback = async (
  id: string,
  payload: { text: string; type: CrmNoteType }
): Promise<CrmDataResult<CrmCustomerNote>> => {
  const createLocalNote = (): CrmCustomerNote => ({
    id: `LOCAL-NOTE-${Date.now()}`,
    customerId: id,
    text: payload.text.trim(),
    type: payload.type,
    createdBy: "ops_user",
    createdAt: new Date().toISOString(),
  });

  if (!shouldUseCrmApi) {
    return { data: createLocalNote(), apiAttempted: false, usedMockFallback: false };
  }

  try {
    const note = await createCrmCustomerNote(id, payload);
    return { data: note, apiAttempted: true, usedMockFallback: false };
  } catch (error) {
    devWarn(`[CRM] API failed for customer ${id} note creation, using local fallback note.`, error);
    return { data: createLocalNote(), apiAttempted: true, usedMockFallback: true };
  }
};

export const loadCrmComplaints = (params?: {
  search?: string;
  status?: string;
  issueType?: string;
  sort?: string;
}) =>
  withCrmMockFallback(
    () => getCrmComplaints(params),
    () => sortByDateDesc(crmComplaints, (complaint) => complaint.createdAt),
    "complaints list"
  );

export const createCrmComplaintWithFallback = async (payload: {
  customerId: string;
  orderId?: string;
  issueType: string;
  description: string;
  priority?: "low" | "medium" | "high";
}): Promise<CrmDataResult<CrmComplaint>> => {
  const createLocalComplaint = (): CrmComplaint => ({
    id: `LOCAL-CMP-${Date.now()}`,
    customerId: payload.customerId,
    customerName: crmCustomers.find((customer) => customer.id === payload.customerId)?.name ?? "Unknown Customer",
    orderId: payload.orderId,
    issueType: payload.issueType,
    description: payload.description,
    status: "open",
    priority: payload.priority,
    createdAt: new Date().toISOString(),
  });

  if (!shouldUseCrmApi) {
    return { data: createLocalComplaint(), apiAttempted: false, usedMockFallback: false };
  }

  try {
    const complaint = await createCrmComplaint(payload);
    return { data: complaint, apiAttempted: true, usedMockFallback: false };
  } catch (error) {
    devWarn("[CRM] API failed for complaint creation, using local fallback complaint.", error);
    return { data: createLocalComplaint(), apiAttempted: true, usedMockFallback: true };
  }
};

export const updateCrmComplaintStatusWithFallback = async (
  id: string,
  payload: { status: "open" | "in_progress" | "resolved"; resolutionNote?: string },
  currentComplaint?: CrmComplaint
): Promise<CrmDataResult<CrmComplaint>> => {
  const createLocalUpdatedComplaint = (): CrmComplaint => {
    const base: CrmComplaint = currentComplaint ?? {
      id,
      customerId: "",
      customerName: "Unknown Customer",
      issueType: "General",
      description: "",
      status: payload.status,
      createdAt: new Date().toISOString(),
    };
    return {
      ...base,
      status: payload.status,
      resolutionNote: payload.resolutionNote ?? base.resolutionNote,
      resolvedAt: payload.status === "resolved" ? new Date().toISOString() : base.resolvedAt,
    };
  };

  if (!shouldUseCrmApi) {
    return { data: createLocalUpdatedComplaint(), apiAttempted: false, usedMockFallback: false };
  }

  try {
    const complaint = await updateCrmComplaintStatus(id, payload);
    return { data: complaint, apiAttempted: true, usedMockFallback: false };
  } catch (error) {
    devWarn(`[CRM] API failed for complaint ${id} status update, using local fallback update.`, error);
    return { data: createLocalUpdatedComplaint(), apiAttempted: true, usedMockFallback: true };
  }
};

const getMockCampaignRecipientCount = (segment: CrmSegmentKey) =>
  segment === "manual_customer" ? 1 : getSegmentRecipients(segment, crmCustomers).length;

const getMockCrmCampaigns = (): CrmCampaign[] => [
  {
    id: "CAM-1001",
    name: "Weekend VIP Treat",
    targetSegment: "vip_customers",
    channel: "whatsapp",
    message: "Special weekend dessert upgrade for our VIP members.",
    couponCode: "VIPWEEKEND",
    discountLabel: "15% off",
    status: "sent",
    recipientCount: getMockCampaignRecipientCount("vip_customers"),
    createdAt: "2026-04-27T09:30:00.000Z",
  },
  {
    id: "CAM-1002",
    name: "Bring Back Inactive",
    targetSegment: "inactive_customers",
    channel: "sms",
    message: "We miss you. Come back this week for a flat save.",
    couponCode: "COMEBAKE",
    discountLabel: "Flat Rs 150 off",
    status: "scheduled",
    recipientCount: getMockCampaignRecipientCount("inactive_customers"),
    createdAt: "2026-04-29T10:20:00.000Z",
    scheduledAt: "2026-05-04T12:00:00.000Z",
  },
  {
    id: "CAM-1003",
    name: "Loyalty Booster",
    targetSegment: "loyalty_champions",
    channel: "email",
    message: "Double points on selected bakery boxes this Friday.",
    couponCode: "POINTSRUSH",
    discountLabel: "2x Points",
    status: "draft",
    recipientCount: getMockCampaignRecipientCount("loyalty_champions"),
    createdAt: "2026-04-30T14:45:00.000Z",
  },
];

export const loadCrmCampaigns = (params?: {
  search?: string;
  status?: string;
  channel?: string;
  sort?: string;
}) =>
  withCrmMockFallback(
    () => getCrmCampaigns(params),
    () => getMockCrmCampaigns(),
    "campaigns list"
  );

export const createCrmCampaignWithFallback = async (payload: {
  name: string;
  targetSegment: CrmSegmentKey;
  channel: "whatsapp" | "sms" | "email";
  message: string;
  couponCode?: string;
  discountLabel?: string;
  status?: CampaignStatus;
  scheduledAt?: string | null;
  recipientCustomerId?: string;
  recipientCustomerName?: string;
}): Promise<CrmDataResult<CrmCampaign>> => {
  const createLocalCampaign = (): CrmCampaign => ({
    id: `LOCAL-CAM-${Date.now()}`,
    name: payload.name,
    targetSegment: payload.targetSegment,
    targetSegmentLabel: getCrmSegmentLabel(payload.targetSegment),
    channel: payload.channel,
    message: payload.message,
    couponCode: payload.couponCode,
    discountLabel: payload.discountLabel,
    status: payload.status ?? "draft",
    recipientCount: getMockCampaignRecipientCount(payload.targetSegment),
    createdAt: new Date().toISOString(),
    scheduledAt: payload.scheduledAt ?? undefined,
    sentAt: payload.status === "sent" ? new Date().toISOString() : undefined,
    recipientCustomerId: payload.recipientCustomerId,
    recipientCustomerName: payload.recipientCustomerName,
  });

  if (!shouldUseCrmApi) {
    return { data: createLocalCampaign(), apiAttempted: false, usedMockFallback: false };
  }

  try {
    const campaign = await createCrmCampaign(payload);
    return { data: campaign, apiAttempted: true, usedMockFallback: false };
  } catch (error) {
    devWarn("[CRM] API failed for campaign creation, using local fallback campaign.", error);
    return { data: createLocalCampaign(), apiAttempted: true, usedMockFallback: true };
  }
};

export const updateCrmCampaignStatusWithFallback = async (
  id: string,
  payload: { status: CampaignStatus; scheduledAt?: string | null },
  currentCampaign?: CrmCampaign
): Promise<CrmDataResult<CrmCampaign>> => {
  const createLocalCampaign = (): CrmCampaign => {
    const base: CrmCampaign = currentCampaign ?? {
      id,
      name: "Unknown Campaign",
      targetSegment: "active_customers",
      channel: "whatsapp",
      message: "",
      status: payload.status,
      recipientCount: 0,
      createdAt: new Date().toISOString(),
    };
    return {
      ...base,
      status: payload.status,
      scheduledAt:
        payload.status === "scheduled"
          ? payload.scheduledAt ?? base.scheduledAt ?? new Date().toISOString()
          : base.scheduledAt,
      sentAt: payload.status === "sent" ? new Date().toISOString() : base.sentAt,
    };
  };

  if (!shouldUseCrmApi) {
    return { data: createLocalCampaign(), apiAttempted: false, usedMockFallback: false };
  }

  try {
    const campaign = await updateCrmCampaignStatus(id, payload);
    return { data: campaign, apiAttempted: true, usedMockFallback: false };
  } catch (error) {
    devWarn(`[CRM] API failed for campaign ${id} status update, using local fallback update.`, error);
    return { data: createLocalCampaign(), apiAttempted: true, usedMockFallback: true };
  }
};

export const duplicateCrmCampaignWithFallback = async (
  campaign: CrmCampaign
): Promise<CrmDataResult<CrmCampaign>> => {
  const localDuplicate = (): CrmCampaign => ({
    ...campaign,
    id: `LOCAL-CAM-${Date.now()}`,
    name: `${campaign.name} Copy`,
    status: "draft",
    createdAt: new Date().toISOString(),
    sentAt: undefined,
  });

  if (!shouldUseCrmApi) {
    return { data: localDuplicate(), apiAttempted: false, usedMockFallback: false };
  }

  try {
    const duplicated = await duplicateCrmCampaign(campaign.id);
    return { data: duplicated, apiAttempted: true, usedMockFallback: false };
  } catch (error) {
    devWarn(`[CRM] API failed for campaign ${campaign.id} duplication, using local fallback duplicate.`, error);
    return { data: localDuplicate(), apiAttempted: true, usedMockFallback: true };
  }
};

export const loadCrmCampaignRecipients = async (
  id: string,
  fallbackSegment?: CrmSegmentKey
): Promise<
  CrmDataResult<{
    segment: { key: string; label: string };
    recipientCount: number;
    recipients: CrmCampaignRecipient[];
  }>
> => {
  const getLocalRecipients = () => {
    const key = fallbackSegment ?? crmSegmentDefinitions[0].key;
    const recipients = getSegmentRecipients(key, crmCustomers);
    return {
      segment: { key, label: getCrmSegmentLabel(key) },
      recipientCount: recipients.length,
      recipients,
    };
  };

  if (!shouldUseCrmApi) {
    return { data: getLocalRecipients(), apiAttempted: false, usedMockFallback: false };
  }

  try {
    const data = await getCrmCampaignRecipients(id);
    return { data, apiAttempted: true, usedMockFallback: false };
  } catch (error) {
    devWarn(`[CRM] API failed for campaign ${id} recipients, using local fallback recipients.`, error);
    return { data: getLocalRecipients(), apiAttempted: true, usedMockFallback: true };
  }
};
