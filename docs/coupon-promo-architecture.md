# Bake-Ree Coupon & Promo System Architecture

This document defines the coupon management and promo code lifecycle across customer checkout, CRM recommendations, and ops/admin governance.

## 1) Architecture Diagram

```mermaid
flowchart LR
  subgraph FE[Frontend]
    CUST[Customer App\n/cart, /payment, /dashboard]
    OPS[Ops Coupon Console\n/ops/crm/engagement/offers]
    CRM[CRM Analytics]
  end

  subgraph BE[Backend]
    API[Express API]
    CPL[Coupon Policy Engine]
    RES[Reservation + Redemption Service]
    REC[Recommendation Generator]
    EXP[Expiry Logic]
  end

  subgraph DB[MongoDB]
    CPN[(coupons)]
    ASN[(coupon_assignments)]
    RSV[(coupon_reservations)]
    RED[(coupon_redemptions)]
    ORD[(orders)]
    CPR[(customer_profiles)]
  end

  CUST --> API
  OPS --> API
  CRM --> API

  API --> CPL
  API --> RES
  API --> REC
  API --> EXP

  CPL <--> CPN
  CPL <--> ASN
  RES <--> RSV
  RES <--> RED
  RES <--> ORD
  REC <--> CPR
```

## 2) Sequence Diagram (Apply + Checkout)

```mermaid
sequenceDiagram
  actor U as Customer
  participant UI as Cart/Payment UI
  participant API as Coupon API
  participant DB as MongoDB
  participant ORD as Order API

  U->>UI: Enter coupon code
  UI->>API: POST /api/coupons/validate
  API->>DB: Check code, status, expiry, eligibility, limits
  API-->>UI: Coupon pricing preview

  U->>UI: Place order
  UI->>API: POST /api/coupons/reserve
  API->>DB: Create reservation token (expires in 15 min)
  API-->>UI: reservationToken + final discount

  UI->>ORD: POST /api/orders (reservationToken)
  ORD->>DB: Consume reservation + create redemption + create order
  ORD-->>UI: Order created with coupon snapshot
```

## 3) Complete System Flow Diagram

```mermaid
flowchart TD
  A[Admin creates coupon] --> B[Coupon in DRAFT/ACTIVE]
  B --> C{Audience Type}
  C -- GENERAL --> D[Available by code]
  C -- TARGETED --> E[Assign to users]
  C -- RECOMMENDED --> F[Run recommendation engine]
  F --> E

  D --> G[Customer validates code]
  E --> G
  G --> H{Valid now?}
  H -- No --> I[Reject with reason]
  H -- Yes --> J[Reserve token]

  J --> K[Checkout places order]
  K --> L{Reservation active?}
  L -- No --> I
  L -- Yes --> M[Consume reservation]
  M --> N[Create redemption ledger]
  N --> O[Persist order with coupon snapshot]

  B --> P[Expiry checks]
  P --> Q[ACTIVE -> EXPIRED]
  Q --> R[Assignments expire]
```

## 4) Coupon Status State Diagram

```mermaid
stateDiagram-v2
  [*] --> DRAFT
  DRAFT --> ACTIVE
  ACTIVE --> PAUSED
  PAUSED --> ACTIVE
  ACTIVE --> EXPIRED
  PAUSED --> EXPIRED
  EXPIRED --> ARCHIVED
  DRAFT --> ARCHIVED
  ARCHIVED --> [*]
```

