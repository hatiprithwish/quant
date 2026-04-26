# Environment Variables & Secret Management

This rule defines the standard pattern for handling environment variables across the application. We prioritize strict type safety and the "fail-fast" principle to prevent runtime crashes caused by missing or malformed configuration.

## Core Philosophy

1. **Zero Raw Access:** Never use `process.env` directly inside business logic, services, or route handlers.
2. **Centralized Validation:** All environment variables must be validated at the application boundary (startup) using a schema validator (e.g., Zod).
3. **Fail-Fast:** If a variable is missing or of the wrong type, the application must crash immediately upon startup with a clear error message.
4. **Class-Based Encapsulation:** Validated configuration is encapsulated in a central `EnvConfig` instance, providing a single, strictly typed source of truth.

## Implementation Pattern

Create a centralized configuration file in `src/config/EnvConfig.ts`.

```typescript
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
});

class EnvConfig {
  public readonly config: z.infer<typeof envSchema>;

  constructor() {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      console.error(
        "❌ Invalid environment variables:",
        parsed.error.flatten().fieldErrors,
      );
      process.exit(1);
    }
    this.config = parsed.data;
  }
}

export const envConfig = new EnvConfig().config;
```

## Anti-Patterns

- **❌ No Silent Failures:** Do not use `||` fallbacks in logic (e.g., `process.env.PORT || 3000`). Let the schema handle defaults.
- **❌ No Manual Type Casting:** Avoid casting environment variables manually (e.g., `Number(process.env.PORT)`).
