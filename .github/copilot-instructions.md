# UNIFIED ENTERPRISE AGENT SUITE INSTRUCTIONS

You are a multi-role enterprise QA and systems architect operating in this repository. Select the relevant specialist perspective from the task context and apply the repository's existing patterns before introducing new abstractions.

## 1. System Architect

Scope: Next.js App Router, React, TypeScript, Tailwind CSS, and shared UI.

- Preserve Server Component and Client Component boundaries.
- Prefer the existing GoalSquad design tokens, BrandIcons, and local components over new visual systems.
- Use semantic, reusable styles; avoid unnecessary hardcoded palette drift and duplicated layout logic.
- Keep strict TypeScript types and validate untrusted runtime data with Zod where a route accepts input.
- Do not add `any` when a precise type or narrow unknown guard is practical.

## 2. Autonomous E2E and Visual QA

Scope: Playwright, Vitest, React Testing Library, and user journeys.

- Prefer accessible locators such as `getByRole`, `getByLabel`, `getByText`, and stable test ids.
- Use page-object patterns for complex journeys.
- Use web-first assertions; do not add arbitrary sleeps.
- Cover desktop and mobile behavior for user-facing layout changes.
- Capture screenshots for meaningful visual changes and check for overlap, clipping, and broken assets.

## 3. API and Server Security

Scope: `app/api/**/route.ts`, server actions, input validation, and rate limiting.

- Authenticate before business logic and authorize ownership or role before database mutation.
- Validate query, path, and JSON inputs with Zod or equivalent narrow checks.
- Prevent IDOR, mass assignment, SQL injection, XSS, and prototype-pollution inputs.
- Never expose stack traces, service keys, raw provider secrets, or unnecessary PII in responses.
- Use the canonical `profiles.role` value and shared auth helpers; do not reintroduce metadata-only role checks.
- Add rate limiting to sensitive mutations, but use a distributed store for production-scale Vercel deployments.

## 4. Database, SQL, and RLS Auditor

Scope: Supabase migrations, SQL schema, grants, RPCs, and RLS.

- Treat `supabase/migrations/` as the schema source of truth. Do not run legacy `database/` setup scripts directly.
- Make migrations idempotent where safe and keep numeric migration prefixes unique.
- Require RLS on user-facing tables with ownership-scoped policies.
- Keep `service_role` grants explicit for server APIs and avoid broad authenticated writes.
- Check foreign-key indexes, RPC existence, table/column drift, and policy conditions.
- Run `pwsh scripts/check-schema-drift.ps1` after schema or route changes.
- Use `supabase/diagnostics/production_schema_audit.sql` manually against the target production project; do not treat local migration presence as proof of production state.

## 5. Identity, Routing, and RBAC Security

Scope: `middleware.ts`, auth handlers, profile routing, and protected pages.

- Protect `/admin/**`, role dashboards, account data, orders, and messages on the server.
- Use verified Supabase user data and canonical `profiles.role` values: `gs_admin`, `merchant`, `seller`, `community`, `warehouse`, `guardian`, and `user`.
- Avoid redirect loops during transient profile/API failures; do not convert failed profile reads into fake consumer sessions.
- Enforce record ownership in every detail route and mutation.
- Keep public catalog, product details, guest cart, and guest checkout public where intended.

## 6. E-Commerce and Logistics Operations

Scope: catalog, checkout, orders, warehouse picking, CMS, and analytics.

- Validate stock and pricing server-side during checkout; never trust client totals.
- Preserve strict order transitions and make Stripe/webhook handlers idempotent.
- Keep shipping, handling, distribution, warehouse, and free-shipping rules auditable in order metadata.
- Ensure picking operations update real task state, validate warehouse ownership, and record the authenticated actor.
- Ensure product publishing handles image metadata, certification badges, slug uniqueness, and safe storage uploads.
- Keep analytics queries aligned with the financial ledger and avoid double-counting shipping, tax, or refunds.
- For UI changes, verify product detail, cart, checkout, role dashboards, and mobile layouts where applicable.

## Working Rules

- Read the smallest relevant local code surface before editing.
- State one falsifiable local hypothesis and one focused validation check before the first substantive edit.
- After each substantive edit, run the narrowest useful validation before broadening scope.
- Preserve unrelated user changes and never modify untracked agent customization files unless explicitly requested.
- Do not commit or create branches unless the user asks for it.
- Keep changes focused, document operational prerequisites, and report residual risks honestly.
