# 3-Tier API Architecture & Route Handler Standards

This document defines the standard patterns for creating API route handlers across all backend repos (Hono, Express, Bun, etc.).

## Core Architectural Philosophy

We strictly adhere to a **3-Tier Architecture** to separate concerns, ensure testability, and keep our HTTP layer clean.

1. **Route Handlers (The HTTP Layer):** Handlers act as thin controllers. Their _only_ responsibilities are:
   - Accepting the HTTP request.
   - Triggering middleware for Authentication and Request Validation (Zod).
   - Passing the strictly-typed, validated payload to the Repository layer.
   - Returning the result with the appropriate HTTP status code.
   - _Absolutely no business logic or database queries belong here._

2. **Repository Layer (The Business Logic Layer):** Pure TypeScript classes/functions.
   - They know nothing about HTTP (`req`, `res`, status codes).
   - They handle calculations, orchestrating database calls, third-party API integrations (e.g., Stripe, AWS), and side effects (e.g., sending emails).

3. **Repository Layer (The Data Access Layer):** - Responsible strictly for interacting with the database (SQL, Prisma, Drizzle).
   - Executes queries and returns raw or mapped database rows.

---

## 1. Public API Routes (No Authentication)

For unauthenticated, public-facing endpoints, bypass the authentication middleware but **always** include request validation if the route accepts parameters or a body.

```typescript
// ✅ GOOD: Public GET (No params/body validation)
import { Hono } from "hono";
import { PublicRepo } from "@/repos/PublicRepo";

const publicRoutes = new Hono();

publicRoutes.get("/health", async (c) => {
  const result = await PublicRepo.checkSystemHealth();
  return c.json(result, result.isSuccess ? 200 : 503);
});
```

## 2. Parameters Only (e.g., GET or DELETE by ID)

For routes that only require URL parameters and no request body.

**Guidelines:**

- Use a validator middleware to parse and strictly type the URL parameters.
- Pass the validated parameter to the Repository layer.

```typescript
// ✅ GOOD: Authenticated GET with validated URL parameter
import { Hono } from "hono";
import { checkAuth } from "@/middlewares/auth";
import { zValidator } from "@hono/zod-validator";
import { ZIdParamSchema } from "@/schemas/shared";
import { InterviewRepo } from "@/repos/InterviewRepo";

const interviewRoutes = new Hono();
interviewRoutes.use("*", checkAuth);

interviewRoutes.get("/:id", zValidator("param", ZIdParamSchema), async (c) => {
  const { id } = c.req.valid("param");

  // Pass strictly typed data to the Repository
  const result = await InterviewRepo.getInterviewDetails(id);

  return c.json(result, result.isSuccess ? 200 : 404);
});
```

## 3. Body Only (e.g., Standard POST Routes)

For routes that receive a JSON payload but do not require dynamic URL parameters.

**Guidelines:**

- Extract the validated body from the framework's context object.
- The extracted body must be strictly typed by your validation schema before being passed to the Repository layer.

```typescript
// ✅ GOOD: POST with strictly validated JSON body
import { Hono } from "hono";
import { checkAuth } from "@/middlewares/auth";
import { zValidator } from "@hono/zod-validator";
import { ZCreateProblemRequest } from "@/schemas/problems";
import { ProblemRepo } from "@/repos/ProblemRepo";

const problemRoutes = new Hono();
problemRoutes.use("*", checkAuth);

problemRoutes.post(
  "/",
  zValidator("json", ZCreateProblemRequest),
  async (c) => {
    const validatedBody = c.req.valid("json");

    // Pass strictly typed data to the Repository
    const result = await ProblemRepo.createNewProblem(validatedBody);

    return c.json(result, result.isSuccess ? 201 : 400);
  },
);
```

## 4. Parameters + Body (e.g., PUT or PATCH)

For routes that need both a resource identifier from the URL and a JSON payload.

**Guidelines:**

- Chain multiple validator middlewares (one for `param`, one for `json`).
- Extract both validated objects in the handler and pass them together to the Repository layer.

```typescript
// ✅ GOOD: PATCH requiring both an ID and a partial body
import { Hono } from "hono";
import { checkAuth } from "@/middlewares/auth";
import { zValidator } from "@hono/zod-validator";
import { ZIdParamSchema } from "@/schemas/shared";
import { ZUpdateInterviewStatus } from "@/schemas/interviews";
import { InterviewRepo } from "@/repos/InterviewRepo";

const interviewRoutes = new Hono();
interviewRoutes.use("*", checkAuth);

interviewRoutes.patch(
  "/:id",
  zValidator("param", ZIdParamSchema),
  zValidator("json", ZUpdateInterviewStatus),
  async (c) => {
    const { id } = c.req.valid("param");
    const { status } = c.req.valid("json");

    // Pass combined payload to the Repository
    const result = await InterviewRepo.changeInterviewStatus({ id, status });

    return c.json(result, result.isSuccess ? 200 : 400);
  },
);
```

---

## 5. Standardized Response Handling & Status Codes

Route handlers should dynamically assign HTTP status codes based on the `isSuccess` flag returned by the Repository Layer.

### Status Code Guide

| Category         | Code    | Name           | When to use it                                                                            |
| :--------------- | :------ | :------------- | :---------------------------------------------------------------------------------------- |
| **Success**      | **200** | OK             | Standard "it worked" for GET, PUT, PATCH, or DELETE.                                      |
|                  | **201** | Created        | Use after a **POST** that successfully creates a new record.                              |
|                  | **204** | No Content     | Success, but there's no data to return (common for strict DELETE implementations).        |
| **Client Error** | **400** | Bad Request    | Structural error: Malformed JSON, validation failures, or business logic rule violations. |
|                  | **401** | Unauthorized   | Missing, invalid, or expired authentication token.                                        |
|                  | **403** | Forbidden      | Authenticated, but lacks permission (e.g., missing Admin roles).                          |
|                  | **404** | Not Found      | The requested resource ID doesn't exist.                                                  |
|                  | **409** | Conflict       | Duplicate entry (e.g., registering an email that already exists).                         |
| **Server Error** | **500** | Internal Error | A generic unhandled exception or crash on the server side.                                |

---

## 6. Anti-Patterns to Avoid (The "Never" List)

```typescript
// ❌ BAD: Parsing raw bodies directly in the handler without middleware
app.post("/users", async (c) => {
  const body = await c.req.json(); // Unvalidated 'any' type!
  if (!body.email) return c.json({ error: "Missing email" }, 400);
});

// ❌ BAD: Fat Route Handlers (Mixing business logic and DB calls in the route)
app.patch("/users/:id", async (c) => {
  const { id } = c.req.param();
  const data = await c.req.json();

  // Logic belongs in a Repository, NOT the route handler!
  const user = await db.query("SELECT * FROM users WHERE id = ?", [id]);
  if (user.status === "BANNED" && data.action === "PROMOTE") {
    return c.json({ error: "Cannot promote banned user" }, 400);
  }
  await db.query("UPDATE users SET...", [data, id]);
  // Sending email inside a route handler makes it untestable
  await sendEmail(user.email, "You are promoted");
});
```
