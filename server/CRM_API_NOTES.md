# CRM API Notes

## Routes Added
- `GET /api/crm/customers`
- `POST /api/crm/customers`
- `GET /api/crm/customers/:id`
- `GET /api/crm/customers/:id/orders`
- `GET /api/crm/customers/:id/loyalty-activity`
- `GET /api/crm/loyalty`
- `POST /api/crm/loyalty/adjustments`
- `GET /api/crm/customers/:id/notes`
- `POST /api/crm/customers/:id/notes`
- `GET /api/crm/customers/:id/complaints`
- `GET /api/crm/complaints`
- `POST /api/crm/complaints`
- `PATCH /api/crm/complaints/:id/status`
- `GET /api/crm/campaigns`
- `POST /api/crm/campaigns`
- `PATCH /api/crm/campaigns/:id/status`
- `POST /api/crm/campaigns/:id/duplicate`
- `GET /api/crm/campaigns/:id/recipients`

All routes are protected with existing middleware:
- `protect`
- `adminOnly`

## Models Added
- `CustomerNote` (`server/models/CustomerNote.js`)
- `Complaint` (`server/models/Complaint.js`)
- `Campaign` (`server/models/Campaign.js`)

## Loyalty Model Reuse
- Reused `LoyaltyPoints` (`server/models/LoyaltyPoints.js`) for:
  - loyalty aggregate derivation via transaction aggregation
  - loyalty activity history (newest first)
  - manual CRM loyalty adjustments
- No duplicate loyalty aggregate model was created.
- Added optional `createdBy` and `createdByName` fields to `LoyaltyPoints` so CRM manual adjustments can store actor metadata without changing existing order-reward behavior.

## Data Sources Used
- `User` model (`server/models/User.js`) as primary customer source.
- `Order` model (`server/models/Order.js`) for order count/spend/last order/favorite product and complaint order validation.
- `LoyaltyPoints` model (`server/models/LoyaltyPoints.js`) for derived loyalty balance.
- `CustomerProfile` model (`server/models/CustomerProfile.js`) for preferred order type.
- `CustomerNote` model for persistent CRM notes.
- `Complaint` model for persistent CRM complaints.

## Validation Rules
- Manual CRM customer create (`POST /api/crm/customers`):
  - `name` required
  - `phone` required
  - `email` optional; validated when provided
  - `loyaltyPoints` optional; must be `>= 0`
  - `status` optional; must be one of `active|inactive|vip` (default `active`)
  - `needsFollowUp` optional boolean (default `false`)
  - duplicate email/phone returns `409`
  - route protected with `protect` + `adminOnly`
- Customer create behavior:
  - Reuses existing `User` model with `role: "customer"`.
  - Uses bcrypt hashing flow to store a generated placeholder password.
  - Creates/updates `CustomerProfile` for CRM-facing optional fields.
  - If `loyaltyPoints > 0`, seeds a `LoyaltyPoints` adjustment entry and aligns profile balance.
- Notes:
  - customer must exist and be `role: "customer"`.
  - `text` is required.
  - `type` must be one of `general|preference|complaint|follow_up`.
  - `createdBy` uses `req.user._id` when available.
  - `createdByName` uses `req.user.name` fallback `"Admin"`.
- Complaints:
  - `customerId` is required and must exist as a customer user.
  - `orderId` is optional; when provided it must exist in `Order`.
  - `issueType` is required.
  - `description` is required.
  - `priority` must be one of `low|medium|high` (default `medium`).
  - `status` defaults to `open`.
  - `PATCH /status` requires `status` in `open|in_progress|resolved`.
  - `resolvedAt` is set when status becomes `resolved`, cleared when moved back to non-resolved.

## Customer Follow-Up Logic
- `needsFollowUp` is true if:
  - customer is inactive by last order date rule, or
  - customer has at least one complaint in `open` or `in_progress`.

## Query Support
- `GET /api/crm/customers`:
  - `search`, `status`, `sort`
- `GET /api/crm/complaints`:
  - `search`, `status`, `issueType`, `sort`
  - supported sort values: `newest`, `oldest`, `customer`, `status`
- `GET /api/crm/campaigns`:
  - `search`, `status`, `channel`, `sort`
  - supported sort values: `newest`, `oldest`, `most_recipients`, `status`

## Campaign Recipient Segment Rules
- `vip` / `VIP Customers`: `status === "vip"` OR `totalSpend >= 5000`
- `active` / `Active Customers`: `status === "active"`
- `inactive` / `Inactive Customers`: `status === "inactive"` OR `lastOrderDate` older than 30 days
- `new` / `New Customers`: `totalOrders <= 1`
- `high_spenders` / `High Spenders`: `totalSpend >= 3000`
- `frequent_buyers` / `Frequent Buyers`: `totalOrders >= 5`
- `needs_follow_up` / `Needs Follow-up`: `needsFollowUp === true`
- `loyalty_champions` / `Loyalty Champions`: `loyaltyPoints >= 500`

## Campaign Behavior Notes
- Campaigns are persisted in MongoDB and exposed via protected CRM endpoints.
- `recipientCount` is calculated from current segment membership at creation time and duplication.
- `PATCH /campaigns/:id/status` updates status/scheduling metadata and maintains `sentAt` consistency.
- `GET /campaigns/:id/recipients` returns current customer preview list for campaign segment.
- No real WhatsApp/SMS/Email delivery is implemented in this module (planning/tracking only).

## Loyalty Endpoint Behavior
- `GET /api/crm/loyalty` returns:
  - CRM customer list with `loyaltyPoints`
  - recent loyalty activity mapped to CRM shape (`id`, `customerId`, `type`, `points`, `description`, `createdAt`)
  - summary block:
    - `totalLoyaltyCustomers`: customers with `loyaltyPoints > 0`
    - `totalActivePoints`: sum of all customer loyalty points
    - `pointsEarned`: sum of activity points where type is `earned`
    - `pointsRedeemed`: sum of absolute activity points where type is `redeemed`
    - `loyaltyChampions`: customers with `loyaltyPoints >= 500`
    - `averagePointsPerCustomer`: `totalActivePoints / total customers`
- `GET /api/crm/customers/:id/loyalty-activity` now returns real loyalty activity from `LoyaltyPoints` (newest first).
- `POST /api/crm/loyalty/adjustments` validation:
  - `customerId` required and must exist as customer
  - `type` required: `earned | redeemed | adjusted`
  - `points` required and must be positive
  - `description` required
- Adjustment rules:
  - `earned`: adds points
  - `redeemed`: subtracts points and blocks balance below 0
  - `adjusted`: currently adds points as manual positive adjustment
  - `createdBy` uses `req.user._id` when available
  - `createdByName` uses `req.user.name` fallback `"Admin"`

## TODOs
- Frontend CRM API integration with mock fallback toggle.
- Real delivery provider integration for campaign sending (WhatsApp/SMS/Email).
- Explicit CRM permission key checks (`requirePermission`) once permission catalog keys are finalized.
- Optional pagination for CRM list endpoints if datasets grow.

## Final Status (May 1, 2026)
- CRM frontend integration status: frontend CRM routes are integrated to API-first data loading with mock fallback safety.
- CRM backend API status: all documented minimal CRM endpoints are implemented with stable envelope responses for frontend services.
- Env flag: set `NEXT_PUBLIC_CRM_USE_API=true` to enable API-first CRM behavior.

### Remaining Production TODOs
- install dependencies and run real build
- add CRM permission keys
- add pagination for large datasets
- optional real campaign delivery provider integration
- optional backend segment endpoint
- optional remove mock fallback after production stabilization
