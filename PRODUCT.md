# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: the product owner (home trainee who works/studies seated and wants a short, reliable daily circuit).  
Audience today is personal / small-circle use; the app is public on the web but is not positioned as multi-tenant SaaS with roles or orgs.

*(Inferred from product usage and repo — user asked to proceed without re-answering the interview.)*

## Product Purpose

FitFlow Home makes it possible to complete a focused **~15-minute home strength circuit** with clear guidance (video + cues), so the user keeps a streak and protects posture/spine without needing a gym or long sessions.

Success = the user opens the app, knows what to do today, finishes (or intentionally rests), and comes back tomorrow — with optional body metrics over time.

## Positioning

A **fixed A/B home circuit** with equipment the user already owns (push-up bars + ab wheel + bodyweight), plus warmup and cool-down outside the 15-minute timer — optimized for consistency and spinal-friendly form, not for an endless exercise library or AI coach.

## Operating Context

- Use on phone (PWA) or desktop browser.
- Auth with email/password (Supabase).
- Day plan: everyday | alternate (default) | weekdays — with optional “train anyway” on rest days.
- Session flow: dynamic warmup → timed circuit (3 rounds) → static cool-down → save log.
- Profile: schedule, theme, password; Histórico: logs + height/weight + 30-day check-in and evolution tips.

## Capabilities and Constraints

**Capabilities (shipped):**
- Workouts A and B with catalog exercises, media under `/exercises/`, cues in PT-BR
- Warmup (cat-cow) and cool-down (child’s pose, chest, quads) — skippable
- Streak (“ofensiva”), workout history, body metrics chart/analysis
- Confirmations on logout, reset data, early end of session
- Light/dark theme; responsive layout (mobile bottom nav, desktop side rail)

**Constraints to preserve:**
- Name: **FitFlow Home**
- Language: **PT-BR**
- Session length: **15 minutes** on the circuit timer (warmup/cool-down outside)
- Home training with **push-up bars, ab wheel, bodyweight** — no gym machines / free-weight plate loading
- Keep the product lean: prefer progression of the same patterns over a large exercise library
- No admin roles / multi-org tenancy in the current product

**Open / undecided:** whether the product will later target a broader public audience beyond the owner.

## Brand Commitments

- Product name: FitFlow Home  
- Domain in use: fitflow.davicosystems.ia.br  
- Voice: direct, calm, practical Portuguese — coaching cues without hype or medical claims beyond general fitness guidance

## Evidence on Hand

- Live app and screenshots under `docs/screenshots/`  
- Exercise demo videos/webp in `public/exercises/`  
- Roadmap backlog in `ROADMAP.md` (ideas, not current product promises)  
- Do **not** fabricate testimonials, clinical outcomes, or competitor benchmarks

## Product Principles

1. **Consistency over volume** — short sessions that get done beat long plans that get skipped.  
2. **Spine-aware strength** — form cues and cool-down matter as much as the circuit.  
3. **Decide less** — fixed A/B + schedule modes; avoid choice overload.  
4. **Honest guidance** — video + short cues; confirm destructive actions; no fake marketing claims.  
5. **Ship lean** — grow via progression/variants when needed, not catalog inflation.

## Accessibility & Inclusion

No formal WCAG target locked yet. Practical expectations: usable on mobile, respect `prefers-reduced-motion` where motion exists, readable contrast in light/dark themes. Future work should not regress these without an explicit decision.
