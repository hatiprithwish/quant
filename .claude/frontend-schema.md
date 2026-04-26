# Frontend Schema & Type Authoring Rules

## 1. Directory Structure

All shared types, form validation schemas, and API definitions live under `src/schemas/`. Organize by Domain-Driven Design (DDD), with a barrel `index.ts` per domain and a root `schemas/index.ts` that re-exports all domains.

```text
src/schemas/
├── index.ts                  # Re-exports all domains
├── common/                   # Cross-domain primitives
│   ├── index.ts
│   ├── Api.ts                # Base ApiResponse, pagination interfaces
│   └── Enum.ts               # App-wide UI enums (ThemeColor, SortDirection)
└── [domain]/                 # e.g., users/, orders/, products/
    ├── index.ts
    ├── [Domain]Enum.ts       # Enums, Zod wrappers, and UI lookup maps (Colors/Labels)
    ├── [Domain]Common.ts     # Shared interfaces (e.g., the base Product interface)
    ├── [Domain]ApiRequest.ts # Zod schemas for Form Validation & HTTP bodies
    └── [Domain]ApiResponse.ts# TypeScript interfaces for API responses
```

## 2. File Responsibilities

| File                     | What goes here                                                                                                                      |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| `[Domain]Enum.ts`        | TypeScript `enum`s, Zod wrappers, and UI mapping records (e.g., mapping a status enum to a specific Badge Color or display string). |
| `[Domain]Common.ts`      | Base interfaces representing the core business entities used across the UI.                                                         |
| `[Domain]ApiRequest.ts`  | Zod objects used for **Form Validation** (e.g., via `zodResolver`) and typing the payload sent to `apiClient.post()`.               |
| `[Domain]ApiResponse.ts` | Plain TypeScript `interface`s extending the base `ApiResponse` to strongly type `apiClient.get()` returns.                          |

## 3. Naming Conventions

- **Zod schemas**: Prefix with `Z` — `ZCreateUserForm`, `ZOrderStatusEnum`
- **Inferred types**: Drop the `Z` prefix — `CreateUserForm`, `OrderStatusEnum`
- **Enum pairs**: Pair an `IntEnum` (data from the backend) with a `LabelEnum` (human-readable string for the UI) if the backend sends integer codes.
- **Lookup maps**: Use `camelCase` noun: `orderStatusToBadgeColor`, `orderStatusToDisplayLabel`

## 4. Enum Patterns & UI Mappings

The frontend relies heavily on mapping data states to visual UI elements. `[Domain]Enum.ts` is the central hub for this.

```typescript
// ✅ GOOD: Defining the enum and its UI mappings in one place
import { ThemeColor } from "../common";

export enum OrderStatusEnum {
  Pending = "PENDING",
  Fulfilled = "FULFILLED",
  Cancelled = "CANCELLED",
}
export const ZOrderStatusEnum = z.nativeEnum(OrderStatusEnum);

// Mapping to UI display strings
export const orderStatusDisplayLabel: Record<OrderStatusEnum, string> = {
  [OrderStatusEnum.Pending]: "Awaiting Shipment",
  [OrderStatusEnum.Fulfilled]: "Delivered",
  [OrderStatusEnum.Cancelled]: "Order Cancelled",
};

// Mapping to UI component colors
export const orderStatusBadgeColor: Record<OrderStatusEnum, ThemeColor> = {
  [OrderStatusEnum.Pending]: ThemeColor.Warning,
  [OrderStatusEnum.Fulfilled]: ThemeColor.Success,
  [OrderStatusEnum.Cancelled]: ThemeColor.Destructive,
};
```

## 5. ApiRequest Schemas (Forms & Payloads)

- Use Zod objects for everything the client _sends_ to the server.
- These schemas double as your **Form Validation Schemas** (e.g., using React Hook Form).
- Compose schemas via `.extend()` rather than duplicating fields.
- **No Server Context:** Unlike the backend, the frontend API request schemas should _never_ include fields that the client doesn't explicitly send (e.g., no injected `userId` fields).

```typescript
// ✅ GOOD: A single schema powers both the UI Form and the API payload
export const ZCreateOrderRequest = z.object({
  productId: z.string().uuid("Invalid product ID"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  notes: z.string().max(500).optional(),
});

// Used to type the `onSubmit` data and the `apiClient.post` body
export type CreateOrderRequest = z.infer<typeof ZCreateOrderRequest>;
```

## 6. ApiResponse Interfaces

- Use plain TypeScript `interface`s (not Zod objects) to type incoming data.
- Import the base `ApiResponse` from `../common`.
- Always account for nullable fields if the backend might return `null`.

```typescript
// ✅ GOOD
import { ApiResponse } from "../common";
import { Order } from "./OrderCommon";

export interface GetOrderResponse extends ApiResponse {
  order: Order | null;
}

export interface GetOrdersListResponse extends ApiResponse {
  orders: Order[];
  totalRecords: number;
}
```

## 7. Common Domain

The `common/` domain contains primitives used across all features.

- `Api.ts` — Base `ApiResponse` structure, pagination parameters.
- `Enum.ts` — UI-specific enums that aren't tied to a business domain (e.g., `ThemeColor`, `ButtonVariant`, `SortDirection`).

**Never put feature-specific types (e.g., `User`, `CartItem`) inside `common/`.**

## 8. Barrel Exports & Consumption

Every domain `index.ts` must re-export all files in the domain. The root `schemas/index.ts` re-exports all domains.

Always import schemas through the root barrel alias (`@/schemas`), never from internal domain paths directly. This prevents circular dependency issues in the UI bundle.

```tsx
// ✅ GOOD
import * as Schemas from "@/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

export function OrderForm() {
  const form = useForm<Schemas.CreateOrderRequest>({
    resolver: zodResolver(Schemas.ZCreateOrderRequest),
  });
  // ...
}

// ❌ BAD
import { ZCreateOrderRequest } from "@/schemas/orders/OrderApiRequest";
```
