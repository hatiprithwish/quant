# Standard RESTful API Design Patterns

This rule defines the universal standard for API endpoint patterns and naming conventions. It is framework-agnostic and designed to be applied to any future service architectures (Hono, Express, Next.js, etc.).

## 1. Naming Conventions

**ALWAYS** follow these resource-based patterns:

### Collection vs Single Resource

- **Plural for collections**: Use plural nouns (`/products`, `/users`) when dealing with multiple resources or the list as a whole.
- **Singular for single resources**: Use singular nouns (`/product`, `/user`) for operations targeting a single entity or the current context (e.g., the logged-in user).

### Standard CRUD Patterns

| Method     | Endpoint          | Description                                      |
| :--------- | :---------------- | :----------------------------------------------- |
| **GET**    | `/{collection}`   | List all items in the collection                 |
| **GET**    | `/{resource}`     | Get a single resource (via session/auth context) |
| **POST**   | `/{resource}`     | Create a new resource                            |
| **GET**    | `/{resource}/:id` | Retrieve a specific resource by ID               |
| **PUT**    | `/{resource}/:id` | Replace a specific resource entirely             |
| **PATCH**  | `/{resource}/:id` | Partially update a specific resource             |
| **DELETE** | `/{resource}/:id` | Remove a specific resource                       |

---

## 2. Implementation Guidelines

### Directory Structure (Generic)

Organize code by resource logic. In frameworks like **Hono** or **Express**, these usually map to separate router files.

```text
src/
└── routes/
    ├── {resource}.query.ts   <-- Complex Read operations (POST /api/query/{collection})
    └── {resource}.routes.ts  <-- Standard CRUD (GET, POST, PATCH, DELETE)
```

### Complex Queries (The "Search POST" Pattern)

**DO NOT** use URL Query Parameters for filtering, sorting, or pagination. Instead, use a dedicated query endpoint with a `POST` method to send complex configurations in the request body. This prevents "URL bloat" and handles complex nested objects easily.

**Endpoint:** `POST /api/query/{collection}`

**Example Body:**

```json
{
  "filters": { "status": "active", "category": "tech" },
  "sort": { "createdAt": "desc" },
  "pagination": { "limit": 20, "offset": 0 }
}
```

---

## 3. HTTP Method & Status Codes

| Method     | Expected Success | Use Case                                             |
| :--------- | :--------------- | :--------------------------------------------------- |
| **GET**    | `200 OK`         | Fetching data. Must be idempotent (no side effects). |
| **POST**   | `201 Created`    | Creating a resource. Returns the created object.     |
| **PUT**    | `200 OK`         | Replacing a resource entirely.                       |
| **PATCH**  | `200 OK`         | Updating specific fields of a resource.              |
| **DELETE** | `204 No Content` | Removing a resource. Response body should be empty.  |

**Common Error Codes:**

- `400 Bad Request`: Validation or syntax errors.
- `401 Unauthorized`: Missing or invalid authentication.
- `403 Forbidden`: Authenticated but lacks permission for this specific resource.
- `404 Not Found`: Resource ID does not exist.

---

## 4. Anti-Patterns to Avoid

- **❌ No Action Verbs**: Do not use `/api/create-user` or `/api/deleteTask/:id`. The HTTP method defines the action.
- **❌ No Query Param Logic**: Avoid `/api/items?limit=10&sort=desc`. Use the Query POST pattern for consistency.
- **❌ No Method Tunneling**: Never use `POST` for fetching data (unless it's the specific `/query/` pattern) or `GET` for deleting data.
- **❌ Inconsistent Pluralization**: Do not mix `GET /users` with `POST /user-create`.

---

## 5. Nested Resources

For sub-resources (e.g., Comments belonging to a Post), follow the hierarchy:

- `GET /post/:id/comments` (List comments for that post)
- `POST /post/:id/comment` (Create a comment for that post)
- `DELETE /post/:id/comment/:commentId` (Delete specific comment)

---

## 6. Hono/Express Implementation Example

When implementing this in a code-based router:

```typescript
// src/routes/user.routes.ts
const user = new Hono();

user.get("/", (c) => listUsers(c)); // GET /users
user.post("/", (c) => createUser(c)); // POST /user
user.get("/:id", (c) => getUser(c)); // GET /user/:id
user.patch("/:id", (c) => updateUser(c)); // PATCH /user/:id
user.delete("/:id", (c) => deleteUser(c)); // DELETE /user/:id
```
