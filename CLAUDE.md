# Web Check Development Guide

## Build & Run Commands
- `bun install`: Install dependencies
- `bun dev`: Start the development server with HMR (`bun --hot index.ts`)
- `bun start`: Start the production server (`bun index.ts`)
- `bun test`: Run tests

## Architecture
- **Server**: `index.ts` uses `Bun.serve()` to handle static files (`index.html`, `style.css`) and dynamic API routing.
- **API Handlers**: Located in `api/`. Each file is a serverless-style handler wrapped in `api/_common/middleware.ts`.
- **Frontend**: Single-page application in `index.html` using Vanilla JS and parallel `fetch()` calls to analysis endpoints.

## Code Style & Guidelines
- **Imports**: 
  - Use `import * as pkg from 'module'` for CJS modules (e.g. `cheerio`, `uuid`) to ensure Bun compatibility.
  - Prefer `dns/promises` for async DNS operations.
- **API Handlers**:
  - Must export a `handler` wrapped with `middleware`.
  - Should handle errors gracefully by returning `{ skipped: 'reason' }` or `{ error: 'msg' }` instead of throwing.
  - Implement timeouts (e.g. `Promise.race`) for long-running network tasks (Traceroute, Port scanning).
- **DNS**: Use the `Resolver` class with `setServers(['8.8.8.8', '1.1.1.1'])` for high-reliability lookups.

## Dependencies
- **Analysis**: `axios`, `cheerio`, `puppeteer-core`, `psl`, `dns`, `traceroute`, `unzipper`.
- **Runtime**: Bun 1.x.
