import type {
  CrmComplaint,
  CrmCustomer,
  CrmCustomerNote,
  CrmCustomerOrder,
  CrmKpi,
  CrmLoyaltyActivity,
} from "@/types/crm";

export const crmCustomers: CrmCustomer[] = [
  {
    id: "CUST-1001",
    name: "Naina Kapoor",
    phone: "+91 98765 01001",
    email: "naina.kapoor@example.com",
    totalOrders: 28,
    totalSpend: 47600,
    lastOrderDate: "2026-04-28",
    loyaltyPoints: 2840,
    status: "vip",
    favoriteProduct: "Blueberry Cheesecake",
    needsFollowUp: false,
    createdAt: "2024-11-10",
    preferredOrderChannel: "delivery",
    preferenceNotes: "Prefers eggless options for family gatherings.",
    topPurchasedProducts: ["Blueberry Cheesecake", "Butter Croissant", "Cold Coffee"],
  },
  {
    id: "CUST-1002",
    name: "Rohit Das",
    phone: "+91 98765 01002",
    email: "rohit.das@example.com",
    totalOrders: 14,
    totalSpend: 21900,
    lastOrderDate: "2026-04-12",
    loyaltyPoints: 1420,
    status: "active",
    favoriteProduct: "Almond Croissant",
    needsFollowUp: true,
    createdAt: "2025-02-03",
    preferredOrderChannel: "pickup",
    preferenceNotes: "Likes less sweet pastries.",
    topPurchasedProducts: ["Almond Croissant", "Sourdough Bread", "Americano"],
  },
  {
    id: "CUST-1003",
    name: "Aisha Khan",
    phone: "+91 98765 01003",
    email: "aisha.khan@example.com",
    totalOrders: 19,
    totalSpend: 33650,
    lastOrderDate: "2026-04-29",
    loyaltyPoints: 1980,
    status: "active",
    favoriteProduct: "Dark Chocolate Truffle Cake",
    needsFollowUp: false,
    createdAt: "2025-06-19",
    preferredOrderChannel: "delivery",
    preferenceNotes: "No nuts due to allergy.",
    topPurchasedProducts: ["Dark Chocolate Truffle Cake", "Garlic Bread", "Fruit Danish"],
  },
  {
    id: "CUST-1004",
    name: "Leena Bose",
    phone: "+91 98765 01004",
    email: "leena.bose@example.com",
    totalOrders: 7,
    totalSpend: 8450,
    lastOrderDate: "2026-03-25",
    loyaltyPoints: 560,
    status: "inactive",
    favoriteProduct: "Hazelnut Pastry",
    needsFollowUp: true,
    createdAt: "2025-09-08",
    preferredOrderChannel: "delivery",
    preferenceNotes: "Weekend evening delivery slot preferred.",
    topPurchasedProducts: ["Hazelnut Pastry", "Red Velvet Slice", "Herb Focaccia"],
  },
  {
    id: "CUST-1005",
    name: "Samir Rao",
    phone: "+91 98765 01005",
    email: "samir.rao@example.com",
    totalOrders: 10,
    totalSpend: 12400,
    lastOrderDate: "2026-04-02",
    loyaltyPoints: 760,
    status: "inactive",
    favoriteProduct: "Sourdough Bread",
    needsFollowUp: true,
    createdAt: "2025-10-14",
    preferredOrderChannel: "pickup",
    preferenceNotes: "Prefers same-day pickup after 6 PM.",
    topPurchasedProducts: ["Sourdough Bread", "Whole Wheat Loaf", "Cinnamon Roll"],
  },
  {
    id: "CUST-1006",
    name: "Dev Menon",
    phone: "+91 98765 01006",
    email: "dev.menon@example.com",
    totalOrders: 22,
    totalSpend: 28900,
    lastOrderDate: "2026-04-30",
    loyaltyPoints: 2240,
    status: "vip",
    favoriteProduct: "Tiramisu Jar",
    needsFollowUp: false,
    createdAt: "2024-12-27",
    preferredOrderChannel: "delivery",
    preferenceNotes: "Often orders office dessert boxes.",
    topPurchasedProducts: ["Tiramisu Jar", "Choco Lava Cup", "Banoffee Tart"],
  },
  {
    id: "CUST-1007",
    name: "Esha Jain",
    phone: "+91 98765 01007",
    email: "esha.jain@example.com",
    totalOrders: 11,
    totalSpend: 15800,
    lastOrderDate: "2026-04-07",
    loyaltyPoints: 990,
    status: "active",
    favoriteProduct: "Multigrain Loaf",
    needsFollowUp: true,
    createdAt: "2026-01-22",
    preferredOrderChannel: "pickup",
    preferenceNotes: "Prefers low-gluten options.",
    topPurchasedProducts: ["Multigrain Loaf", "Granola Cookie", "Greek Yogurt Bowl"],
  },
  {
    id: "CUST-1008",
    name: "Sunita Patel",
    phone: "+91 98765 01008",
    email: "sunita.patel@example.com",
    totalOrders: 17,
    totalSpend: 24300,
    lastOrderDate: "2026-04-26",
    loyaltyPoints: 1690,
    status: "active",
    favoriteProduct: "Vanilla Cupcake Box",
    needsFollowUp: false,
    createdAt: "2025-04-17",
    preferredOrderChannel: "delivery",
    preferenceNotes: "Orders birthday packs for school events.",
    topPurchasedProducts: ["Vanilla Cupcake Box", "Choco Chip Muffin", "Classic Brownie"],
  },
];

export const crmComplaints: CrmComplaint[] = [
  {
    id: "CMP-901",
    customerId: "CUST-1004",
    customerName: "Leena Bose",
    orderId: "ORD-77801",
    issueType: "Late delivery",
    description: "Order reached 55 minutes late during evening slot.",
    status: "open",
    createdAt: "2026-04-29",
  },
  {
    id: "CMP-902",
    customerId: "CUST-1005",
    customerName: "Samir Rao",
    orderId: "ORD-77742",
    issueType: "Wrong item",
    description: "Received garlic bread instead of sourdough loaf.",
    status: "in_progress",
    createdAt: "2026-04-28",
  },
  {
    id: "CMP-903",
    customerId: "CUST-1002",
    customerName: "Rohit Das",
    orderId: "ORD-77610",
    issueType: "Quality issue",
    description: "Croissant was not fresh on delivery.",
    status: "open",
    createdAt: "2026-04-26",
  },
  {
    id: "CMP-904",
    customerId: "CUST-1007",
    customerName: "Esha Jain",
    orderId: "ORD-77564",
    issueType: "Payment reversal",
    description: "UPI refund has not reflected after cancellation.",
    status: "resolved",
    createdAt: "2026-04-23",
  },
];

export const crmCustomerOrders: CrmCustomerOrder[] = [
  { id: "O-1001", customerId: "CUST-1001", orderNumber: "ORD-78102", date: "2026-04-28", itemsSummary: "Blueberry Cheesecake, Butter Croissant", status: "delivered", amount: 1850, channel: "delivery" },
  { id: "O-1002", customerId: "CUST-1001", orderNumber: "ORD-78016", date: "2026-04-22", itemsSummary: "Cold Coffee x2, Quiche", status: "delivered", amount: 920, channel: "pickup" },
  { id: "O-1003", customerId: "CUST-1001", orderNumber: "ORD-77984", date: "2026-04-16", itemsSummary: "Family Snack Box", status: "delivered", amount: 2400, channel: "delivery" },
  { id: "O-2001", customerId: "CUST-1002", orderNumber: "ORD-77610", date: "2026-04-12", itemsSummary: "Almond Croissant x4", status: "delivered", amount: 760, channel: "pickup" },
  { id: "O-2002", customerId: "CUST-1002", orderNumber: "ORD-77518", date: "2026-04-03", itemsSummary: "Sourdough Bread, Americano", status: "delivered", amount: 620, channel: "pickup" },
  { id: "O-3001", customerId: "CUST-1003", orderNumber: "ORD-78140", date: "2026-04-29", itemsSummary: "Dark Chocolate Truffle Cake", status: "delivered", amount: 1350, channel: "delivery" },
  { id: "O-3002", customerId: "CUST-1003", orderNumber: "ORD-78078", date: "2026-04-21", itemsSummary: "Garlic Bread, Fruit Danish", status: "delivered", amount: 690, channel: "delivery" },
  { id: "O-4001", customerId: "CUST-1004", orderNumber: "ORD-77801", date: "2026-03-25", itemsSummary: "Hazelnut Pastry x3", status: "delivered", amount: 840, channel: "delivery" },
  { id: "O-5001", customerId: "CUST-1005", orderNumber: "ORD-77742", date: "2026-04-02", itemsSummary: "Sourdough Bread, Cinnamon Roll", status: "confirmed", amount: 540, channel: "pickup" },
  { id: "O-6001", customerId: "CUST-1006", orderNumber: "ORD-78192", date: "2026-04-30", itemsSummary: "Tiramisu Jar Box x6", status: "delivered", amount: 2100, channel: "delivery" },
  { id: "O-6002", customerId: "CUST-1006", orderNumber: "ORD-78121", date: "2026-04-24", itemsSummary: "Corporate Dessert Pack", status: "delivered", amount: 3200, channel: "delivery" },
  { id: "O-7001", customerId: "CUST-1007", orderNumber: "ORD-77564", date: "2026-04-07", itemsSummary: "Multigrain Loaf, Granola Cookie", status: "delivered", amount: 560, channel: "pickup" },
  { id: "O-8001", customerId: "CUST-1008", orderNumber: "ORD-78091", date: "2026-04-26", itemsSummary: "Vanilla Cupcake Box x2", status: "delivered", amount: 1280, channel: "delivery" },
  { id: "O-8002", customerId: "CUST-1008", orderNumber: "ORD-78020", date: "2026-04-19", itemsSummary: "Brownie Box, Muffin Combo", status: "delivered", amount: 940, channel: "delivery" },
];

export const crmCustomerNotes: CrmCustomerNote[] = [
  { id: "N-101", customerId: "CUST-1001", text: "Sent birthday reminder campaign with 12% conversion.", type: "general", createdBy: "Priya", createdAt: "2026-04-10" },
  { id: "N-102", customerId: "CUST-1001", text: "Customer requested eggless celebration options.", type: "preference", createdBy: "Rahul", createdAt: "2026-04-14" },
  { id: "N-201", customerId: "CUST-1002", text: "Follow-up needed after quality complaint on croissant freshness.", type: "complaint", createdBy: "Nisha", createdAt: "2026-04-26" },
  { id: "N-401", customerId: "CUST-1004", text: "Call back for delivery delay apology coupon.", type: "follow_up", createdBy: "Karan", createdAt: "2026-04-29" },
];

export const crmLoyaltyActivity: CrmLoyaltyActivity[] = [
  { id: "L-1001", customerId: "CUST-1001", type: "earned", points: 240, description: "Earned on ORD-78102", createdAt: "2026-04-28" },
  { id: "L-1002", customerId: "CUST-1001", type: "redeemed", points: -120, description: "Redeemed for free delivery", createdAt: "2026-04-22" },
  { id: "L-1003", customerId: "CUST-1001", type: "adjusted", points: 60, description: "Manual goodwill adjustment", createdAt: "2026-04-18" },
  { id: "L-2001", customerId: "CUST-1002", type: "earned", points: 90, description: "Earned on ORD-77610", createdAt: "2026-04-12" },
  { id: "L-3001", customerId: "CUST-1003", type: "earned", points: 130, description: "Earned on ORD-78140", createdAt: "2026-04-29" },
  { id: "L-4001", customerId: "CUST-1004", type: "redeemed", points: -80, description: "Redeemed on checkout", createdAt: "2026-03-25" },
  { id: "L-6001", customerId: "CUST-1006", type: "earned", points: 260, description: "Earned on ORD-78192", createdAt: "2026-04-30" },
  { id: "L-8001", customerId: "CUST-1008", type: "earned", points: 110, description: "Earned on ORD-78091", createdAt: "2026-04-26" },
];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);

export const formatDate = (isoDate?: string | number | Date | null) => {
  if (isoDate === null || isoDate === undefined || isoDate === "") return "N/A";

  try {
    const parsed = isoDate instanceof Date ? isoDate : new Date(isoDate);
    if (Number.isNaN(parsed.getTime())) return "N/A";

    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(parsed);
  } catch {
    return "N/A";
  }
};

export const calculateRepeatOrderRate = (customers: CrmCustomer[]) => {
  if (customers.length === 0) return 0;
  const repeatCustomers = customers.filter((customer) => customer.totalOrders > 1).length;
  return Number(((repeatCustomers / customers.length) * 100).toFixed(1));
};

export const calculateAverageOrderValue = (customers: CrmCustomer[]) => {
  const totals = customers.reduce(
    (acc, customer) => {
      acc.orderCount += customer.totalOrders;
      acc.revenue += customer.totalSpend;
      return acc;
    },
    { orderCount: 0, revenue: 0 }
  );

  if (totals.orderCount === 0) return 0;
  return Math.round(totals.revenue / totals.orderCount);
};

export const getCrmOverviewKpis = (): CrmKpi[] => {
  const totalCustomers = crmCustomers.length;
  const activeCustomers = crmCustomers.filter((customer) => customer.status === "active").length;
  const inactiveCustomers = crmCustomers.filter((customer) => customer.status === "inactive").length;
  const vipCustomers = crmCustomers.filter((customer) => customer.status === "vip").length;
  const repeatOrderRate = calculateRepeatOrderRate(crmCustomers);
  const averageOrderValue = calculateAverageOrderValue(crmCustomers);
  const crmRevenue = crmCustomers.reduce((sum, customer) => sum + customer.totalSpend, 0);
  const openComplaints = crmComplaints.filter((complaint) => complaint.status === "open").length;

  return [
    { label: "Total Customers", value: totalCustomers },
    { label: "Active Customers", value: activeCustomers },
    { label: "Inactive Customers", value: inactiveCustomers },
    { label: "VIP Customers", value: vipCustomers },
    { label: "Repeat Order Rate", value: repeatOrderRate },
    { label: "Average Order Value", value: averageOrderValue },
    { label: "CRM Revenue", value: crmRevenue },
    { label: "Open Complaints", value: openComplaints },
  ];
};

export const getCustomerById = (customerId: string) =>
  crmCustomers.find((customer) => customer.id === customerId) ?? null;

export const getCustomerOrders = (customerId: string) =>
  crmCustomerOrders
    .filter((order) => order.customerId === customerId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

export const getCustomerNotes = (customerId: string) =>
  crmCustomerNotes
    .filter((note) => note.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const getCustomerComplaints = (customerId: string) =>
  crmComplaints
    .filter((complaint) => complaint.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const getCustomerLoyaltyActivity = (customerId: string) =>
  crmLoyaltyActivity
    .filter((activity) => activity.customerId === customerId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export const topCustomers = [...crmCustomers].sort((a, b) => b.totalSpend - a.totalSpend).slice(0, 5);

export const recentCustomers = [...crmCustomers]
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice(0, 5);

export const followUpCustomers = crmCustomers
  .filter((customer) => customer.needsFollowUp)
  .sort((a, b) => new Date(a.lastOrderDate).getTime() - new Date(b.lastOrderDate).getTime())
  .slice(0, 5);

export const recentComplaints = [...crmComplaints]
  .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  .slice(0, 5);
