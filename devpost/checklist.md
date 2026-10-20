---
doc: checklist
status: approved
---

# Build Checklist

Build mode: learn

## Slices

- [x] **1. Tap Start, open cases that roll and land on exercises, see them on a plan**
  Becomes usable: A running dark, phone-width app: Start → a Cases screen with a fixed default draw (fully random, 4 cases, gym) → tap each case, the strip spins and stops on an exercise → a simple plan lists each exercise with sets × reps. No setup screens yet.
  Why now: The case-opening reveal is the unique kernel and the riskiest animation. Proving it first means everything else is built around a reveal that already feels right. Bootstrapping, the exercise data, and the draw logic come along because the roll needs them. This is also where we find, vet, and install the UI/animation skills, so the skill shapes the kernel rather than polishing it afterward.
  PRD ref: `prd.md > Exercise Case Openings`, `prd.md > Workout Plan`, `prd.md > Screens and Layout`
  Spec ref: `spec.md > Stack`, `spec.md > Look and Feel`, `spec.md > Components` (App Shell and Flow, Draw State, Draw Logic, Exercise Data, StartScreen, CaseRoll, CasesScreen, PlanScreen), `spec.md > Data Model`, `spec.md > File Structure`, `spec.md > Decisions and Open Issues` (Learning: finding and using UI/animation skills)
  Build: With the learner, search for, vet, and install UI/animation skills (record which and why). Scaffold Vite + React + TypeScript, add `motion` and Vitest, base dark tokens and the Continue arrow button. Write `data/exercises.ts` (7 groups, gym + bodyweight, sets/reps ranges, warm-ups), `lib/draw.ts` (`drawExercise` with no repeats and sets/reps within ranges), the reducer in `App.tsx`, `StartScreen`, `CaseRoll` (result-first strip, eased stop under a center marker), `CasesScreen` in fully random mode, and a basic `PlanScreen`. Build `CaseRoll` using the chosen skill.
  Verify (mechanical): `npm test` passes the draw tests (no repeats across 4 draws, sets/reps within ranges); `npm run build` succeeds with no type errors; `npm run dev` starts and the page serves without errors.
  Learner check: Run `npm run dev`, open `http://localhost:5173` in phone-sized DevTools, tap Start, tap each case and watch it roll, then check the plan. Does the roll feel like a case opening? What would you change about its speed, stop, or look?
  Commit: `Add case-opening roll and basic plan with fully random draw`

- [ ] **2. The time wheel decides how many cases you get**
  Becomes usable: Start → Time wheel → Cases. Dragging the dial ticks the minutes (15 / 45 / 60 / 120 at the quarter points), Continue only works above zero, and the number of cases follows the time.
  Why now: The wheel is the second hardest interaction (pointer angle → minutes) and it feeds the exercise count everything else depends on. Putting it right after the kernel connects setup to the reveal.
  PRD ref: `prd.md > Time Wheel`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components` (TimeWheel / TimeScreen, Draw Logic: `exerciseCountFor`), `spec.md > Look and Feel` (Time wheel)
  Build: `lib/timeWheel.ts` (piecewise angle ↔ minutes, clamped 0–120, no wrap), `TimeWheel` + `TimeScreen` with the tabular readout, `exerciseCountFor`, and wire `setMinutes`/`next`/`back` in the reducer.
  Verify (mechanical): Unit tests: 90° → 15, 180° → 45, 270° → 60, 360° → 120, clamps at both ends; `exerciseCountFor` ranges; `npm test` and `npm run build` pass.
  Learner check: Drag the wheel around, watch the time tick, and try Continue at 0 and then at around 1 h. Does the dial feel physical, and do you get the number of cases you'd expect?
  Commit: `Add time wheel that sets the exercise count`

- [ ] **3. Pick muscle groups, watch the slot machine split the count, open cases group by group**
  Becomes usable: Start → Time → Body map (or Fully random) → Count slot reels → Cases for each group in turn → Plan. Too many groups for the time means some reels land on 0 and those groups get no cases. Back works on the setup screens.
  Why now: This is the second layer of the reveal (count, then exercises) and holds the most draw rules (`planCounts`, dropping groups). It needs the time from slice 2.
  PRD ref: `prd.md > Muscle Group Body Map`, `prd.md > Count Slot Machine`, `prd.md > Exercise Case Openings`, `prd.md > Product Decisions`
  Spec ref: `spec.md > Components` (BodyMap / MuscleScreen, SlotReels / CountScreen, CasesScreen, Draw Logic: `planCounts`, Draw State), `spec.md > The Core Journey Through the System`
  Build: `BodyMap` (front/back SVG, 7 tappable regions with a spring pop, Fully random toggle), `MuscleScreen`, `planCounts`, `lockDraw`, `SlotReels` + `CountScreen` (staggered stops, skipped in fully random), and `CasesScreen` going group by group.
  Verify (mechanical): Unit tests: counts always sum to the total; with 7 groups at 15 min exactly 3 groups get 1 and the rest 0; no repeats across a whole draw. `npm test` and `npm run build` pass.
  Learner check: Pick 2–3 muscles at about 45 min and play the whole draw. Then pick all 7 at 15 min and watch some reels land on 0. Try Back from the body map. Does the two-step reveal (count, then cases) feel fun or slow?
  Commit: `Add body map, count slot machine, and per-group cases`

- [ ] **4. Gym or home with the neon switch**
  Becomes usable: Muscles → Gym/Home neon screen → rolls. Flipping the switch lights one sign with a flicker and a click. Home draws only bodyweight exercises, and groups with few bodyweight options never get an empty case.
  Why now: It filters the pool the earlier slices already draw from, so it slots in once that pool is used end to end. Its failure mode (small home pools) needs `planCounts` to exist first.
  PRD ref: `prd.md > Gym / Home Switch`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Components` (NeonSwitch / EquipmentScreen), `spec.md > Important Failure Modes`, `spec.md > Look and Feel` (Neon switch)
  Build: `NeonSwitch` + `EquipmentScreen` (neon tubes, flicker keyframe, chunky toggle), a switch click added to `lib/sound.ts` (fails silently), `setPlace`, the `place` filter in `drawExercise`, and pool-size capping in `planCounts`. Move the draw lock to this screen's Continue.
  Verify (mechanical): Unit tests: home draws are all bodyweight; home + biceps-heavy selection never exceeds the pool, and the total shrinks if needed. `npm test` and `npm run build` pass.
  Learner check: Flip between GYM and HOME and listen for the click. Run a Home draw with biceps and triceps and check every exercise is something you could do without equipment.
  Commit: `Add neon gym/home switch and bodyweight filtering`

- [ ] **5. Warm-up roll, polished plan, New Draw, and Start over**
  Becomes usable: The full journey: a warm-up roll (can land on "No warm-up") before the count, plan cards that animate in one by one with the warm-up on top, New Draw back to Start, a corner menu with Start over during the rolls, and smooth transitions between screens.
  Why now: These finish the journey around a core that already works. They reuse `CaseRoll` and the reducer, so they're lower-risk and belong last.
  PRD ref: `prd.md > Warm-up Roll`, `prd.md > Workout Plan`, `prd.md > Start Over (during rolls)`, `prd.md > The Core Journey`
  Spec ref: `spec.md > Components` (WarmupScreen, PlanScreen, MenuButton, App Shell and Flow), `spec.md > Look and Feel` (Plan, Rolls)
  Build: `drawWarmup`, `WarmupScreen` using `CaseRoll`, polished `PlanScreen` cards with staggered entry, `MenuButton` with Start over (`reset`), New Draw, and `AnimatePresence` screen transitions in `App`.
  Verify (mechanical): Unit test that `drawWarmup` can return both a warm-up and "No warm-up"; a reducer test that `reset` from a roll step returns to a clean Start state; `npm test` and `npm run build` pass; `npm run dev` serves without errors.
  Learner check: Play the whole journey Start → Plan, then Start over mid-roll once and confirm nothing carries over, and New Draw from the plan.
  Commit: `Add warm-up roll, plan cards, new draw, and start over`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 1: you try the case-opening roll so its feel can shape the warm-up and every later roll. Tried on desktop and phone (LAN); feedback applied: always spin despite OS reduced motion, tick + land sounds, steadier slowdown, winner pop-and-shake, glowing cases with a chest-style lid that opens before the roll and shows the muscle color after landing. Learner confirmed "looks good".
- [ ] Final kick-the-tires exploration and feedback completed

## Final Review

- [ ] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [ ] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [ ] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [ ] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: [what actually happened; real document/test/code references; unfinished work if interrupted]
Route and stops: [actual paths and symbols; guided stops completed, or reference-only route]
Edit outcome: [tried/kept/reverted/declined/not applicable; verification if changed]
Reflection: [offered/answered/declined/already covered — personal answer belongs only in the ignored profile]
Activity mode: [live app and editor, explicit static fallback, focused alternative, prior practice, or recap]

## Revisions

- Motion skill source changed from jezweb to secondsky/claude-skills — the jezweb `motion` skill no longer exists in that repo. Installed `frontend-design` + `motion`; skipped `animate` (overlap, outdated imports, no license). `spec.md > External Services and Dependencies` updated.
- Reducer moved to `src/lib/drawState.ts` (still one `useReducer` in `App`) — keeps `App` small and lets slice 5 test `reset` directly. `spec.md > File Structure` updated.
- Pull-up, chin-up, dips, and hanging leg raise marked gym-only; added loaded backpack curl — they use bodyweight but need a bar, which would break "Home = no equipment".
- Cases screen puts the strip near the top and the case row at the bottom — the fixed middle-right Continue arrow overlapped both when they were centered.
- Rolls always spin (`MotionConfig reducedMotion="never"`) — the learner's PC has Windows animation effects off, so the skill's `reducedMotion="user"` made rolls jump straight to the result; learner chose always-spin, with a manual toggle possible in a later settings menu. `spec.md > Components > CaseRoll` updated.
- `lib/sound.ts` moved from slice 4 into slice 1 with a roll tick and land chime, plus a pop-and-shake on the winner — learner feedback at the early checkpoint. Slice 4 adds only the switch click.
- Roll curve changed to a steady ease-out quad over 5.2 s with a longer strip — the steep curve crawled inside the last card for ~1.5 s, so ticks went silent while it was visibly slowing (learner feedback).
- Cases became `CaseTile` with a lid seam, ready glow, and a lid that opens before the roll; the inside shows the muscle color only after landing so it doesn't spoil the result (learner feedback). `spec.md > Components > CasesScreen` updated.
