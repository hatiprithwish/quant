# Application Constants Management

This rule strictly forbids "magic strings" and "magic numbers" in the codebase. All internal application configurations that do not change between environments must be stored centrally.

## Core Philosophy

1. **Zero Magic Values:** No hardcoded numbers or strings should exist in route handlers, services, or providers.
2. **Centralized Location:** All constants live exclusively in `src/config/Constants.ts`.
3. **Immutability:** Constants must be strictly typed as read-only.

## Implementation Pattern

Use a class with `static readonly` properties or an object cast `as const` to logically group constants. This provides excellent IntelliSense and prevents accidental mutations.

```typescript
// src/config/Constants.ts

export class AppConstants {
  static readonly PAGINATION = {
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
  } as const;

  static readonly ROLES = {
    ADMIN: "ADMIN",
    MODERATOR: "MODERATOR",
    USER: "USER",
  } as const;

  static readonly LOG_CATEGORIES = {
    HTTP: "HTTP",
    DATABASE: "DATABASE",
    AUTH: "AUTH",
    PAYMENT: "PAYMENT",
  } as const;
}
```

## Anti-Patterns

- **❌ No Inline Thresholds:** `if (attempts > 5)` should be `if (attempts > AppConstants.AUTH.MAX_ATTEMPTS)`.
- **❌ No Inline Enums:** `if (status === "ACTIVE")` should be `if (status === AppConstants.STATUS.ACTIVE)`.
