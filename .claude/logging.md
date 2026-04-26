# Observability & Logging Management

This rule defines the standard pattern for logging. Regardless of the underlying logger (Pino, Winston, CloudWatch SDK), the output must always be structured JSON, highly searchable, and traceable across boundaries.

## Core Philosophy

1. **JSON Only:** All logs must be output as structured JSON. Never use `console.log("User did X")`.
2. **Distributed Tracing (`correlationId`):** Every log entry must include a `correlationId` (a unique UUID generated when an HTTP request or background job starts). This groups all logs for a single flow together.
3. **Structured Taxonomy:** Logs must contain specific metadata fields (`logCategory`, `logAction`) to allow easy filtering in dashboards (e.g., filtering all `DATABASE` errors).
4. **Data Sanitization:** Never log raw request bodies or user objects without stripping sensitive PII (Passwords, Tokens, Credit Cards).

## The Standard Log Payload

Every log output must conform to this basic shape:

```json
{
  "level": "info | warn | error",
  "timestamp": "2024-04-20T12:00:00Z",
  "correlationId": "uuid-1234-5678",
  "logCategory": "HTTP",
  "logAction": "USER_LOGIN",
  "message": "User login flow completed successfully",
  "metadata": {
    "userId": "user_999",
    "requestBody": { "email": "user@example.com", "password": "[REDACTED]" },
    "durationMs": 120
  },
  "error": null
}
```

## Implementation Guidelines

### 1. HTTP Boundary Logging

Log the start and success of every HTTP request at the Route Handler / Middleware level.

- **Request Start:** Generate the `correlationId`. Log `{ logCategory: "HTTP", logAction: "FetchUserProfileAttempt", message: "Incoming request", metadata: { path, method, sanitizedBody } }`.
- **Request Success:** Log `{ logCategory: "HTTP", logAction: "FetchUserProfileSuccess", message: "Request completed"`.
- **Request Failure:** Log `{ logCategory: "HTTP", logAction: "FetchUserProfileFailure", message: "Request Failed", metadata: {requestBody, error}`.

### 2. Application/Service Errors

When an error occurs in the business logic, log it _before_ throwing it up the chain.

- **Error Logs:** Must include the full `error` object (stack trace), the `correlationId`, the `logCategory` (e.g., `DATABASE`, `AUTH`), and the context metadata.

```typescript
// ✅ GOOD: Structured Error Logging
try {
  await db.processPayment(data);
} catch (error) {
  Logger.error({
    message: "Payment processing failed",
    correlationId: currentCorrelationId,
    logCategory: Schemas.LogCategory.PAYMENT,
    logAction: Schemas.LogAction.PROCESS_TRANSACTION,
    metadata: { transactionId: data.id },
    error: error,
  });
}
```

### 3. Application Info Logging

Use info logging for critical business milestones (e.g., "Email sent", "Webhook received"). Do not log every single function call, as this causes log bloat. Include `correlationId`, `logCategory`, `logAction`, and relevant safe metadata.

## Anti-Patterns

- **❌ String Concatenation:** `Logger.info("User " + id + " failed to login")`. This cannot be queried effectively. Always pass data inside the `metadata` object.
- **❌ Logging PII:** Logging raw `req.body` without running it through a redaction utility.
- **❌ Missing Trace IDs:** Logging errors deep in the service layer without passing down the `correlationId`, making the error untraceable to the user's request.
