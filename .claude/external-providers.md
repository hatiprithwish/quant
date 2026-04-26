# External Providers & Client Management

This rule defines the standard patterns for initializing and managing third-party clients (Databases, S3, Redis, SQS, AI services, Email providers, etc.).

## Core Philosophy

External service clients must never be instantiated directly within business logic or route handlers. All external connections must be centralized in a dedicated `providers/` directory.

1. **Centralization:** Every external service gets its own dedicated file in `src/providers/` (e.g., `src/providers/RedisProvider.ts`, `src/providers/S3Provider.ts`).
2. **Single Source of Truth:** The rest of the application must import the client instance strictly from this provider file.
3. **Connection Efficiency:** We strictly enforce the **Singleton Pattern** to ensure only one instance of a client is created and reused across the entire application lifecycle. This prevents memory leaks, connection exhaustion, and rate-limiting issues.

---

## 1. The Singleton Pattern Implementation

All providers must be implemented as classes with a private static `instance` and a public static getter method.

### Guidelines:

- **Lazy Initialization:** Instantiate the client only when it is requested for the first time, not when the file is loaded.
- **Connection Checks:** For stateful connections (like Redis or WebSockets), check if the connection is open before returning the instance.
- **Strict Typing:** Always explicitly type the static instance using the official types provided by the third-party SDK.

### Example: Stateful Client (Redis / Databases)

Stateful clients require both instantiation and an active connection state.

```typescript
// src/providers/RedisClient.ts
import { createClient, type RedisClientType } from "redis";
import { envConfig } from "@/config/envConfig";

class RedisClient {
  private static instance: RedisClientType;

  static async getClient(): Promise<RedisClientType> {
    // 1. Instantiate if it doesn't exist
    if (!RedisClient.instance) {
      RedisClient.instance = createClient({
        username: envConfig.REDIS_USERNAME,
        password: envConfig.REDIS_PASSWORD,
        socket: {
          host: envConfig.REDIS_HOST,
          port: Number(envConfig.REDIS_PORT),
        },
      }) as RedisClientType;
    }

    // 2. Connect if it's not currently open
    if (!RedisClient.instance.isOpen) {
      await RedisClient.instance.connect();
    }

    return RedisClient.instance;
  }
}

export default RedisClient;
```

### Example: Stateless Client (AWS S3 / OpenAI / Stripe)

Stateless clients simply need to be instantiated once with the correct credentials. They handle the underlying HTTP connection pooling themselves.

```typescript
// src/providers/S3Client.ts
import { S3Client as AWSS3Client } from "@aws-sdk/client-s3";
import { envConfig } from "@/config/envConfig";

class S3Client {
  private static instance: AWSS3Client;

  static getClient(): AWSS3Client {
    if (!S3Client.instance) {
      S3Client.instance = new AWSS3Client({
        region: envConfig.AWS_REGION,
        credentials: {
          accessKeyId: envConfig.AWS_ACCESS_KEY_ID,
          secretAccessKey: envConfig.AWS_SECRET_ACCESS_KEY,
        },
      });
    }

    return S3Client.instance;
  }
}

export default S3Client;
```

---

## 2. Environment Variable Isolation

**NEVER** hardcode credentials, region strings, or hostnames inside the provider file.

- All configuration values must be injected via a centralized, strictly validated environment configuration file (e.g., `envConfig.ts`).
- This ensures the application fails fast on startup if a required key is missing, rather than crashing at runtime when the provider is called.

---

## 3. Usage in the Repository Layer

When business logic requires an external service, it must retrieve the instance via the static getter.

```typescript
// ✅ GOOD: Reusing the centralized Singleton
import RedisClient from "@/providers/RedisClient";

export class CacheRepo {
  static async setCache(key: string, value: string) {
    const redis = await RedisClient.getClient();
    await redis.set(key, value);
  }
}

// ❌ BAD: Instantiating directly in the repo
import { createClient } from "redis";

export class CacheRepo {
  static async setCache(key: string, value: string) {
    // This creates a new connection every single time the function runs!
    const redis = createClient({...});
    await redis.connect();
    await redis.set(key, value);
  }
}
```

---

## 4. Graceful Shutdown (Optional but Recommended)

For highly resilient applications, providers should expose a `disconnect` or `destroy` method. This allows the main server entry point to gracefully close database and message queue connections when receiving termination signals (`SIGTERM`, `SIGINT`), preventing corrupted data writes.

```typescript
  // Inside the Provider class
  static async disconnect(): Promise<void> {
    if (RedisClient.instance && RedisClient.instance.isOpen) {
      await RedisClient.instance.quit();
    }
  }
```
