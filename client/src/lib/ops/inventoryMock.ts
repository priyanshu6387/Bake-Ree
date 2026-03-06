type InventoryKpiTone = "neutral" | "positive" | "warning" | "critical";

export const inventoryKpis: Array<{
  label: string;
  value: string;
  hint: string;
  tone: InventoryKpiTone;
}> = [
  { label: "Total Items", value: "1,284", hint: "Across 6 warehouses", tone: "neutral" },
  { label: "Total Value", value: "$2.48M", hint: "Weighted avg costing", tone: "positive" },
  { label: "Low Stock SKUs", value: "38", hint: "Below reorder point", tone: "warning" },
  { label: "Expiring (7/14)", value: "21 / 46", hint: "Batches near expiry", tone: "warning" },
  { label: "Waste (Week)", value: "$12.4K", hint: "1.6% of purchases", tone: "critical" },
];

export const stockValueTrend = [12, 18, 22, 16, 20, 14, 19, 23];
export const wasteTrend = [10, 12, 9, 14, 11, 13, 12, 15];

export const criticalItems = [
  {
    id: "itm-001",
    item: "Butter Unsalted 82%",
    warehouse: "Central Bakehouse",
    available: "42 kg",
    daysCover: "1.8",
    status: "Low",
  },
  {
    id: "itm-002",
    item: "All-purpose Flour",
    warehouse: "Central Bakehouse",
    available: "210 kg",
    daysCover: "3.4",
    status: "Watch",
  },
  {
    id: "itm-003",
    item: "Chocolate Couverture",
    warehouse: "West Hub",
    available: "18 kg",
    daysCover: "1.2",
    status: "Critical",
  },
];

export const ledgerRows = [
  {
    id: "led-001",
    ts: "Jan 21, 2026 09:42",
    item: "Butter Unsalted 82%",
    type: "OUT",
    qty: "-18 kg",
    warehouse: "Central Bakehouse",
    ref: "WO-1292",
    cost: "$94.50",
  },
  {
    id: "led-002",
    ts: "Jan 21, 2026 08:18",
    item: "Flour AP",
    type: "IN",
    qty: "+500 kg",
    warehouse: "Central Bakehouse",
    ref: "GRN-4831",
    cost: "$612.00",
  },
  {
    id: "led-003",
    ts: "Jan 20, 2026 18:02",
    item: "Milk 3.5%",
    type: "WASTE",
    qty: "-12 L",
    warehouse: "East Store",
    ref: "WST-2201",
    cost: "$22.80",
  },
];

export const batchRows = [
  {
    id: "bat-100",
    item: "Milk 3.5%",
    lot: "MLK-2026-0118",
    exp: "Jan 26, 2026",
    qty: "86 L",
    warehouse: "East Store",
    status: "Soon",
  },
  {
    id: "bat-101",
    item: "Butter Unsalted 82%",
    lot: "BUT-2026-0109",
    exp: "Feb 10, 2026",
    qty: "42 kg",
    warehouse: "Central Bakehouse",
    status: "Ok",
  },
  {
    id: "bat-102",
    item: "Chocolate Couverture",
    lot: "CHO-2025-1201",
    exp: "Jan 25, 2026",
    qty: "18 kg",
    warehouse: "West Hub",
    status: "Soon",
  },
];

export const fefoAllocations = [
  {
    id: "fefo-001",
    item: "Milk 3.5%",
    request: "Order #8892",
    batch: "MLK-2026-0118",
    exp: "Jan 26, 2026",
    qty: "12 L",
    status: "Reserved",
  },
  {
    id: "fefo-002",
    item: "Butter Unsalted 82%",
    request: "WO-1292",
    batch: "BUT-2026-0109",
    exp: "Feb 10, 2026",
    qty: "18 kg",
    status: "Consumed",
  },
];

export const lowStockAlerts = [
  {
    id: "lsa-01",
    item: "Butter Unsalted 82%",
    available: "42 kg",
    daily: "23 kg",
    cover: "1.8 days",
    reorder: "120 kg",
  },
  {
    id: "lsa-02",
    item: "Yeast Instant",
    available: "8 kg",
    daily: "5 kg",
    cover: "1.6 days",
    reorder: "30 kg",
  },
];

export const expiryAlerts = [
  {
    id: "exp-01",
    item: "Milk 3.5%",
    lot: "MLK-2026-0118",
    exp: "Jan 26, 2026",
    qty: "86 L",
    action: "Use ASAP",
  },
  {
    id: "exp-02",
    item: "Chocolate Couverture",
    lot: "CHO-2025-1201",
    exp: "Jan 25, 2026",
    qty: "18 kg",
    action: "Consider RTV",
  },
];

export const replenishmentLines = [
  {
    id: "rep-01",
    item: "Butter Unsalted 82%",
    suggestion: "120 kg",
    reason: "Below reorder point + high velocity",
    vendor: "DairyFresh Co.",
  },
  {
    id: "rep-02",
    item: "Yeast Instant",
    suggestion: "30 kg",
    reason: "Safety stock deficit",
    vendor: "Bakers Supply",
  },
];

export const itemMasterRows = [
  {
    id: "im-01",
    sku: "ING-1021",
    name: "Butter Unsalted 82%",
    type: "Ingredient",
    uom: "kg",
    reorder: "120 kg",
  },
  {
    id: "im-02",
    sku: "PKG-2210",
    name: "Cake Box 10 inch",
    type: "Packaging",
    uom: "pcs",
    reorder: "400 pcs",
  },
];

export const categoryRows = [
  {
    id: "cat-01",
    category: "Dairy",
    uom: "kg",
    conversions: "g, lb",
  },
  {
    id: "cat-02",
    category: "Packaging",
    uom: "pcs",
    conversions: "case",
  },
];

export const recipeRows = [
  {
    id: "rec-01",
    recipe: "Croissant",
    bomVersion: "v4",
    yield: "420 pcs",
    status: "Active",
  },
];

export const storageRuleRows = [
  {
    id: "stor-01",
    item: "Milk 3.5%",
    tempZone: "Chilled",
    shelfLife: "7 days",
    allergens: "Dairy",
  },
];

export const supplierMapRows = [
  {
    id: "sup-01",
    item: "Butter Unsalted 82%",
    vendor: "DairyFresh Co.",
    leadTime: "3 days",
    preferred: "Yes",
  },
];

export const pricingRows = [
  {
    id: "prc-01",
    item: "Butter Unsalted 82%",
    current: "$4.85/kg",
    last: "$4.70/kg",
    variance: "+3.2%",
  },
];

export const adjustmentRows = [
  {
    id: "adj-01",
    item: "Milk 3.5%",
    batch: "MLK-2026-0118",
    delta: "-4 L",
    reason: "Damage",
    approvedBy: "A. Kapoor",
  },
  {
    id: "adj-02",
    item: "Flour AP",
    batch: "FLR-2026-0105",
    delta: "+12 kg",
    reason: "Count variance",
    approvedBy: "S. Rao",
  },
];

export const transferRows = [
  {
    id: "trf-01",
    item: "Butter Unsalted 82%",
    qty: "40 kg",
    from: "Central Bakehouse",
    to: "North Store",
    status: "In Transit",
  },
  {
    id: "trf-02",
    item: "Chocolate Couverture",
    qty: "10 kg",
    from: "West Hub",
    to: "Central Bakehouse",
    status: "Received",
  },
];

export const wasteRows = [
  {
    id: "wst-01",
    item: "Milk 3.5%",
    qty: "12 L",
    cost: "$22.80",
    reason: "Expiry",
  },
  {
    id: "wst-02",
    item: "Croissant Dough",
    qty: "6 kg",
    cost: "$19.20",
    reason: "Process loss",
  },
];

export const receivingRows = [
  {
    id: "grn-01",
    po: "PO-4821",
    vendor: "DairyFresh Co.",
    lines: "8",
    qc: "Passed",
  },
  {
    id: "grn-02",
    po: "PO-4825",
    vendor: "Bakers Supply",
    lines: "12",
    qc: "Partial",
  },
];

export const productionIssueRows = [
  {
    id: "iss-01",
    workOrder: "WO-1292",
    item: "Butter Unsalted 82%",
    qty: "18 kg",
    status: "Issued",
  },
  {
    id: "iss-02",
    workOrder: "WO-1293",
    item: "Flour AP",
    qty: "120 kg",
    status: "Pending",
  },
];

export const productionOutputRows = [
  {
    id: "out-01",
    workOrder: "WO-1292",
    item: "Croissant (Finished)",
    batch: "FG-1292-A",
    qty: "420 pcs",
    status: "Posted",
  },
];

export const returnRows = [
  {
    id: "rtv-01",
    vendor: "DairyFresh Co.",
    item: "Milk 3.5%",
    qty: "40 L",
    status: "Credit Pending",
  },
];

export const customerReturnRows = [
  {
    id: "cr-01",
    order: "ORD-8821",
    item: "Sourdough Loaf",
    qty: "8 pcs",
    decision: "Discard",
  },
];

export const replacementRows = [
  {
    id: "rep-01",
    original: "Butter Unsalted 82%",
    substitute: "Butter Unsalted 80%",
    reason: "Short supply",
    impact: "+1.2% cost",
  },
];

export const valuationRows = [
  {
    id: "val-01",
    item: "Butter Unsalted 82%",
    warehouse: "Central Bakehouse",
    value: "$38,400",
    method: "WAVG",
  },
  {
    id: "val-02",
    item: "Chocolate Couverture",
    warehouse: "West Hub",
    value: "$12,600",
    method: "FIFO",
  },
];

export const cogsRows = [
  { id: "cogs-01", period: "Jan 2026", cogs: "$482K", waste: "$12.4K", variance: "1.8%" },
];

export const varianceRows = [
  {
    id: "var-01",
    item: "Butter Unsalted 82%",
    expected: "1.2 kg/100",
    actual: "1.4 kg/100",
    variance: "+16.7%",
  },
];

export const turnRows = [
  {
    id: "turn-01",
    item: "Flour AP",
    turns: "13.4",
    daysOnHand: "22",
    velocity: "High",
  },
];

export const slowMovingRows = [
  {
    id: "slow-01",
    item: "Holiday Sprinkles",
    lastMove: "Nov 20, 2025",
    onHand: "18 kg",
  },
];

export const plRows = [
  {
    id: "pl-01",
    period: "Jan 2026",
    purchases: "$510K",
    cogs: "$482K",
    waste: "$12.4K",
    closing: "$2.48M",
  },
];

export const auditTrailRows = [
  {
    id: "aud-01",
    entry: "LED-48291",
    user: "A. Kapoor",
    action: "Adjustment approved",
    ts: "Jan 21, 2026 10:02",
  },
];
