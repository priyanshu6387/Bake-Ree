# Bake-Ree Order Lifecycle Architecture

This document is the canonical reference for the end-to-end order lifecycle across customer checkout, ops approval, kitchen execution, delivery, and post-order requests.

## 1) Architecture Diagram

```mermaid
flowchart LR
  subgraph FE[Frontend Apps]
    CUST[Customer App\n(/, /cart, /payment, /dashboard)]
    OPS[Ops Console\n(/ops/orders, /ops/logistics)]
    KDS[Kitchen Console\n(/kitchen)]
    TRK[Tracking UI\n(/track/:orderId)]
  end

  subgraph BE[Backend Services]
    API[Express REST API]
    SOCK[Socket.io Gateway]
    LIFE[Lifecycle/Approval Services]
    DEL[Delivery Services]
    LOY[Loyalty/Tier Services]
  end

  subgraph DB[Data Layer]
    MONGO[(MongoDB)]
  end

  CUST -->|REST| API
  OPS -->|REST| API
  KDS -->|REST| API
  TRK -->|REST| API

  CUST <-->|WS| SOCK
  OPS <-->|WS| SOCK
  KDS <-->|WS| SOCK
  TRK <-->|WS| SOCK

  API --> LIFE
  API --> DEL
  API --> LOY
  API <--> MONGO
  LIFE <--> MONGO
  DEL <--> MONGO
  LOY <--> MONGO
  API <--> SOCK
```

## 2) End-to-End Sequence Diagram

```mermaid
sequenceDiagram
  actor U as Customer
  participant UI as Checkout UI
  participant API as Order API
  participant DB as MongoDB
  participant OPS as Ops Console
  participant KDS as Kitchen Console
  participant DLV as Delivery Service
  participant WS as Socket.io

  U->>UI: Place order (items + address + allergies)
  UI->>API: POST /api/orders
  API->>DB: Create order (APPROVAL_PENDING)
  API->>WS: order:created
  WS-->>OPS: New approval-required order
  WS-->>UI: Order created

  OPS->>API: PATCH /api/orders/:id/approve
  API->>DB: status=PENDING + approval audit
  API->>WS: order:approvalUpdated
  WS-->>KDS: Approved order visible

  KDS->>API: PATCH /api/orders/:id/lifecycle PREPARING
  API->>DB: Update status + event log
  API->>WS: order:statusUpdated

  KDS->>API: PATCH /api/orders/:id/lifecycle READY_FOR_HANDOFF
  API->>DLV: Create/attach delivery
  DLV->>API: delivery status updates
  API->>DB: DISPATCH_ASSIGNED -> OUT_FOR_DELIVERY -> DELIVERED -> COMPLETED
  API->>WS: order:statusUpdated
  WS-->>UI: Live tracking updates
```

## 3) Complete System Flow Diagram

```mermaid
flowchart TD
  A[Customer Checkout] --> B[Create Order: APPROVAL_PENDING]
  B --> C{Ops Approval}
  C -- Approved --> D[PENDING]
  C -- Rejected --> X[CANCELLED with reason]

  D --> E[Kitchen PREPARING]
  E --> F{Kitchen exception?}
  F -- Yes --> G[HOLD + issue request]
  G --> H{Ops review}
  H -- Resume --> E
  H -- Cancel --> X
  F -- No --> I[READY_FOR_HANDOFF]

  I --> J{Order Type}
  J -- Delivery --> K[DISPATCH_ASSIGNED]
  K --> L[OUT_FOR_DELIVERY]
  L --> M[DELIVERED]
  J -- Pickup --> N[PICKUP_READY]
  N --> O[PICKED_UP]
  O --> M

  M --> P[COMPLETED + loyalty update]
  P --> Q{Post-order request?}
  Q -- No --> Z[End]
  Q -- Issue/Return/Refund --> R[Create OrderRequest: OPEN]
  R --> S{Admin review}
  S -- Approved --> T[RESOLVED / REFUNDED]
  S -- Rejected --> Y[Closed rejected]
```

## 4) Order State Diagram (Implementation Authority)

```mermaid
stateDiagram-v2
  [*] --> APPROVAL_PENDING
  APPROVAL_PENDING --> PENDING: approve
  APPROVAL_PENDING --> CANCELLED: reject

  PENDING --> PREPARING
  PREPARING --> READY_FOR_HANDOFF
  PREPARING --> HOLD
  HOLD --> PREPARING: resume
  HOLD --> CANCELLED: cancel

  READY_FOR_HANDOFF --> DISPATCH_ASSIGNED: delivery
  READY_FOR_HANDOFF --> PICKUP_READY: pickup

  DISPATCH_ASSIGNED --> OUT_FOR_DELIVERY
  OUT_FOR_DELIVERY --> DELIVERED
  PICKUP_READY --> PICKED_UP
  PICKED_UP --> DELIVERED

  DELIVERED --> COMPLETED
  CANCELLED --> [*]
  COMPLETED --> [*]
```
