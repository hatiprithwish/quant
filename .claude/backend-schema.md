# Schema Authoring Rules

## 1. Directory Structure

All shared types and schemas live under `schemas/`. Organize by Domain-Driven Design (DDD), with a barrel `index.ts` per domain and a root `schemas/index.ts` that re-exports all domains.

```text
schemas/
├── index.ts                  # Re-exports all domains
├── common/                   # Cross-domain primitives
│   ├── index.ts
│   ├── Api.ts                # Base ApiResponse, pagination helpers
│   ├── Enum.ts               # App-wide enums (SortDirection, Roles, etc.)
│   └── Env.ts                # ZEnvSchema for runtime env validation
└── [domain]/                 # e.g., users/, orders/, products/
    ├── index.ts
    ├── [Domain]Enum.ts       # TypeScript enums + Zod wrappers + lookup maps
    ├── [Domain]Common.ts     # Shared interfaces/types used within the domain
    ├── [Domain]ApiRequest.ts # Zod schemas for HTTP request bodies/params
    ├── [Domain]ApiResponse.ts# TypeScript interfaces extending ApiResponse
    └── [Domain]DbRequest.ts  # TypeScript interfaces for DAL method parameters
```

## 2. File Responsibilities

| File                     | What goes here                                                                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `[Domain]Enum.ts`        | TypeScript `enum`s, their Zod wrappers (`z.enum()`), and bidirectional lookup `Record` maps.                                                  |
| `[Domain]Common.ts`      | Interfaces and Zod objects shared across API/DB layers of the same domain.                                                                    |
| `[Domain]ApiRequest.ts`  | Zod objects for validating HTTP request bodies; also `RepoRequest` types that extend them with server-side context (e.g., injected `userId`). |
| `[Domain]ApiResponse.ts` | Plain TypeScript `interface`s extending the base `ApiResponse` interface.                                                                     |
| `[Domain]DbRequest.ts`   | Plain TypeScript `interface`s used as DAL method parameters.                                                                                  |

## 3. Naming Conventions

- **Zod schemas**: Prefix with `Z` — `ZCreateUserRequest`, `ZUserRoleIntEnum`
- **Inferred types**: Drop the `Z` prefix — `CreateUserRequest`, `UserRoleIntEnum`
- **Enum pairs**: Pair an `IntEnum` (DB integer) with a `LabelEnum` (human-readable string) when both representations are needed.
  - `OrderStatusIntEnum` / `OrderStatusLabelEnum`
- **Lookup maps**: Use `camelCase` noun: `orderStatusIntToLabel`, `orderStatusLabelToInt`
- **Repo request types**: Append `RepoRequest` suffix for types that add secure server-side context to an API type.
  - `CreateOrderRepoRequest = CreateOrderRequest & { userId: string }`

## 4. Enum Patterns

### Integer ↔ Label Pairs

Always define both when an enum is stored as an integer/code in the DB but displayed as a string in the UI. Provide both `IntToLabel` and `LabelToInt` lookup maps.

```typescript
// ✅ GOOD
export enum OrderStatusIntEnum {
  Pending = 1,
  Fulfilled = 2,
}
export const ZOrderStatusIntEnum = z.nativeEnum(OrderStatusIntEnum);

export enum OrderStatusLabelEnum {
  Pending = "Pending",
  Fulfilled = "Fulfilled",
}
export const ZOrderStatusLabelEnum = z.nativeEnum(OrderStatusLabelEnum);

export const orderStatusIntToLabel: Record<
  OrderStatusIntEnum,
  OrderStatusLabelEnum
> = {
  [OrderStatusIntEnum.Pending]: OrderStatusLabelEnum.Pending,
  [OrderStatusIntEnum.Fulfilled]: OrderStatusLabelEnum.Fulfilled,
};
```

### Zod Wrapper for TypeScript Enums

Use `z.nativeEnum(MyEnum)` directly. Do **not** duplicate enum values into a `z.enum([...])` array unless a specific subset validation is explicitly needed.

## 5. ApiRequest Schemas

- Use Zod objects for all HTTP request schemas.
- Compose schemas via `.extend()` rather than duplicating fields.
- Import Zod enum wrappers from the same domain's `Enum.ts`.
- **Never expose server-only fields (e.g., `userId` derived from a token) in the API schema.** Add them in a separate `RepoRequest` type.

```typescript
// ✅ GOOD: Clean separation of Client payload and Server context
export const ZGetOrdersRequest = z.object({
  pageNo: z.number().int().min(1).optional(),
  sortDirection: ZSortDirection.optional(),
});
export type GetOrdersRequest = z.infer<typeof ZGetOrdersRequest>;

// Used by the Service/Repository layer after auth middleware injects the ID
export type GetOrdersRepoRequest = GetOrdersRequest & { userId: string };
```

## 6. ApiResponse Interfaces

- Use plain TypeScript `interface`s (not Zod objects) that `extend ApiResponse`.
- Import the base `ApiResponse` from `../common`.
- Nullable payloads should be explicitly typed `T | null`.

```typescript
// ✅ GOOD
import { ApiResponse } from "../common";
import { Order } from "./OrderCommon";

export interface GetOrderResponse extends ApiResponse {
  order: Order | null;
}
```

## 7. DbRequest Interfaces (Data Access Layer)

- Use plain TypeScript `interface`s (not Zod objects).
- Use database-native enum types (`OrderStatusIntEnum`), not label enums — the DAL talks to the database, not the UI.
- Extend other DB request interfaces when a query is a superset (e.g., pagination extends count).

```typescript
// ✅ GOOD
export interface GetOrdersCountDbRequest {
  userId: string;
  status: number | null;
}

export interface GetOrdersDbRequest extends GetOrdersCountDbRequest {
  pageNo: number;
  pageSize: number;
}
```

## 8. Common Domain

The `common/` domain contains cross-cutting primitives. Rules:

- `Api.ts` — Base `ApiResponse`, `TotalRecordsResponse`, and pagination helpers.
- `Enum.ts` — App-wide enums not tied to a single domain (e.g., `SortDirection`, `ThemeColor`, `SystemRoles`).
- `Env.ts` — A single `ZEnvSchema` Zod object for validating `process.env`.

**Never put domain-specific types (e.g., `User`, `Product`) inside `common/`.**

## 9. Barrel Exports & Consumption

Every domain `index.ts` must re-export all files in the domain. The root `schemas/index.ts` re-exports all domains.

Always import schemas through the root barrel alias (`@/schemas`), never from internal domain paths directly.

```typescript
// ✅ GOOD
import * as Schemas from "@/schemas";
const result = Schemas.ZCreateOrderRequest.parse(body);

// ❌ BAD
import { ZCreateOrderRequest } from "@/schemas/orders/OrderApiRequest";
```
