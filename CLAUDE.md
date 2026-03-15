## Who I Am
I'm Clayton, founder of CG Consulting d/b/a Candela — an AI consulting 
and education platform serving nonprofits. I have 10+ years of nonprofit 
leadership experience (most recently senior leadership at CWEE), a 
master's in clinical mental health counseling, and I'm an OIF veteran. 
I build with deep domain knowledge of how nonprofits actually operate.

## Candela — Full Platform Architecture
One platform. One org account per nonprofit. Subscription controls 
access. Every suite and product has its own separate workspace.

**Legal entity:** CG Consulting d/b/a Candela
**Domain:** candela.education
**Tagline:** "La luz que guía"

| Product | What It Is | Type |
|---|---|---|
| Candela Assist | AI tools platform — contains Impact Studio and Fieldwork | Core platform |
| Candela Academy | Video education library for nonprofit staff | Add-on subscription |
| Candela Consulting | AI readiness assessments, implementation sprints, retainer engagements | Services (no build) |

## Candela Assist
AI tools platform for nonprofits. Two suites, each with its own 
separate workspace.

**Stack:** Next.js 14 (App Router), Tailwind CSS, Supabase (auth + DB), 
Anthropic API (claude-sonnet-4-20250514), Stripe, Vercel, Upstash Redis

### Suite 1 — Impact Studio
**Users:** Operations staff, program directors, leadership
**Job:** Turn program data into tailored outputs that communicate 
organizational impact to specific audiences — boards, funders, website, 
staff dashboards, marketing, fundraising.
**Subscription:** Core Candela Assist tier

This is data storytelling, not reporting. The output is the product.

**Workspace architecture (locked):**
- Data Area — persistent org program data, maintained independently of 
  any output generation. Source of truth for all generated content. 
  Never re-entered during generation.
- Projects Area — persistent library of all generated outputs.

**Generator flow (separate from workspace):**
1. Scope — program-specific or whole agency?
2. Data points — which metrics to include
3. View — output type and theme
4. Edit — review and refine
5. Output — saved to Projects

Whole-agency scope aggregates program_data entries for a given period 
at the generator level. No special schema row needed.

### Suite 2 — Fieldwork
**Users:** Case managers, care coordinators, navigators, direct service 
staff
**Job:** Reduce documentation burden — progress notes, referral letters, 
safety plan summaries. No client PII stored or logged.
**Subscription:** Add-on (separate workspace)
**Compliance gate:** HIPAA infrastructure required before public launch

**Critical UX detail:** After a progress note is generated, a blank 
"Client Name:" field must appear at the top. Never pre-filled.

### Candela Academy
Separate product — not part of Candela Assist. Video education library.
All-or-nothing add-on subscription. Same org account. Separate workspace.
Two tracks: Program/Direct Staff + Operations.
Status: YouTube-first. 4 videos before going public.

## Brand — Never Deviate
| Token | Hex |
|---|---|
| Midnight Ink | #1B2B3A |
| Solar Gold | #E9C03A |
| Warm Stone | #EDE8DE |
| Cerulean | #3A6B8A |

**Fonts:** Cormorant Garamond (display/headings) + DM Sans (body/UI)
**Retired fonts (never use):** Fraunces, Jost, DM Mono
**Logo:** C-arc mark — lit neon-tube C with rays. Canonical March 13, 2026.

## Database Schema (Target — Empty, No Migration Needed)
Old programs.metrics jsonb array replaced by purpose-built tables.

| Table | Purpose |
|---|---|
| orgs | Org account |
| programs | Program definition — name, description, archived |
| program_metrics | What a program tracks — metric_name, target, display_order |
| program_data | Persistent data layer — one row per program per period |
| program_data_points | Actual metric values per data entry |
| projects | Output library — scope chosen in generator |
| project_runs | References program_data via data_entry_id — no inline data collection |
| generated_views | Output HTML per run |
| brand_kits | Org branding |
| org_users | User-to-org membership |
| team_invites | Team invitations |
| logic_models | Logic model outputs |

## Admin Auth Pattern (Locked)
x-admin-key header only. Never query Supabase directly from 
`use client` components in /admin — RLS blocks it. Always use API 
routes with service role client.

Env vars required:
- ADMIN_USER_ID = Clayton's Supabase UUID
- SUPABASE_SERVICE_ROLE_KEY = from Supabase → Settings → API
- ADMIN_KEY = candela-admin-2026
- NEXT_PUBLIC_ADMIN_KEY = candela-admin-2026

## Git Rules (Locked)
- Always branch: `git checkout -b fix/description` or `feat/description`
- Never `git add .` from root — always `git add src/ supabase/`
- Never `git push --force` without flagging to Clayton first
- Always test locally before merging: checkout → npm run dev → 
  localhost:3001 → confirm → merge to main
- Windows/PowerShell: `Remove-Item -Recurse -Force .next` not rm -rf
- Run commands one at a time, never chained with &&
- Project root is C:\Users\17192 — never cd candela-assist
- End every prompt with the standard test reminder message

## Claude Code Autonomous Run
```bash
claude --dangerously-skip-permissions
```
End every Claude Code prompt with: "When complete, push the branch 
only. Display this message: 'Branch pushed. Before merging, test 
locally: git checkout [branch-name] → npm run dev — test on 
localhost:3001 before merging to main.'"

## Phase Roadmap
- Phase 1: Policy Q&A chatbot — deferred
- Phase 2: Impact Studio + Fieldwork — active build
- Phase 3: Workflow integrations — future
- Phase 4: HIPAA-compliant infrastructure — required before Fieldwork launch

## Current Priorities
- [ ] Fix admin orgs/users RLS — fix prompt in handoff doc
- [ ] Invite Kelsey, complete testing
- [ ] App walkthrough against Source of Truth — build triage list
- [ ] Schema rebuild in Supabase — new program_data layer
- [ ] Workspace redesign — Data area + Projects area decoupled
- [ ] Denver nonprofit pilot outreach
- [ ] SAM.gov registration + SBA VetCert

## Legal / Compliance
- Colorado AI Act effective June 30, 2026
- HIPAA / BAAs required before any client health data — Phase 4 gate
- 42 CFR Part 2 relevant for substance use data
- Data ownership agreements needed with nonprofit partners
- First legal resource: CU Law Entrepreneurial Law Clinic

## Workflow Preferences
- Chat = brainstorm, design, draft prompts. Refine before coding.
- Claude Code = execution only on clean, scoped tasks.
- Keep responses focused. One clarifying question, not assumptions.
- Explain architecture tradeoffs briefly.
- Notion is the primary doc hub — flag anything to save.
- No generic AI/SaaS advice ignoring nonprofit context.
- No over-engineered solutions — solo founder, keep it lean.
- No explanations of basic nonprofit concepts.

## Source of Truth
⚓ Candela Assist — Source of Truth (Clean Anchor) in Notion is the 
authoritative reference for all product decisions. Read it before 
building anything.