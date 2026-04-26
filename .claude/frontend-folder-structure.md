# Route-Driven Frontend Architecture

This rule defines a scalable frontend architecture where the folder structure strictly mirrors the application's URL routes. This ensures components, utilities, and local state are co-located exactly where they are used, preventing architectural drift as the application grows.

## 🏗️ Core Philosophy

1. **Route-Mirrored Organization:** Folders inside the `views` (or `pages`) directory map 1:1 with the actual URL paths in the browser.
2. **Co-location of State:** State management (Zustand, Jotai, Context) is kept as close to where it is used as possible. Global state is strictly reserved for app-wide concepts (e.g., authentication, theme).
3. **Common UI Segregation:** Reusable, "dumb" UI components (Buttons, Modals, Inputs) live in a dedicated, globally accessible `common` folder.

## 📂 Folder Structure

```text
├── src/
│   ├── app/                       # The framework's actual routing mechanism (Next.js App Router, React Router config)
│   │
│   ├── components/                # Globally shared UI Elements
│   │   ├── common/                # Reusable dumb components (Button, Input, Table)
│   │   ├── layout/                # App-wide layouts (Sidebar, Navbar)
│   │   └── ui/                    # Third-party component library wrappers (e.g., shadcn)
│   │
│   ├── views/                     # ROUTE-DRIVEN FOLDERS (Maps to URLs)
│   │   ├── home/                  # Maps to `/`
│   │   │   ├── components/        # Components used ONLY on the home page
│   │   │   └── index.tsx          # Main entry point for the home route
│   │   │
│   │   ├── dashboard/             # Maps to `/dashboard`
│   │   │   ├── components/        # Dashboard-specific components (e.g., RevenueChart.tsx)
│   │   │   ├── state.ts           # Route-scoped state (Zustand/Jotai used ONLY in dashboard)
│   │   │   ├── utils.ts           # Helper functions ONLY needed in dashboard
│   │   │   ├── index.tsx          # Main dashboard view
│   │   │   │
│   │   │   └── user-id/           # NESTED ROUTE: Maps to `/dashboard/:user-id`
│   │   │       ├── components/    # Components used ONLY in the user detail view
│   │   │       ├── state.ts       # State scoped specifically to the user-id view
│   │   │       └── index.tsx      # Main user detail view
│   │   │
│   │   └── interview/             # Maps to `/interview`
│   │       ├── phases/            # Nested logical grouping for this route
│   │       ├── state.ts           # Interview-specific state (e.g., currentPhase, messages)
│   │       └── index.tsx          # Main interview view
│   │
│   ├── store/                     # GLOBAL State Management
│   │   └── globalState.ts         # App-wide state (Auth user, Theme, Settings)
│   │
│   ├── hooks/                     # Global Hooks (Queries, Mutations, shared custom hooks)
│   ├── api/                       # Centralized API clients
│   └── schemas/                   # Zod validation schemas
```

## 🧩 Architectural Rules

### 1. Route Folder strictness

If a URL exists in the application (e.g., `/settings/billing`), there **must** be a corresponding folder path (`views/settings/billing/`). All components, types, and logic specific to that page must live inside that folder.

### 2. Nested Routing

When routes are nested, their folders should be nested. The `user-id` folder lives _inside_ the `dashboard` folder because it represents a child route (`/dashboard/user-id`). It inherits access to the parent's concepts but maintains its own specific logic.

### 3. State Management Rules (The "Scope" Rule)

Never put route-specific data into the global store.

- **Global State (`src/store/globalState.ts`):** Only use this for data needed across completely unrelated routes (e.g., the currently logged-in user profile, dark mode preference, global notification toasts).
- **Route-Scoped State (`views/[route]/state.ts`):** Use this for data specific to a feature. For example, the `dashboard` folder has a `state.ts` file to manage chart filters, selected date ranges, or local UI toggles.

### 4. Import Boundaries

- Components inside a route folder (e.g., `views/dashboard/`) **can** import from `src/components/common/`.
- Components inside `views/dashboard/` **cannot** import from `views/interview/`. If two separate routes need the exact same component, that component must be abstracted and moved to `src/components/common/`.
