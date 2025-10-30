# Hauler – Next.js + Firebase + Genkit

A B2B supplier/client dashboard built with Next.js App Router, Firebase (Auth/Firestore), Tailwind UI, and Genkit (Google AI/Gemini).

## Tech stack
- Next.js `^15.5.6` (App Router, TypeScript)
- React `^18.3.1`
- Tailwind CSS `^3.4.1` + shadcn/ui components
- Firebase Web SDK `^11.9.1` (Auth, Firestore)
- Genkit `^1.20.0` with `@genkit-ai/google-genai`

## Prerequisites
- Node.js 18+ and npm 9+
- Firebase project (Firestore + Authentication enabled)
- Google AI API key (Gemini) if you plan to use AI features

## Getting started
1) Install dependencies
```
npm install
```

2) Environment variables – create `.env.local` in the `studio` folder
```
# Google AI (Gemini) API key (preferred)
GOOGLE_API_KEY=your_google_api_key_here

# Or use GEMINI_API_KEY instead (fallback)
# GEMINI_API_KEY=your_gemini_api_key_here
```
Notes:
- `src/ai/genkit.ts` reads `GOOGLE_API_KEY` or `GEMINI_API_KEY` and throws a clear error if neither is present.
- Firebase config is injected via `next.config.ts` from `firebase.config.js` into `NEXT_PUBLIC_FIREBASE_CONFIG`.

3) Run the dev server
```
npm run dev
# Dev server runs on http://localhost:9002
```

4) Optional: Run Genkit dev flows (AI)
```
# Starts Genkit with the dev entry (loads dotenv)
npm run genkit:dev

# Starts Genkit in watch mode for AI flow iteration
npm run genkit:watch
```

## Scripts
- `npm run dev` – Next.js dev server on port 9002
- `npm run build` – build for production
- `npm run start` – start built app
- `npm run lint` – Next lint
- `npm run typecheck` – TypeScript check
- `npm run genkit:dev` – start Genkit dev runner
- `npm run genkit:watch` – start Genkit dev runner in watch mode

## Project structure (selected)
```
src/
  app/                   # App Router pages
    dashboard/
      products/page.tsx
      orders/page.tsx
      cart/page.tsx
    login/page.tsx
    signup/page.tsx
    layout.tsx
  components/
    dashboard/*          # Dashboard UI & dialogs
    ui/*                 # shadcn/ui components
  context/
    AuthContext.tsx
    CartContext.tsx
  hooks/*
  lib/
    firebase.ts          # Firebase initialization
    types.ts             # Shared types (Product, Order, etc.)
  ai/
    genkit.ts            # Genkit setup + Gemini model
    dev.ts               # Genkit dev entry (dotenv)
    flows/*              # AI flows
```

## Firebase setup
- Ensure a `users` collection exists for profiles written by `AuthContext.tsx`.
- Collections used: `users`, `products`, `orders`.
- Firestore rules should align with these collections (see `firestore.rules`).
- `firebase.config.js` should contain your Firebase web config; it is embedded at runtime via `next.config.ts`.

## Images
- `next/image` is configured for specific remote hosts in `next.config.ts`.
- Product images are stored as Base64 data URLs in `imageDataUrl` (see `types.ts`). Components safely render a fallback if missing.

## Troubleshooting (dev)
- Changes not reflecting: ensure you run `npm run dev` from the `studio` directory and open `http://localhost:9002`.
- If you previously enabled file watcher polling, open a fresh shell without:
  - `WATCHPACK_POLLING`, `CHOKIDAR_USEPOLLING`, or `NEXT_DISABLE_TURBOPACK`.
- Windows performance: exclude the project directory from Defender/Indexing if rebuilds are slow.

## Production build
```
npm run build
npm run start
# Default port 3000 unless configured otherwise
```

## Notes
- The app assumes consistent `Order` documents with numeric `total`, valid `createdAt` (Firestore Timestamp or ISO), and `supplierId`/`clientId` fields.
- Supplier displays in orders (client view) are resolved by fetching `displayName` from the `users` collection.

## License
Proprietary – for internal use unless a license is added.