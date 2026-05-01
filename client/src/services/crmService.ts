import http from "@/services/http";
import type {
  CampaignChannel,
  CampaignStatus,
  CrmCampaign,
  CrmCampaignRecipient,
  CrmComplaint,
  CrmCustomer,
  CrmLoyaltyAdjustmentPayload,
  CrmLoyaltyAdjustmentResult,
  CrmCustomerNote,
  CrmCustomerOrder,
  CrmLoyaltyActivity,
  CrmLoyaltySummary,
  CrmNoteType,
  CrmCustomerCreatePayload,
} from "@/types/crm";

type ApiSuccess<T> = { success: true } & T;

type GetCustomersParams = {
  search?: string;
  status?: string;
  sort?: string;
};

type CreateCustomerNotePayload = {
  text: string;
  type: CrmNoteType;
};

type GetComplaintsParams = {
  search?: string;
  status?: string;
  issueType?: string;
  sort?: string;
};

type CreateComplaintPayload = {
  customerId: string;
  orderId?: string;
  issueType: string;
  description: string;
  priority?: "low" | "medium" | "high";
};

type UpdateComplaintStatusPayload = {
  status: "open" | "in_progress" | "resolved";
  resolutionNote?: string;
};

type GetCampaignsParams = {
  search?: string;
  status?: string;
  channel?: string;
  sort?: string;
};

type CreateCampaignPayload = {
  name: string;
  targetSegment: string;
  channel: CampaignChannel;
  message: string;
  couponCode?: string;
  discountLabel?: string;
  status?: CampaignStatus;
  scheduledAt?: string | null;
};

type UpdateCampaignStatusPayload = {
  status: CampaignStatus;
  scheduledAt?: string | null;
};

type CrmCampaignRecipientsResponse = {
  segment: { key: string; label: string };
  recipientCount: number;
  recipients: CrmCampaignRecipient[];
};

export const getCrmCustomers = async (params?: GetCustomersParams): Promise<CrmCustomer[]> => {
  const { data } = await http.get<ApiSuccess<{ customers: CrmCustomer[] }>>("/crm/customers", { params });
  return data.customers;
};

export const getCrmCustomer = async (id: string): Promise<CrmCustomer> => {
  const { data } = await http.get<ApiSuccess<{ customer: CrmCustomer }>>(`/crm/customers/${id}`);
  return data.customer;
};

export const createCrmCustomer = async (payload: CrmCustomerCreatePayload): Promise<CrmCustomer> => {
  const { data } = await http.post<ApiSuccess<{ customer: CrmCustomer }>>("/crm/customers", payload);
  return data.customer;
};

export const getCrmCustomerOrders = async (id: string): Promise<CrmCustomerOrder[]> => {
  const { data } = await http.get<ApiSuccess<{ orders: CrmCustomerOrder[] }>>(`/crm/customers/${id}/orders`);
  return data.orders;
};

export const getCrmCustomerNotes = async (id: string): Promise<CrmCustomerNote[]> => {
  const { data } = await http.get<ApiSuccess<{ notes: CrmCustomerNote[] }>>(`/crm/customers/${id}/notes`);
  return data.notes;
};

export const createCrmCustomerNote = async (
  id: string,
  payload: CreateCustomerNotePayload
): Promise<CrmCustomerNote> => {
  const { data } = await http.post<ApiSuccess<{ note: CrmCustomerNote }>>(`/crm/customers/${id}/notes`, payload);
  return data.note;
};

export const getCrmCustomerLoyaltyActivity = async (id: string): Promise<CrmLoyaltyActivity[]> => {
  const { data } = await http.get<ApiSuccess<{ activity: CrmLoyaltyActivity[] }>>(
    `/crm/customers/${id}/loyalty-activity`
  );
  return data.activity;
};

export const getCrmCustomerComplaints = async (id: string): Promise<CrmComplaint[]> => {
  const { data } = await http.get<ApiSuccess<{ complaints: CrmComplaint[] }>>(
    `/crm/customers/${id}/complaints`
  );
  return data.complaints;
};

export const getCrmComplaints = async (params?: GetComplaintsParams): Promise<CrmComplaint[]> => {
  const { data } = await http.get<ApiSuccess<{ complaints: CrmComplaint[] }>>("/crm/complaints", { params });
  return data.complaints;
};

export const createCrmComplaint = async (payload: CreateComplaintPayload): Promise<CrmComplaint> => {
  const { data } = await http.post<ApiSuccess<{ complaint: CrmComplaint }>>("/crm/complaints", payload);
  return data.complaint;
};

export const updateCrmComplaintStatus = async (
  id: string,
  payload: UpdateComplaintStatusPayload
): Promise<CrmComplaint> => {
  const { data } = await http.patch<ApiSuccess<{ complaint: CrmComplaint }>>(
    `/crm/complaints/${id}/status`,
    payload
  );
  return data.complaint;
};

export const getCrmCampaigns = async (params?: GetCampaignsParams): Promise<CrmCampaign[]> => {
  const { data } = await http.get<ApiSuccess<{ campaigns: CrmCampaign[] }>>("/crm/campaigns", { params });
  return data.campaigns;
};

export const createCrmCampaign = async (payload: CreateCampaignPayload): Promise<CrmCampaign> => {
  const { data } = await http.post<ApiSuccess<{ campaign: CrmCampaign }>>("/crm/campaigns", payload);
  return data.campaign;
};

export const updateCrmCampaignStatus = async (
  id: string,
  payload: UpdateCampaignStatusPayload
): Promise<CrmCampaign> => {
  const { data } = await http.patch<ApiSuccess<{ campaign: CrmCampaign }>>(
    `/crm/campaigns/${id}/status`,
    payload
  );
  return data.campaign;
};

export const duplicateCrmCampaign = async (id: string): Promise<CrmCampaign> => {
  const { data } = await http.post<ApiSuccess<{ campaign: CrmCampaign }>>(`/crm/campaigns/${id}/duplicate`);
  return data.campaign;
};

export const getCrmCampaignRecipients = async (id: string): Promise<CrmCampaignRecipientsResponse> => {
  const { data } = await http.get<ApiSuccess<CrmCampaignRecipientsResponse>>(`/crm/campaigns/${id}/recipients`);
  return {
    segment: data.segment,
    recipientCount: data.recipientCount,
    recipients: data.recipients,
  };
};

export const getCrmLoyaltyOverview = async (): Promise<{
  customers: CrmCustomer[];
  activity: CrmLoyaltyActivity[];
  summary: CrmLoyaltySummary;
}> => {
  const { data } = await http.get<
    ApiSuccess<{ customers: CrmCustomer[]; activity: CrmLoyaltyActivity[]; summary: CrmLoyaltySummary }>
  >("/crm/loyalty");
  return {
    customers: data.customers,
    activity: data.activity,
    summary: data.summary,
  };
};

export const createCrmLoyaltyAdjustment = async (
  payload: CrmLoyaltyAdjustmentPayload
): Promise<CrmLoyaltyAdjustmentResult> => {
  const { data } = await http.post<
    ApiSuccess<{ activity: CrmLoyaltyActivity; customer: { id: string; loyaltyPoints: number } }>
  >("/crm/loyalty/adjustments", payload);
  return {
    activity: data.activity,
    customer: data.customer,
  };
};
