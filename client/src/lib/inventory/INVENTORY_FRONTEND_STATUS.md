# Inventory Frontend Status

## Feature Flag
- `NEXT_PUBLIC_INVENTORY_USE_API=true` enables API-first mode.
- `true`: try backend first, fallback to local/mock on failure.
- `false` or missing: local/mock only.

## Integrated Pages (API-first + mock fallback)
- `/ops/inventory/items`
- `/ops/inventory/purchase-requests`
- `/ops/inventory/purchase-orders`
- `/ops/inventory/stock-in`
- `/ops/inventory/issues`
- `/ops/inventory/waste`
- `/ops/inventory/returns`
- `/ops/inventory/batches`
- `/ops/inventory/adjustments`
- `/ops/inventory/transfers`
- `/ops/inventory/vendors`
- `/ops/inventory/vendor-prices`
- `/ops/inventory/goods-received`
- `/ops/inventory/vendor-bills`
- `/ops/inventory/vendor-payments`
- `/ops/inventory/purchase-returns`

## Fallback Behavior
- Pages show loading state while initial fetch runs.
- If API was attempted and failed, banner is shown:
  - `Showing mock inventory data because backend is unavailable.`
- Create/update/status actions use data-source helpers and keep local fallback active.

## Pages Still Local-only
- Stock Overview
- Stock Movements
- Categories & Units
- Supplier Mapping
- Pricing & Cost
- Stock Counts
- Reorder Alerts
- Expiry Alerts
- Inventory Valuation
- COGS Summary
- Variance Report
- Slow Moving Stock

## Reporting Note
- Report pages remain local-derived until backend reporting endpoints exist.

## Remaining Future Work
- Report backend endpoints
- Pagination
- Role permissions
- Cross-page persistent state
- PO/GRN stock posting
- Audit logs
