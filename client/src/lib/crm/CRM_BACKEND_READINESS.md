# CRM Backend Readiness

## Frontend CRM API Toggle
- Set `NEXT_PUBLIC_CRM_USE_API=true` to enable CRM customer API usage in:
  - `/ops/crm`
  - `/ops/crm/customers`
  - `/ops/crm/customers/:id`
  - `/ops/crm/complaints`
- If `NEXT_PUBLIC_CRM_USE_API` is missing or not `"true"`, these pages use existing CRM mock data.
- If API mode is enabled but backend calls fail, pages automatically fall back to mock data.

## Manual Customer Creation (Customers Page)
- `/ops/crm/customers` now includes an **Add Customer** action with a modal form.
- Form fields:
  - required: `name`, `phone`
  - optional: `email`, `favoriteProduct`, `loyaltyPoints`, `status`, `needsFollowUp`, `preferenceNotes`
- Validation:
  - `name` required
  - `phone` required
  - `email` format validated when provided
  - `loyaltyPoints >= 0`
- Data behavior:
  - API mode (`NEXT_PUBLIC_CRM_USE_API=true`): attempts `POST /api/crm/customers` first.
  - API failure: falls back to local customer object and prepends to current table state.
  - Mock mode: creates local customer object only.
  - Imported mock arrays are never mutated.

## Complaints Integration
- Complaints page now supports API-first integration.
- `GET /api/crm/complaints` is used when `NEXT_PUBLIC_CRM_USE_API=true`.
- `PATCH /api/crm/complaints/:id/status` is used for complaint status updates.
- Mock fallback remains active when API calls fail.

## Campaigns Integration
- Campaigns page now supports API-first integration.
- `NEXT_PUBLIC_CRM_USE_API=true` enables:
  - `GET /api/crm/campaigns`
  - `POST /api/crm/campaigns`
  - `PATCH /api/crm/campaigns/:id/status`
  - `GET /api/crm/campaigns/:id/recipients`
  - `POST /api/crm/campaigns/:id/duplicate` (service/data-source wired; current UI still uses copy-to-form duplicate UX)
- Mock/local fallback remains active for campaign load/create/status/recipients.
- Real WhatsApp/SMS/Email sending is not implemented.

## Loyalty Integration
- Loyalty page now supports API-first integration.
- `NEXT_PUBLIC_CRM_USE_API=true` enables:
  - `GET /api/crm/loyalty`
  - `POST /api/crm/loyalty/adjustments`
- Mock/local fallback remains active when loyalty API calls fail.
- Loyalty adjustment updates are backend-persistent only in API mode.

## Current frontend routes
- `/admin/crm` -> redirects to `/ops/crm`
- `/admin/crm/customers` -> redirects to `/ops/crm/customers`
- `/admin/crm/customers/:id` -> redirects to `/ops/crm/customers/:id`
- `/admin/crm/complaints` -> redirects to `/ops/crm/complaints`
- `/admin/crm/segments` -> redirects to `/ops/crm/segments`
- `/admin/crm/campaigns` -> redirects to `/ops/crm/campaigns`
- `/admin/crm/loyalty` -> redirects to `/ops/crm/loyalty`

## Current mock datasets
- `crmCustomers`
- `crmComplaints`
- `crmCustomerOrders`
- `crmCustomerNotes`
- `crmLoyaltyActivity`

## Suggested API endpoints
- `GET /api/crm/customers`
- `POST /api/crm/customers`
- `GET /api/crm/customers/:id`
- `GET /api/crm/customers/:id/orders`
- `GET /api/crm/customers/:id/notes`
- `POST /api/crm/customers/:id/notes`
- `GET /api/crm/complaints`
- `PATCH /api/crm/complaints/:id/status`
- `GET /api/crm/segments`
- `GET /api/crm/campaigns`
- `POST /api/crm/campaigns`
- `PATCH /api/crm/campaigns/:id/status`
- `GET /api/crm/loyalty`
- `POST /api/crm/loyalty/adjustments`

## Suggested database models
- `Customer` (or CRM extension of existing user profile)
- `CustomerNote`
- `Complaint`
- `Campaign`
- `LoyaltyActivity`
- `AssignedCoupon` (optional for future coupon integration)

## Modules currently using local-only state
- Complaints: local fallback updates are used if complaint API calls fail or API mode is disabled.
- Customer 360: newly created notes are local state only when API is unavailable.
- Campaigns: API-first with local fallback; duplicate action in UI currently copies campaign into form (no direct send action).
- Loyalty: points adjustments are local-only when API mode is disabled or when API fallback is used.

## Final Status (May 1, 2026)
- CRM frontend integration status: API-first with resilient mock fallback is in place for customers, complaints, campaigns, loyalty, and customer detail flows.
- CRM backend API status: CRM routes/controllers/services/models are wired and aligned to frontend response envelopes.
- Env flag: set `NEXT_PUBLIC_CRM_USE_API=true` to enable API-first CRM behavior.

### Remaining Production TODOs
- install dependencies and run real build
- add CRM permission keys
- add pagination for large datasets
- optional real campaign delivery provider integration
- optional backend segment endpoint
- optional remove mock fallback after production stabilization
