# Backend Folder Structure & Architecture

A scalable, production-ready backend application built on a strict **3-Tier Architecture** (Controllers/Routes, Services/Repositories, Data Access). This structure is framework-agnostic and applies to Hono, Express, Fastify, or Bun.

## 🏗️ Architecture Overview

The backend is strictly layered to ensure Separation of Concerns (SoC). Data flows downwards, and layers never bypass their immediate neighbor.

1. **Routes (The Controller Layer):** Handles HTTP context (`req`, `res`), runs validation middleware, and routes data.
2. **Services / Repositories (The Business Layer):** Orchestrates business logic, calculates data, and triggers side effects (emails, queues).
3. **Data Access Layer (DAL):** Executes raw SQL or ORM commands against the database.

## 📂 Folder Structure

```text
backend-service/
├── src/
│   ├── config/                    # Configuration and Environment
│   │   ├── EnvConfig.ts           # Zod validation for process.env
│   │   └── Constants.ts           # Application-wide constants
|   |   └── Logger.ts              # Centralized JSON logger
│   │
│   ├── db/                        # Database Configuration & Schemas
│   │   ├── index.ts               # Database client initialization
│   │   ├── migrations/            # Auto-generated schema migrations
│   │   └── schema.ts              # ORM table definitions (Drizzle/Prisma)
│   │
│   ├── middlewares/               # HTTP Middleware
│   │   ├── auth.ts                # Authentication checks
│   │   └── validateRequest.ts     # Zod request body validation
│   │
│   ├── providers/                 # External Clients (Singletons)
│   │   ├── RedisClient.ts
│   │   └── S3Client.ts
│   │
│   ├── routes/                    # Route Handlers (HTTP Layer)
│   │   └── [Feature]Routes.ts     # e.g., UserRoutes.ts
│   │
│   ├── repos/                     # Business Logic Layer
│   │   └── [Feature]Repo.ts       # e.g., UserRepo.ts, PaymentRepo.ts
│   │
│   ├── data-access-layer/         # Database Queries Layer
│   │   └── [Feature]DAL.ts        # e.g., UserDAL.ts
│   │
│   └── utils/                     # Pure helper functions
│       └── Utility.ts
│
├── schemas/                       # Shared Types & Zod Schemas (Monorepo friendly)
│   └── [domain]/
│       ├── [Domain]DbRequest.ts   # Internal DB types
│       └── [Domain]ApiRequest.ts  # HTTP payload schemas
│
└── package.json
```

## 🔄 Data Flow Protocol

```text
Request → [Middleware] → Route Handler → Repo → DAL → Database
```

**Strict Rules:**

- Routes **MUST NOT** execute database queries.
- Services **MUST NOT** access HTTP context (`req`, `res`, `c.json()`).
- DAL **MUST NOT** trigger business side effects (e.g., sending an email).

## 📝 Naming Conventions

- **Routes:** PascalCase `[Feature]Routes.ts` (e.g., `OrdersRoutes.ts`)
- **Repos:** PascalCase classes with static methods `[Feature]Repo.ts`
- **DAL:** PascalCase classes with static methods `[Feature]DAL.ts`
