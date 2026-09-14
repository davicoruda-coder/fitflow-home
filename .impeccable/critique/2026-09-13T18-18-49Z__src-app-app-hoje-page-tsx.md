---
target: /hoje
total_score: 24
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
p2_count: 3
target_identity: "file:/home/ruda/Projetos/fitflow_home/src/app/(app)/hoje/page.tsx"
target_fingerprint: "sha256:42370b4bd57a31df5a4f58c915021ba7ca1e59a7bd03b86faeb05419c6e0e0a8"
target_path: /home/ruda/Projetos/fitflow_home/src/app/(app)/hoje/page.tsx
timestamp: 2026-09-13T18-18-49Z
slug: src-app-app-hoje-page-tsx
closed: true
---
Method: dual-agent (A: aafb23a9-64d4-4bd4-b243-65f86f283ee2 · B: f63098a6-cfab-49a6-bad6-3c390c456e0d)

# Critique: /hoje (`src/app/(app)/hoje/page.tsx`)

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Date, plan eyebrow, streak, active Hoje — but no “já treinou hoje” state despite logs being loaded |
| 2 | Match System / Real World | 3 | Calm PT-BR; **Ofensiva** is opaque gaming jargon |
| 3 | User Control and Freedom | 3 | Rest / walk tip / train-anyway / nav exits; no traps on this route |
| 4 | Consistency and Standards | 3 | Tokens match DESIGN.md; rest vs train CTA weight fights “intentional rest” |
| 5 | Error Prevention | 2 | Rest-day primary green CTA invites accidental train; SQL-facing errors |
| 6 | Recognition Rather Than Recall | 3 | Thumbs + names + labeled nav; Ofensiva unexplained |
| 7 | Flexibility and Efficiency | 2 | Lean prefetch on Começar; no accelerators; schedule lives in Perfil |
| 8 | Aesthetic and Minimalist Design | 2 | Train day calm; rest stacks rest card + train block + lists + metrics chip |
| 9 | Error Recovery | 2 | Banners name problems but prescribe “Rode a migration/seed SQL” |
| 10 | Help and Documentation | 2 | Rest copy + /descanso help; no inline meaning for Ofensiva / A vs B |
| **Total** | | **24/40** | **Acceptable** |

## Design Specificity Verdict

**LLM assessment:** Mostly FitFlow Home — canopy/ember, Sora/Manrope, “Olá”, Antes/No circuito/Alongamento final read as The Calm Home Circuit, not a generic gym dashboard. It slips toward category-generic on rest days (full green **Treinar mesmo assim** + full roster), unexplained **Ofensiva**, and MetricsReminderBanner as a second job on the home decision screen.

**Deterministic scan:** 1 advisory — `design-system-font-size` at `hoje/page.tsx:303` (`text-[10px]` on Ofensiva label; DESIGN.md label floor is 0.75rem / 12px). Related shell files (layout, BottomNav, MetricsReminderBanner, ExerciseThumb, ui) clean. Not a false positive.

**Visual overlays:** No reliable user-visible overlay. Live `/hoje` redirects to `/login` (auth). No local Next server for inject. Fallback: source review + committed `docs/screenshots/hoje.png` + CLI detector.

## Overall Impression

Train-day `/hoje` is close to the north-star job: greet → know today’s circuit → **Começar**. The biggest opportunity is making **rest** and **already-done** first-class calm states so the home screen always answers “what do I do *now*?” without selling the workout harder than the plan.

## What's Working

1. **Train-day composition** — eyebrow → title → duration meta → large **Começar** matches Consistency over volume.
2. **Session IA in lists** — Antes / No circuito / Alongamento final mirrors real session phases without catalog noise.
3. **System craft** — tokens, elevated cards, large targets, desktop two-column + rail feel authored for this PWA.

## Priority Issues

### P1 — Rest day sells training harder than rest
- **What:** Ember rest card + walk tip, then canopy **Treinar mesmo assim** + full ExerciseLists.
- **Why:** Undermines intentional rest; guilt / accidental start.
- **Fix:** Rest as resolved state; demote train-anyway to outline/text; collapse lists until chosen.
- **Suggested command:** `$impeccable quieter` / `$impeccable layout`

### P1 — No “já treinou hoje” state
- **What:** Logs drive streak only; UI never reflects a completed session today.
- **Why:** Peak-end and status fail; streak alone ≠ “you’re done.”
- **Fix:** Done summary + next cue; train-again secondary.
- **Suggested command:** `$impeccable shape` (state) then `$impeccable polish`

### P2 — MetricsReminderBanner interrupts the day decision
- **What:** Chip between Header and plan → Histórico.
- **Why:** Second job before north-star action.
- **Fix:** Defer to Histórico / post-session / dismissible footer.
- **Suggested command:** `$impeccable distill` / `$impeccable layout`

### P2 — Ofensiva chip unclear + tiny label
- **What:** Number + `text-[10px]` OFENSIVA; detector advisory confirms off-ramp type.
- **Why:** Recognition + a11y; pressure without clarity.
- **Fix:** Plain label (Sequência / Dias seguidos), ≥12px, optional hint.
- **Suggested command:** `$impeccable clarify` / `$impeccable typeset`

### P2 — Operator-facing empty/error copy
- **What:** Migration/seed SQL language on user-facing ErrorBanner/EmptyState.
- **Why:** Breaks calm trust for non-dev users.
- **Fix:** User recovery copy; SQL only in logs.
- **Suggested command:** `$impeccable clarify` / `$impeccable harden`

## Persona Red Flags

**Casey (mobile):** CTA mid-page above long lists; metrics mis-tap; rest dual CTAs before settling.
**Jordan (first-timer):** Ofensiva unexplained; rest three paths without recommended default; SQL errors.
**Seated home trainee (consistency):** Rest still looks like a workout brief; no “you already showed up” after session; metrics compete with 15-min promise.

## Minor Observations

- Desktop rail eyebrow **App** is wasted vs strong tagline.
- Exercise rows are solid; preview-only (fine if intentional).
- No global `:focus-visible` styling beyond browser defaults.
- `animate-fade-up` respects reduced motion.
- Auth blocked live Hoje screenshots this run.

## Questions to Consider

1. If rest is first-class success, why is the loudest rest-day control still **Treinar mesmo assim**?
2. What should `/hoje` say in the 10 seconds after finishing — and why is that empty?
3. Does **Ofensiva** earn its fear/pride, or would quieter consistency language fit better?
4. Should body metrics ever sit above **Começar**?
5. How much of the roster must be visible before start for trust vs scrolling past the decision?
