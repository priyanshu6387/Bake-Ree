# Bake-Ree Order Lifecycle API Contracts

This document defines the active API contracts used by customer checkout, ops, kitchen, logistics, and post-order support.

## Core Statuses

`APPROVAL_PENDING`, `PENDING`, `PREPARING`, `READY_FOR_HANDOFF`, `DISPATCH_ASSIGNED`, `OUT_FOR_DELIVERY`, `PICKUP_READY`, `PICKED_UP`, `DELIVERED`, `COMPLETED`, `HOLD`, `CANCELLED`

## Transition Matrix

| From | To | Trigger |
|---|---|---|
| `APPROVAL_PENDING` | `PENDING` | approve |
| `APPROVAL_PENDING` | `CANCELLED` | reject |
| `PENDING` | `PREPARING` | `START_PREPARING` |
| `PREPARING` | `READY_FOR_HANDOFF` | `MARK_READY_FOR_HANDOFF` |
| `PREPARING` | `HOLD` | `HOLD` |
| `HOLD` | `PREPARING` | `RESUME_FROM_HOLD` |
| `READY_FOR_HANDOFF` | `DISPATCH_ASSIGNED` | `AUTO_NEXT` delivery |
| `READY_FOR_HANDOFF` | `PICKUP_READY` | `AUTO_NEXT` pickup |
| `DISPATCH_ASSIGNED` | `OUT_FOR_DELIVERY` | `MARK_OUT_FOR_DELIVERY` |
| `OUT_FOR_DELIVERY` | `DELIVERED` | `MARK_DELIVERED` |
| `PICKUP_READY` | `PICKED_UP` | `MARK_PICKED_UP` |
| `PICKED_UP` | `DELIVERED` | `MARK_DELIVERED` |
| `DELIVERED` | `COMPLETED` | `MARK_COMPLETED` |

## Endpoints

### Orders

1. `POST /api/orders`  
   Creates order with `APPROVAL_PENDING` by default and captures allergy fields.

2. `PATCH /api/orders/:id/approve`  
   Ops decision body:
   ```json
   { "decision": "APPROVE|REJECT", "reason": "optional note" }
   ```

3. `PATCH /api/orders/:id/lifecycle`  
   Lifecycle body:
   ```json
   {
     "action": "START_PREPARING|MARK_READY_FOR_HANDOFF|AUTO_NEXT|MARK_OUT_FOR_DELIVERY|MARK_PICKED_UP|MARK_DELIVERED|MARK_COMPLETED|HOLD|RESUME_FROM_HOLD|CANCEL",
     "notes": "optional",
     "hold": { "reason": "required for HOLD", "severity": "INFO|WARNING|CRITICAL", "notes": "optional" }
   }
   ```

4. `GET /api/orders/ops/live`  
   Active queue with SLA metadata.

5. `GET /api/orders/ops/summary`  
   KPI summary (`totalActive`, `approvalPending`, `requestsOpen`, `byStatus`).

6. `GET /api/orders/ops/sla`  
   SLA dataset by active order.

7. `GET /api/orders/ops/refunds`  
   Post-order request queue.

### Post-Order Requests

8. `POST /api/orders/:id/requests`  
   Customer/admin submission:
   ```json
   { "type": "ISSUE|RETURN|REFUND", "reason": "required", "description": "optional", "refundAmount": 0 }
   ```

9. `GET /api/orders/:id/requests`  
   Requests for a single order.

10. `GET /api/orders/requests`  
    Ops/admin list with optional `status` and `type`.

11. `PATCH /api/orders/requests/:requestId/review`  
    Review decision:
    ```json
    { "decision": "APPROVE|REJECT|REVIEW", "reviewNotes": "optional", "refundAmount": 0 }
    ```

12. `PATCH /api/orders/requests/:requestId/resolve`  
    Resolution:
    ```json
    { "status": "RESOLVED|REFUNDED", "resolutionNotes": "optional" }
    ```

### Profile Allergies

13. `PUT /api/auth/profile`  
    Supports allergy defaults:
    ```json
    {
      "name": "optional",
      "email": "optional",
      "phone": "optional",
      "allergyPreferences": {
        "allergies": ["nuts", "dairy"],
        "notes": "cross-contamination risk"
      }
    }
    ```

## Socket Events

`order:created`, `order:approvalUpdated`, `order:statusUpdated`, `order:requestCreated`, `order:requestReviewed`

Audience routing:
- user room: `user:{userId}`
- ops room: `admin`
- kitchen room: `kitchen`
