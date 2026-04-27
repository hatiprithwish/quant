# Quant

> Turn your Claude subscription into a personal life-tracker. Talk to Claude, watch your data appear on your dashboard.

**Live:** https://quant-frontend.pages.dev

---

## Why I built this

I've been tracking time, calories, and expenses since I turned 18 — it's simply beautiful to be aware of what's happening to your body, money, and time.

Two years into a full-time job, the friction got too high. I was falling short at least 50% of the time — not from a lack of care, but from juggling three separate apps every evening:

- **Lifesum** for calories
- **Wallet by BudgetBakers** for expenses
- **Toggl Track** for time

Three subscriptions. Three different habits to maintain. Enough friction to make me fall off.

I wanted one place. One habit. One app.

---

## How it works

The core input is a sentence, not a form.

Instead of opening an app and filling out fields, you tell Claude what you did today:

> _"Had oatmeal for breakfast, chicken rice bowl for lunch. Bought a book for ₹180, weekly groceries for ₹1200. Worked 9–6, gym 7–8, Netflix after."_

An MCP server handles everything from there — parsing the narration, estimating macros, categorizing expenses, computing time durations — and pushes structured data directly to a Cloudflare D1 database. The React dashboard reflects it instantly on refresh.

You can also use voice-to-text (e.g. Wispr Flow) and just speak your day.

### Architecture

```
Claude Desktop / Claude.ai
        │  MCP over Streamable HTTP
        │  Authorization: Bearer <api_key>
        ▼
┌─────────────────────────────────────┐
│  Cloudflare Worker (Hono)           │
│                                     │
│  POST /mcp        ← MCP tools       │  api_key auth → resolves userId
│  POST /api/auth/sync ← first login  │  Clerk JWT auth
│  POST /api/query/*  ← dashboard     │  Clerk JWT auth
│                                     │
│  Routes → Repos → DAL → Drizzle/D1  │
└─────────────┬───────────────────────┘
              │
        Cloudflare D1 (SQLite)
        users, api_keys,
        food_logs, expense_logs, time_logs
              ▲
              │  REST POST /api/query/*
┌─────────────┴───────────────────────┐
│  Cloudflare Pages (React + Vite)    │
│  Clerk · TanStack Query · Recharts  │
└─────────────────────────────────────┘
```

### MCP Tools (9 total)

| Tool                      | What it does                                                    |
| ------------------------- | --------------------------------------------------------------- |
| `log_meal`                | Bulk-inserts food items for a meal; LLM estimates macros        |
| `get_food_summary`        | Daily totals + per-meal breakdown for a date range              |
| `log_expense`             | Logs a single expense with category and payment method          |
| `get_expense_summary`     | Totals grouped by day and category                              |
| `log_time`                | Logs an activity with start/end datetimes (cross-midnight safe) |
| `get_time_summary`        | Minutes per bucket + full activity list                         |
| `get_today`               | Returns today's date — prevents LLM date hallucination          |
| `list_buckets`            | Returns valid time bucket names                                 |
| `list_expense_categories` | Returns valid expense category names                            |

### Auth

- **Dashboard (REST):** Google OAuth via Clerk. JWT validated on the Worker edge using `verifyToken` from `@clerk/backend`.
- **MCP (Claude Desktop):** A personal API key auto-generated on first login and shown on the Settings page.

---

## Why MCP instead of a built-in LLM call?

My first instinct was to embed an LLM API call inside the app — hit the API, parse the response, save to DB. Then I caught myself: I already pay $20/month for Claude. Why add API costs on top?

By building an MCP server, I turned the Claude subscription I already have into the compute layer. Claude does the parsing and reasoning; my server just receives structured tool calls and writes to the database.

---

## Getting started

### Prerequisites

- [Cloudflare account](https://dash.cloudflare.com) (free tier works)
- [Clerk account](https://clerk.com) (free tier works)
- Node.js
- Wrangler CLI: `npm i -g wrangler`

### Backend

```bash
cd mcp-server
npm install

# Create D1 database
wrangler d1 create quant-db
# Paste the database_id into wrangler.jsonc

# Set secrets
wrangler secret put CLERK_SECRET_KEY

# Run migrations
npm run db:migrate:local   # local dev
npm run db:migrate         # production

# Dev server
npm run dev

# Deploy
npm run deploy
```

### Frontend

```bash
cd frontend
npm install

# Create a .env.local file:
# VITE_CLERK_PUBLISHABLE_KEY=pk_...
# VITE_API_URL=https://quant-backend.<your-subdomain>.workers.dev

npm run dev    # local dev
npm run build  # production build
npm run deploy # deploy to Cloudflare Pages
```

### Connect to Claude Desktop

1. Sign in at https://quant-frontend.pages.dev — your API key is auto-generated.
2. Go to **Settings** and copy your MCP Server URL and API key.
3. Add to your Claude Desktop config (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "quant": {
      "url": "https://quant-backend.<your-subdomain>.workers.dev/mcp",
      "headers": {
        "Authorization": "Bearer <your-api-key>"
      }
    }
  }
}
```

4. Restart Claude Desktop. The 9 tools will appear automatically.

---

## Database schema

```
users          — clerk_user_id (unique), email
api_keys       — one per user, hex token, revokable
food_logs      — one row per food item (grouped at query time by date + meal_type)
expense_logs   — amount, category (int enum), description, payment_method
time_logs      — bucket (int enum), activity, start_time, end_time (full ISO datetimes)
```

All enum columns store integers in the DB (`.$type<IntEnum>()` in Drizzle) and are converted to human-readable labels at the application layer.

---

## What's next

- Task tracking — replacing my Todoist subscription
- Habit tracker built around the [12-Week Year](https://12weekyear.com) framework

Goal: one dashboard for everything self-development.
