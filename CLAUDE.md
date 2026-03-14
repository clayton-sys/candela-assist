# CLAUDE.md — Candela Assist

> This file is read automatically by Claude Code at the start of every session.
> Keep it updated as the project evolves. It is the source of truth for session context.

---

## Project Overview
Candela Assist is an AI-powered documentation platform for nonprofits, built by CG Consulting d/b/a Candela. It has two core tool suites:

- **Case Manager Suite** — generates progress notes, referral letters, and safety plan summaries. No client PII stored.
- **Grant Suite** — structured 5-question intake flow → funder-ready grant report narratives. Designed for program staff, not grant writers.

**Owner:** Clayton @ CG Consulting | candela.education
**Deployment:** Vercel | **DB/Auth:** Supabase | **Payments:** Stripe

---

## Tech Stack
| Layer | Tech |
|---|---|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS (utility-first, no custom CSS files) |
| Database + Auth | Supabase |
| AI | Anthropic API — always use `claude-sonnet-4-20250514` |
| Payments | Stripe |
| Rate Limiting | Upstash Redis — **required before any public URL** |
| Hosting | Vercel |

---

## Folder Conventions
```
/app               → Next.js App Router pages and layouts
/app/api           → API routes (including Anthropic calls)
/components        → Reusable UI components
/lib               → Shared utilities
/lib/anthropic.ts  → All Anthropic API calls go here — never inline elsewhere
/lib/supabase.ts   → Supabase client
/lib/redis.ts      → Upstash rate limiting logic
/types             → TypeScript types and interfaces
```

---

## Brand Tokens
Always use these — never substitute generic colors.
```css
--gold:           #E9C03A;   /* primary accent / CTAs / C-arc */
--gold-pale:      #f5e08a;   /* highlight layer in gradients */
--gold-dim:       #b8741a;   /* shadow layer in gradients */
--ink:            #1B2B3A;   /* mid-dark surfaces, nav, cards */
--ink-deep:       #0f1c27;   /* primary dark background / website canvas */
--stone:          #EDE8DE;   /* light backgrounds / body text on dark */
--stone-dim:      #d8d2c4;   /* borders on light surfaces */
--cerulean:       #3A6B8A;   /* inner arc, secondary data, links */
--cerulean-light: #5a8fad;   /* hover states, gradient endpoints */
--teal:           #1D9E75;   /* success / positive outcomes */
--coral:          #D85A30;   /* at-risk / warning */
--amber:          #BA7517;   /* watch / monitoring */

/* Typography */
--font-display: 'Cormorant Garamond', Georgia, serif;  /* headings, H1-H3, wordmark */
--font-body:    'DM Sans', system-ui, sans-serif;       /* body, UI, labels */
```
**Retired fonts:** Fraunces, Jost, DM Mono — do not use.

---

## Coding Rules
- **TypeScript everywhere.** No plain JS files.
- **Tailwind only** for styling. No CSS modules, no styled-components.
- **All Anthropic calls** go through `/lib/anthropic.ts` — never make raw fetch calls to the API from components or pages.
- **No client PII** stored in the database. Case manager inputs are processed and discarded — outputs only.
- **Rate limiting middleware** must be active on all AI-powered routes before deploying to a public URL.
- Use `async/await`, not `.then()` chains.
- Prefer explicit error handling with `try/catch` over silent failures.

---

## AI / Prompt Rules
- Model: `claude-sonnet-4-20250514` — do not change without explicit instruction
- Max tokens by output type:
  - Progress notes, referral letters, safety plan summaries → 1000
  - Grant report narratives → 2000
- System prompts live in `/lib/prompts/` as named `.ts` files — not inline in API routes
  - Case Manager Suite prompts: `/lib/prompts/case-manager/`
  - Grant Suite prompts: `/lib/prompts/grant-suite/`
- Grant Suite intake is a **5-question structured flow** — the prompt receives all 5 answers before generating output, not one at a time
- Never log user input content to the console in production

---

## Security / Compliance Rules
- **Never commit API keys.** Use `.env.local` for all secrets.
- Rate limiting via Upstash Redis is **non-negotiable** on all `/api/ai/*` routes.
- Colorado AI Act effective June 30, 2026 — flag any feature that makes automated decisions affecting users.
- HIPAA / BAA infrastructure is **Phase 4** — do not build toward it yet unless explicitly instructed.
- 42 CFR Part 2 applies to any substance-use-related data — flag before building any such feature.

---

## Current Sprint
> Update this section at the start of each new work session.

**Phase:** 2 — Case Manager Documentation Assistant
**In progress:** [update per session]
**Blocked on:** [update per session]
**Next up:** [update per session]

---

## Do Not
- Bypass or remove rate limiting middleware
- Store or log any case manager input content
- Use a different Anthropic model without instruction
- Add external dependencies without discussing tradeoffs first (solo founder, keep it lean)
- Write inline styles or override Tailwind with custom CSS
