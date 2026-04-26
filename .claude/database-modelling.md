# Universal Database Modeling Guidelines

These guidelines define the core conventions and patterns for creating and managing relational database models. They are strictly ORM-agnostic (Prisma, Drizzle, Kysely, etc.) and apply universally across SQL databases (PostgreSQL, MySQL, SQLite).

## 1. Unified Naming Conventions

The database schema must always serve as the ultimate source of truth.

- **Tables & Columns:** Always use `snake_case` at the database level.
- **ORM Mapping:** If the ORM supports it without friction, keep the application-level keys in `snake_case` to mirror the database exactly. If the ORM strictly generates `camelCase` for the application client (e.g., Prisma), you must explicitly map the `camelCase` application fields to `snake_case` database columns.

## 2. Primary Key Strategies

Choose the appropriate primary key strategy based on the entity type and future scalability:

- **UUIDs/ULIDs:** Use natively generated UUIDs (or ULIDs) as primary keys for standalone business entities (e.g., `users`, `organizations`, `products`). This prevents ID guessing and simplifies data migrations.
- **Sequential IDs:** Use standard auto-incrementing integers (or BigInts for high volume) for internal join tables, logging tables, or relationships where public-facing IDs are not exposed.

## 3. Relationships & Foreign Key Behaviors

Always define explicit foreign key relationships and their deletion behaviors.

- **Default to Restrict:** By default, foreign keys should prevent accidental deletion of parent records (e.g., `ON DELETE RESTRICT` or `NO ACTION`).
- **Use Cascade Judiciously:** Only use `ON DELETE CASCADE` for tightly coupled child records that have no independent meaning without their parent (e.g., deleting a `post` should cascade to `post_comments`, but deleting a `user` should _not_ cascade to `orders`).

## 4. Strict Application-Level Typing

Do not rely on raw strings or generic integers for columns that represent a fixed set of values.

- **Enums & States:** Always map database columns to strongly typed application-level structures (like TypeScript Enums or Zod schemas).
- **Implementation:** Utilize the ORM's specific feature for type casting or custom types to ensure the application layer enforces standard types before data reaches the database.

## 5. Universal Data Type Preferences

- **Strings:** Prefer unbounded `text` over arbitrary `varchar(n)` limits unless a strict length limit is a business requirement or dictated by the specific SQL engine's indexing limitations.
- **Structured Data (JSON):** Use the most optimized JSON format available in the target database (e.g., `jsonb` in PostgreSQL, `JSON` in MySQL) for flexible payloads.
- **Arrays/Lists:** - If the database supports native arrays, use them for simple lists of primitives (e.g., tags).
  - If the database does not support native arrays, default to a properly normalized 1:N relational table.
- **The Boolean Rule:** Boolean columns must **always** be `NOT NULL` and have a default value (`true` or `false`). Never allow a nullable boolean (the "tri-state" anti-pattern).

## 6. Timestamps & Data Lifecycle (Soft Deletes)

Almost every table should track its lifecycle at the database level.

- **Required Timestamps:** Include a `created_at` column for all entities, and an `updated_at` column for any mutable entity.
- **Soft Deletes:** For entities that hold historical or financial significance, never hard-delete rows. Add a `deleted_at` timestamp column (nullable). The presence of a timestamp indicates deletion, providing both the "deleted" state and the exact time it occurred.

## 7. Constraint and Indexing Strategy

Always explicitly name your constraints and indexes rather than relying on the ORM or database engine to auto-generate them.

- **Naming Convention:**
  - Unique Constraints: `UK_{tableName}_{firstColumnName}` (e.g., `UK_users_email`)
  - Foreign Keys: `FK_{tableName}_{firstColumnName}` (e.g., `FK_posts_user_id`)
  - Indexes: `IDX_{tableName}_{firstColumnName}` (e.g., `IDX_orders_created_at`)
- **Indexing Rules:** Always add an explicit index to Foreign Key columns, as these are frequently used in `JOIN` operations. Add indexes to columns frequently used in `WHERE` clauses (e.g., `email`, `status`).
