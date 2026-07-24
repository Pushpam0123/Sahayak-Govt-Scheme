# Sahayak Web

React + TypeScript + Vite frontend for the Sahayak government-scheme assistant.

## Features

- **Ask Sahayak** — grounded Q&A chat with sentence-level citations, a citation
  inspector, groundedness (unsupported / partially-supported) flags, and
  suggested prompts.
- **My Dashboard** — citizen eligibility at a glance: KPI tiles, an eligibility
  profile form, an eligibility-breakdown donut, a schemes-by-category chart, a
  filterable scheme directory, and a collapsible document explorer.
- **Light / dark themes** — light by default; the toggle (top-right) persists to
  `localStorage`.
- **Bilingual** — English + Hindi, persisted across sessions.
- **Offline-friendly** — when the API is unreachable the UI falls back to
  clearly-labelled sample data behind a "Sample data" banner.

## Getting started

```bash
npm install
npm run dev      # start the dev server (http://localhost:5173)
npm run build    # type-check + production build
npm run lint     # oxlint
```

## Configuration

The API base URL is read from `VITE_API_BASE` (defaults to
`http://localhost:8000`). To point the app at a different backend, create a
`.env` file in this directory:

```bash
VITE_API_BASE=https://your-api-host
```

## Project layout

```
src/
  lib/          types, API client, i18n dictionary, theme/format helpers, demo data
  hooks/        useSahayak — health, schemes, and eligibility with offline fallback
  components/
    ui.tsx      reusable primitives (Card, Button, Badge, Field, Select, …)
    icons.tsx   inline icon set
    chat/       ChatView, MessageBubble, CitationInspector
    dashboard/  DashboardView, StatTiles, EligibilityForm, SchemeGrid, Charts, …
  index.css     Tailwind v4 design-system tokens (light + dark)
  App.tsx       app shell (header, tabs, routing between surfaces)
```

Theming is token-based: semantic CSS variables in `index.css` are consumed as
Tailwind utilities (`bg-surface`, `text-muted`, `text-primary`, …) and swapped
between light and dark by the `.dark` class on `<html>`.
