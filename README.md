# FinanceFlow — Personal Finance Manager (Web, Offline-First)

A privacy-focused, offline-first personal finance manager built with Next.js
(App Router), TypeScript, Tailwind CSS, shadcn-style components, Dexie.js
(IndexedDB), and Recharts. All data lives entirely in your browser — nothing
is ever sent to a server. No login, no cloud, no tracking.


## Tech stack

- **Next.js 14 (App Router)** + TypeScript (strict mode)
- **Tailwind CSS** + hand-built shadcn/ui-style components (Radix UI primitives
  under the hood: Dialog, Tabs, Switch, Select, Label)
- **Dexie.js** over IndexedDB — the entire database layer
- **Recharts** for all charts
- **Lucide** icons
- **Sonner** for toast notifications
- A hand-rolled minimal PWA setup (manifest + service worker — no `next-pwa`
  dependency, to avoid version-compatibility risk with the App Router)

No Firebase, no auth, no backend API routes, no external analytics.

## Project structure

```
src/
  app/                  Next.js App Router pages (one route per section)
  components/
    ui/                 Reusable primitives (Button, Card, Dialog, Tabs, ...)
    layout/              Sidebar, bottom nav, app shell, theme provider
    shared/              StatCard, EmptyState, ConfirmDialog
  features/              One folder per domain: dashboard, transactions,
                         wallets, loans, bike, budgets, savings, calendar,
                         analytics, settings, search, insights
  db/
    schema.ts            Dexie database class + table definitions + seeding
  hooks/                 useLiveQuery-based hooks per feature (fully reactive
                         — every screen updates instantly on any DB write)
  lib/                   constants, formatters, cn() helper, backup/restore,
                         browser notifications, misc utils
  types/                 All TypeScript interfaces for every entity
public/
  manifest.json          PWA manifest
  sw.js                  Minimal offline-shell service worker
  icons/                 Generated app icons (192, 512, apple-touch-icon)
```

## Getting started (local development)

```bash
npm install
npm run dev
```

Open http://localhost:3000 — it redirects to `/dashboard`.

## Building for production

```bash
npm run build
npm run start
```

