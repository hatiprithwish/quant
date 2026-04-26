# Universal Data Fetching & API Standards

This document defines the strict architectural boundaries for all client-to-server communication. By segregating our network layer (`apiClient`), reactive reads (`cachedQueries`), imperative reads (`oneTimeQueries`), and writes (`mutations`), we ensure a scalable, predictable, and highly testable frontend architecture.

## Core Philosophy

1. **Centralized Network Layer:** Raw `fetch` or `axios` calls are forbidden inside UI components or hooks. All network requests must pass through the `apiClient`.
2. **CQRS Principle (Command and Query Responsibility Segregation):** Reads (Queries) and Writes (Mutations) have entirely different lifecycles and must be separated into distinct files.
3. **Reactive vs. Imperative:** Data that drives the UI should be cached and reactive. Data needed for a single, background operational check should bypass the cache.

---

## 1. The API Client (`apiClient.ts`)

The API Client is a centralized wrapper around the native `fetch` API. It enforces global error handling, header injection, and response parsing.

### Implementation Guidelines

- **Custom Error Class:** Always throw a custom `ApiError` so the UI can predictably catch and display status codes and backend error messages.
- **Strict Typing:** All methods must accept a generic `<T>` to strongly type the expected response.

```typescript
// ✅ GOOD: src/providers/apiClient.ts

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data: any,
  ) {
    super(`API Error ${status}: ${statusText}`);
  }
}

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    throw new ApiError(res.status, res.statusText, data);
  }
  return res.json();
};

export const fetcher = async <T>(url: string): Promise<T> => {
  const res = await fetch(url);
  return handleResponse(res);
};

export const apiClient = {
  get: <T>(url: string) => fetcher<T>(url),

  post: <T>(url: string, body: unknown) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handleResponse) as Promise<T>,

  put: <T>(url: string, body: unknown) =>
    fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handleResponse) as Promise<T>,

  patch: <T>(url: string, body: unknown) =>
    fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then(handleResponse) as Promise<T>,

  delete: <T>(url: string, body?: unknown) =>
    fetch(url, {
      method: "DELETE",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    }).then(handleResponse) as Promise<T>,
};
```

## 2. Cached Queries (`cachedQueries.ts`)

Cached queries drive the UI. They wrap the `apiClient` in a caching library (SWR, TanStack Query) to manage loading states, background refetching, and deduping.

### Implementation Guidelines

- **Zero Direct Library Calls in UI:** Components must never call `useSWR` or `useQuery`. They must use these exported custom hooks.
- **Deterministic Cache Keys:** Cache keys must be arrays if they rely on dynamic variables or request bodies.
- **Declarative Disabling:** Calculate an `isDisabled` or `isEnabled` flag before executing the fetch.
- **Standardized Return:** Always return `{ data, error, isLoading, refetch }`.

```typescript
// ✅ GOOD: src/api/cachedQueries.ts
import { useQuery } from "@tanstack/react-query"; // Or useSWR
import { apiClient } from "./apiClient";
import * as Schemas from "@/schemas";

export const useGetInterviewsByUser = (
  filters: Schemas.GetInterviewsRequest,
) => {
  const isEnabled = Boolean(filters.userId);
  const queryKey = ["/query/interviews", filters];

  const { data, error, isLoading, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      apiClient.post<Schemas.InterviewResponse>(
        `/api/query/interviews`,
        filters,
      ),
    enabled: isEnabled,
  });

  return {
    data,
    error,
    isLoading: isEnabled && isLoading,
    refetch,
  };
};
```

---

## 3. One-Time Queries (`oneTimeQueries.ts`)

Not all data should be cached. One-time queries are imperative functions used for actions like fetching a temporary presigned URL, verifying a one-time token, or checking if a username is available during form typing.

### Implementation Guidelines

- **No Hooks:** These are standard `async` functions, not React hooks. They can be called directly inside event handlers (e.g., `onSubmit` or `onClick`).
- **Direct Return:** They return the raw Promise from the `apiClient`.

```typescript
// ✅ GOOD: src/api/oneTimeQueries.ts
import { apiClient } from "./apiClient";
import type { PresignedUrlResponse } from "@/schemas";

/**
 * Fetches a temporary upload URL. This should never be cached.
 */
export const fetchPresignedUploadUrl = async (
  fileName: string,
  fileType: string,
) => {
  return apiClient.post<PresignedUrlResponse>("/api/storage/presigned-url", {
    fileName,
    fileType,
  });
};

/**
 * Imperative check before form submission.
 */
export const checkUsernameAvailability = async (username: string) => {
  return apiClient.get<{ available: boolean }>(
    `/api/users/check?username=${username}`,
  );
};
```

---

## 4. Mutations (`mutations.ts`)

Mutations handle all `POST`, `PUT`, `PATCH`, and `DELETE` operations that modify database state.

### Implementation Guidelines

- **Mandatory Cache Invalidation:** A successful mutation must **always** invalidate the related cached queries to ensure the UI updates instantly.
- **Encapsulation:** Return an `execute` function alongside the reactive loading/error states.

```typescript
// ✅ GOOD: src/api/mutations.ts
import { useMutation, useQueryClient } from "@tanstack/react-query"; // Or SWR mutate
import { apiClient } from "./apiClient";
import type { UpdateDriverRequest, ApiResponse } from "@/schemas";

export const useUpdateDriverMutation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateDriverRequest }) =>
      apiClient.put<ApiResponse>(`/api/driver-schedule/drivers/${id}`, body),

    onSuccess: () => {
      // CRITICAL: Explicitly invalidate all affected cache keys.
      // This forces the UI tables/lists to automatically refetch the fresh data.
      queryClient.invalidateQueries({
        queryKey: ["/query/driver-schedule/drivers"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/query/driver-schedule/drivers/count"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/query/driver-schedule/schedule-template"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/query/driver-schedule/schedule-template/count"],
      });
    },
  });

  return {
    execute: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
};
```

## Anti-Patterns (The "Never" List)

- **❌ UI Component Fetching:** Never write `fetch(...)` directly inside a React component or `useEffect`.
- **❌ Unhandled Mutations:** Never execute a mutation (e.g., updating a driver) without invalidating the cache immediately afterward. The user should never have to manually refresh the page.
- **❌ Catching API Errors Silently:** Do not swallow errors inside the `apiClient`. Always throw the `ApiError` so the consuming hook or function can properly display toast notifications or error boundaries.
