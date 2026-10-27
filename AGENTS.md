# AGENTS.md — Engineering Rules and Guidelines for AI Agents

> **Single Source of Truth**: This document defines the engineering standards, architecture constraints, quality gates, and workflow protocols for **templepujasewa**. All autonomous agents, coding assistants, and human engineers MUST adhere to these rules strictly.

---

## 1. Overview & Architectural Principles

1. **Feature-Driven Architecture**: Business domains reside under `features/<feature-name>/`. Avoid creating monolithic components or leaking feature internals into global directories.
2. **Clean Component Separation**: Follow SOLID principles. Decouple business logic, API communication, and presentation components.
3. **High Cohesion, Low Coupling**: Features should be self-contained modules exposing clean barrel interfaces via `index.ts`.
4. **Backward Compatibility**: Preserve existing component facades (e.g., in `components/`) that re-export feature components so legacy routes and imports remain functional.
5. **No Speculative Abstractions**: Solve immediate requirements cleanly; avoid premature micro-abstractions without demonstrated necessity.

---

## 2. Directory Structure & Domain-Driven Feature Slices

The repository layout is structured as follows:

```
templepujaseva/
├── app/                  # Next.js 15 App Router (Routes, Layouts, API Handlers)
│   ├── admin/            # Admin portal
│   ├── book/             # Multi-step booking flow
│   ├── booking/[id]/     # Dynamic booking receipt & status
│   ├── pooja/[slug]/     # Puja detail page
│   ├── temple/[slug]/    # Temple detail page
│   ├── profile/          # Devotee account & history
│   ├── login/ & signup/  # Authentication views
│   └── api/              # Backend endpoints
├── features/             # Domain modules
│   ├── admin/            # Admin dashboard, audit, controls
│   ├── auth/             # Devotee & admin authentication
│   ├── bookings/         # Booking flow, dates, addons, pricing
│   ├── catalog/          # Puja & temple discovery, search, filters
│   ├── contact/          # Support, WhatsApp floating CTA, AI guide
│   ├── devotees/         # Profiles, history, rescheduling, cancellations
│   ├── home/             # Marketing sections, hero, testimonials
│   ├── payments/         # Razorpay checkout, UPI QR, coupons
│   └── receipts/         # Invoice rendering, download, verification
├── components/           # Shared UI primitives and backward compatibility facades
│   ├── common/           # ErrorBoundary, Reveal, ScrollToTop, JsonLd, LanguageToggle
│   ├── layout/           # Header, Footer, BookPageHeader
│   ├── providers/        # I18nProvider, Providers wrapper
│   └── ui/               # Generic UI primitives
├── hooks/                # Shared utility hooks (useDebounce, useCopyToClipboard)
├── lib/                  # Infrastructure, stores, validation, external SDKs
└── tests/                # Vitest unit and integration test suite
```

**Feature Slice Internal Structure**:
Every feature folder should follow this layout where applicable:
- `api/` — API calls and data fetching routines.
- `components/` — UI components specific to the domain.
- `services/` — Pure calculation and business logic (e.g. pricing, seats).
- `types/` — Domain TypeScript interfaces and types.
- `index.ts` — Public barrel export defining the feature's API surface.

---

## 3. Tech Stack & Environment Constraints

- **Framework**: Next.js 15 (`app` router) with React 19.
- **Language**: TypeScript 5.7+ running in strict mode.
- **Styling**: Tailwind CSS 3.4 with `tailwindcss-animate`, `clsx`, and `tailwind-merge`.
- **Testing**: Vitest 4+ for unit and integration testing.
- **Storage/DB**: Dual-mode storage (MongoDB with automatic fallback to file-based JSON store `lib/json-store.ts`).
- **External Services**: Razorpay for payments, Twilio for WhatsApp messaging, Firebase/Nodemailer for communications.
- **Node Environment**: Node.js >= 20.

---

## 4. Standard Commands & Scripts

Always verify code with these deterministic commands before marking any task as complete:

| Command | Purpose |
|---|---|
| `npm run typecheck` | Validates TypeScript types across the entire project (`tsc --noEmit`). |
| `npm test` | Runs the Vitest test suite to ensure no regressions. |
| `npm run lint` | Runs Next.js ESLint rules and style checks. |
| `npm run build` | Produces production build to catch Next.js bundling and routing issues. |
| `npm run dev` | Starts local Next.js development server. |

Agents must NEVER skip running `npm run typecheck` and `npm test` after modifying code.

---

## 5. TypeScript & Static Typing Standards

1. **Strict Mode Enforced**: Do not disable `strict` in `tsconfig.json`.
2. **Zero `any` Policy**: Never introduce `any`. Use `unknown` with type narrowing, generic parameters, or explicit interfaces.
3. **Explicit Interface Contracts**: Every API response, component prop, and state entity must have an explicit interface in `types/`.
4. **No Type Assertions Without Guarding**: Avoid unsafe `as SomeType` assertions. Prefer Zod or explicit predicate functions (`isDevotee(x)`).
5. **Shared Types**: Put feature-specific types in `features/<feature>/types/` and shared cross-feature types in `lib/` or `types/`.

---

## 6. Next.js 15 App Router & React 19 Standards

1. **Server Components by Default**: All components inside `app/` are Server Components unless client state, effects, or browser APIs are required.
2. **Explicit Client Directives**: Add `'use client'` strictly at the top of files that require React hooks (`useState`, `useEffect`), browser event listeners, or client-only libraries (`framer-motion`).
3. **Metadata & Head Optimization**: Leverage Next.js Metadata API for page titles, descriptions, and OpenGraph headers.
4. **Route Handlers**: Implement API routes in `app/api/.../route.ts` using standard `NextRequest` and `NextResponse`. Always return standard JSON responses with HTTP status codes.
5. **No Leaking Secrets to Client**: Never prefix secret keys with `NEXT_PUBLIC_`. Secret keys belong only in server code or Route Handlers.

---

## 7. Component Architecture & Backward Compatibility Façades

1. **Façade Pattern**: Re-export feature components in `components/` if existing routes depend on them (e.g. `components/Header.tsx` -> `components/layout/Header`).
2. **Small, Focused Components**: Decompose large JSX files into smaller, testable sub-components with single responsibilities.
3. **Accessible Markup**: Use semantic HTML (`<header>`, `<main>`, `<article>`, `<button>`, `<nav>`) with valid ARIA attributes.
4. **Graceful Loading & Empty States**: Every dynamic list or async component must provide loading skeletons and empty state UI.
5. **Error Boundaries**: Wrap critical views or interactive widgets with `ErrorBoundary` to prevent catastrophic page crashes.

---

## 8. Styling, Theming & UI UX Conventions

1. **Tailwind Utility Standards**: Use Tailwind classes for all layouts, typography, and spacing.
2. **Class Merging**: Combine conditional classes using `cn()` (`clsx` + `tailwind-merge`) from `lib/utils` or `tailwind-merge`.
3. **Devotional Theme Aesthetics**: Maintain the sacred Indian temple theme:
   - Primary: Saffron / Warm Amber / Gold hues (`amber-500`, `amber-600`, `orange-600`).
   - Deep tones: Sacred Maroon / Crimson / Rich Slate (`slate-900`, `amber-950`).
   - Subtle background gradients, ornamental borders, and smooth transitions.
4. **Responsive First**: All layouts must render cleanly on mobile (360px+), tablet, and desktop (1440px+).
5. **No Broken Placeholders**: Never render broken image links or `[image placeholder]` text. Use proper fallback visuals or SVG icons from `lucide-react`.

---

## 9. State Management & Hooks Architecture

1. **Colocate State**: Keep state as close to where it is consumed as possible.
2. **Context for Global Cross-Cutting Concerns**: Use React Context sparingly for cross-cutting state (e.g., `I18nProvider`, auth session).
3. **Custom Hooks**: Extract complex stateful logic or side effects into reusable hooks in `features/<feature>/hooks/` or `hooks/`.
4. **Debounced Operations**: Debounce user inputs (search, auto-save) using `useDebounce` to minimize unnecessary render cycles or network queries.
5. **Optimistic Updates**: For resilient UX, update UI optimistically while providing rollback mechanisms if an API call rejects.

---

## 10. API Route Handlers & Data Contracts

1. **Standard Response Envelope**:
   ```typescript
   // Success
   { success: true, data: T, message?: string }
   // Error
   { success: false, error: string, code?: string }
   ```
2. **Validate Request Payloads**: Validate incoming JSON bodies before executing business operations.
3. **HTTP Status Code Discipline**:
   - `200 OK` / `201 Created` for valid executions.
   - `400 Bad Request` for invalid input parameters.
   - `401 Unauthorized` / `403 Forbidden` for missing or insufficient credentials.
   - `404 Not Found` for absent entities.
   - `500 Internal Server Error` for unhandled system exceptions.
4. **Safe Error Messages**: Do not expose raw internal database stack traces or connection strings in API responses.

---

## 11. Persistence Layer & Dual-Mode Storage

1. **Hybrid Architecture**:
   - Primary: MongoDB database via `lib/mongo.ts`.
   - Resilience Fallback: Local JSON storage (`lib/json-store.ts`, `lib/server-store.ts`, `lib/users-store.ts`) whenever MongoDB is unreachable or unconfigured.
2. **Fail-Safe Operations**: System components must fail gracefully to fallback store rather than crashing the Next.js process.
3. **Deterministic ID Generation**: Use safe, collision-resistant booking and devotee IDs.
4. **Atomic Transactions**: In booking and payment reconciliation, ensure status updates are idempotent.

---

## 12. Authentication, Authorization & Admin Gates

1. **Role-Based Protection**: Distinguish Devotee roles from Admin privileges.
2. **Admin Route Protection**: Protect `/admin` routes with `AdminLoginGate` or server middleware. Never trust client-side state alone for sensitive data mutations.
3. **Password Security**: Hash passwords using `bcryptjs` with appropriate salt rounds.
4. **Session Integrity**: Store authentication tokens securely (HTTP-only cookies or encrypted local storage where appropriate).

---

## 13. Payment Integrations & Booking Lifecycle

1. **Supported Gateways**:
   - **Razorpay**: Checkout modal, webhook verification, signature confirmation.
   - **UPI QR Direct**: Dynamic QR generation with reference verification.
2. **Idempotency**: Prevent double bookings or duplicate charges if a user clicks checkout repeatedly.
3. **Booking State Machine**:
   - `pending` -> `confirmed` / `failed` -> `completed` / `cancelled` / `rescheduled`.
4. **Devotee Notifications**:
   - Send confirmation receipts via Twilio WhatsApp API (`lib/whatsapp.ts`) and email when configured.
   - Failures in notification delivery must NOT rollback a confirmed payment or booking.

---

## 14. Error Handling, Resilience & Offline Tolerances

1. **Never Swallow Errors**: Always catch, log with contextual tags, and return intelligible user errors.
2. **Client Fallback Data**: When backend endpoints are temporarily unreachable, catalog components must fall back to static data (`lib/data.ts`) to avoid blank screens.
3. **Network Retries**: Implement exponential backoff or user-retry triggers on transient network faults.
4. **Error Boundaries**: Protect user sessions with fallback recovery buttons (`Try Again`, `Return to Home`).

---

## 15. Security, Input Validation & Data Sanitization

1. **Input Sanitization**: Sanitize devotee names, Gotra, Sankalp notes, and contact fields.
2. **Phone Number Verification**: Validate Indian standard mobile numbers (10 digits, valid prefixes) using `lib/validation.ts`.
3. **Zero Secrets in Git**: Never commit `.env`, API keys, MongoDB credentials, or Razorpay secret keys.
4. **CORS & Rate Limiting**: Ensure public endpoints are guarded against automated spam or denial-of-service abuse.

---

## 16. SEO, Accessibility (a11y) & Performance Standards

1. **Semantic Structure**: Maintain a single `<h1>` per page with hierarchical `<h2>` and `<h3>` tags.
2. **Structured Data (JSON-LD)**: Emit valid schema.org structured data (`Event`, `Place`, `Organization`) via `JsonLd` component for puja and temple pages.
3. **Image Optimization**: Use Next.js `<Image>` or optimized SVGs with proper `alt` descriptions, dimensions, and priority flags for above-the-fold assets.
4. **Dynamic Imports**: Lazy load heavy client widgets (e.g. dynamic QR code generator, interactive maps) to keep Initial Server Response and First Contentful Paint low.

---

## 17. Git Workflow, Branching & Commit Message Guidelines

1. **Branch Naming**:
   - `feature/<name>` for new features.
   - `fix/<name>` for bug fixes.
   - `refactor/<name>` for cleanups.
2. **Conventional Commits**: Format commit messages clearly:
   - `feat(catalog): add Vedic ritual filtering by deity`
   - `fix(booking): prevent duplicate seat allocation on checkout retry`
   - `test(devotee): add unit tests for booking rescheduling`
   - `docs(agents): update engineering guidelines and DoD`
3. **Single Source of Truth**: When architecture decisions or patterns change, update `AGENTS.md` and `ARCHITECTURE.md` in the exact same commit/PR.

---

## 18. Definition of Done (DoD) & PR Quality Checklist

Before submitting a Pull Request, marking any task complete, or merging code, verify every item below. **Failure on any single check disqualifies the PR.**

- [ ] **1. Type Safety**: `npm run typecheck` passes with zero errors and zero warnings.
- [ ] **2. Automated Tests**: `npm test` passes completely (all existing and new tests pass).
- [ ] **3. Linting**: `npm run lint` passes without ESLint rule violations.
- [ ] **4. Production Build**: `npm run build` succeeds without bundle or static generation errors.
- [ ] **5. Architecture Alignment**: New code conforms to feature-driven directory layout (`features/` or `components/common/`).
- [ ] **6. Backward Compatibility**: Existing component exports, props, and public façades remain fully functional.
- [ ] **7. No Stray Artifacts**: No temporary scratch files, debug console logs (`console.log`), or uncommitted debug assets left behind.
- [ ] **8. Security Checked**: No credentials, private tokens, or secrets committed in code or configuration files.
- [ ] **9. Fallback & Resilience**: Storage and network operations handle offline or fallback scenarios gracefully without crashing.
- [ ] **10. Documentation Updated**: `AGENTS.md` and `ARCHITECTURE.md` reflect any new routes, features, or architectural decisions made in the PR.
