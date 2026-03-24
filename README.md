# MyKeepsakes

A memory and keepsake preservation app with map integration, trip journaling, and offline-ready PWA support.

## Overview

MyKeepsakes helps people preserve and organize meaningful memories -- photos, stories, locations, and keepsakes -- tied to the places and moments that matter. It features interactive map views powered by Leaflet, drag-and-drop organization, trip export for sharing or printing, and works offline as a Progressive Web App. Built for anyone who wants a personal, beautiful archive of the things they want to remember.

## Tech Stack

- Frontend: React 18 + TypeScript + Vite
- Styling: Tailwind CSS + shadcn/ui
- Backend: Supabase (Auth, Database, Edge Functions, Storage)
- Maps: Leaflet + React Leaflet
- Drag & Drop: @dnd-kit
- Export: html2canvas
- PWA: vite-plugin-pwa (offline support, installable)
- Animation: Framer Motion
- Testing: Vitest + React Testing Library

## Getting Started

```bash
git clone <repo>
cd mykeepsakes
cp .env.example .env  # Add your Supabase credentials
npm install
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint with ESLint |

## Documentation

- Design & strategy docs live in the PersonalOS Vault
