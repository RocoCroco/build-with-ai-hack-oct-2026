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

- [x] **2. The time wheel decides how many cases you get**
  Becomes usable: Start → Time wheel → Cases. Dragging the dial ticks the minutes (15 / 45 / 60 / 120 at the quarter points), Continue only works above zero, and the number of cases follows the time.
  Why now: The wheel is the second hardest interaction (pointer angle → minutes) and it feeds the exercise count everything else depends on. Putting it right after the kernel connects setup to the reveal.
  PRD ref: `prd.md > Time Wheel`, `prd.md > States and Boundaries`
  Spec ref: `spec.md > Components` (TimeWheel / TimeScreen, Draw Logic: `exerciseCountFor`), `spec.md > Look and Feel` (Time wheel)
  Build: `lib/timeWheel.ts` (piecewise angle ↔ minutes, clamped 0–120, no wrap), `TimeWheel` + `TimeScreen` with the tabular readout, `exerciseCountFor`, and wire `setMinutes`/`next`/`back` in the reducer.
  Verify (mechanical): Unit tests: 90° → 15, 180° → 45, 270° → 60, 360° → 120, clamps at both ends; `exerciseCountFor` ranges; `npm test` and `npm run build` pass.
  Learner check: Drag the wheel around, watch the time tick, and try Continue at 0 and then at around 1 h. Does the dial feel physical, and do you get the number of cases you'd expect?
  Commit: `Add time wheel that sets the exercise count`

- [x] **3. Pick muscle groups, watch the slot machine split the count, open cases group by group**
  Becomes usable: Start → Time → Body map (or Fully random) → Count slot reels → Cases for each group in turn → Plan. Too many groups for the time means some reels land on 0 and those groups get no cases. Back works on the setup screens.
  Why now: This is the second layer of the reveal (count, then exercises) and holds the most draw rules (`planCounts`, dropping groups). It needs the time from slice 2.
  PRD ref: `prd.md > Muscle Group Body Map`, `prd.md > Count Slot Machine`, `prd.md > Exercise Case Openings`, `prd.md > Product Decisions`
  Spec ref: `spec.md > Components` (BodyMap / MuscleScreen, SlotReels / CountScreen, CasesScreen, Draw Logic: `planCounts`, Draw State), `spec.md > The Core Journey Through the System`
  Build: `BodyMap` (front/back SVG, 7 tappable regions with a spring pop, Fully random toggle), `MuscleScreen`, `planCounts`, `lockDraw`, `SlotReels` + `CountScreen` (staggered stops, skipped in fully random), and `CasesScreen` going group by group.
  Verify (mechanical): Unit tests: counts always sum to the total; with 7 groups at 15 min exactly 3 groups get 1 and the rest 0; no repeats across a whole draw. `npm test` and `npm run build` pass.
  Learner check: Pick 2–3 muscles at about 45 min and play the whole draw. Then pick all 7 at 15 min and watch some reels land on 0. Try Back from the body map. Does the two-step reveal (count, then cases) feel fun or slow?
  Commit: `Add body map, count slot machine, and per-group cases`

- [x] **4. Gym or home with the neon switch**
  Becomes usable: Muscles → Gym/Home neon screen → rolls. Flipping the switch lights one sign with a flicker and a click. Home draws only bodyweight exercises, and groups with few bodyweight options never get an empty case.
  Why now: It filters the pool the earlier slices already draw from, so it slots in once that pool is used end to end. Its failure mode (small home pools) needs `planCounts` to exist first.
  PRD ref: `prd.md > Gym / Home Switch`, `prd.md > Look and Feel`
  Spec ref: `spec.md > Components` (NeonSwitch / EquipmentScreen), `spec.md > Important Failure Modes`, `spec.md > Look and Feel` (Neon switch)
  Build: `NeonSwitch` + `EquipmentScreen` (neon tubes, flicker keyframe, chunky toggle), a switch click added to `lib/sound.ts` (fails silently), `setPlace`, the `place` filter in `drawExercise`, and pool-size capping in `planCounts`. Move the draw lock to this screen's Continue.
  Verify (mechanical): Unit tests: home draws are all bodyweight; home + biceps-heavy selection never exceeds the pool, and the total shrinks if needed. `npm test` and `npm run build` pass.
  Learner check: Flip between GYM and HOME and listen for the click. Run a Home draw with biceps and triceps and check every exercise is something you could do without equipment.
  Commit: `Add neon gym/home switch and bodyweight filtering`

- [x] **5. Warm-up roll, polished plan, New Draw, and Start over**
  Becomes usable: The full journey: a warm-up roll (can land on "No warm-up") before the count, plan cards that animate in one by one with the warm-up on top, New Draw back to Start, a corner menu with Start over during the rolls, and smooth transitions between screens.
  Why now: These finish the journey around a core that already works. They reuse `CaseRoll` and the reducer, so they're lower-risk and belong last.
  PRD ref: `prd.md > Warm-up Roll`, `prd.md > Workout Plan`, `prd.md > Start Over (during rolls)`, `prd.md > The Core Journey`
  Spec ref: `spec.md > Components` (WarmupScreen, PlanScreen, MenuButton, App Shell and Flow), `spec.md > Look and Feel` (Plan, Rolls)
  Build: `drawWarmup`, `WarmupScreen` using `CaseRoll`, polished `PlanScreen` cards with staggered entry, `MenuButton` with Start over (`reset`), New Draw, and `AnimatePresence` screen transitions in `App`.
  Verify (mechanical): Unit test that `drawWarmup` can return both a warm-up and "No warm-up"; a reducer test that `reset` from a roll step returns to a clean Start state; `npm test` and `npm run build` pass; `npm run dev` serves without errors.
  Learner check: Play the whole journey Start → Plan, then Start over mid-roll once and confirm nothing carries over, and New Draw from the plan.
  Commit: `Add warm-up roll, plan cards, new draw, and start over`

- [x] **6. Share the plan as text or as a photo**
  Becomes usable: The plan screen gets Share text and Save photo. Text opens the phone's share sheet (clipboard on desktop); the photo is the plan drawn as an image card, shared or downloaded.
  Why now: Learner chose to add content before shipping ("be able to share it"); lowest risk, so it comes first.
  Build: `lib/share.ts` (`planText` pure + tested, `planImage` drawn on a canvas, no new dependency), share buttons on `PlanScreen`.
  Verify (mechanical): `planText` unit tests (warm-up line, "No warm-up" skipped, sets × reps); `npm test` and `npm run build` pass.
  Learner check: Share the text to a chat and save the photo from your phone. Does the image look like something you'd post?
  Commit: `Add share as text and photo on the plan`

- [x] **7. Tap an exercise to see how to do it**
  Becomes usable: Tapping a plan card slides up a detail sheet: name, muscle, sets × reps, a few form cues, and Watch on YouTube (a search for the exercise, so the link never breaks).
  Build: cues per exercise in `data/howTo.ts`, `ExerciseSheet`, YouTube search URL helper.
  Verify (mechanical): every exercise and warm-up has cues (test); `npm test` and `npm run build` pass.
  Learner check: Open a few exercises; are the cues right and is the video search useful?
  Commit: `Add exercise detail sheet with form cues and YouTube link`

- [x] **8. Experiment: animated how-to figure**
  Becomes usable: An animated SVG figure in the detail sheet for 3 trial exercises (push-up, bodyweight squat, dumbbell curl), driven by pose keyframes. If the learner likes them, roll out to more; if not, keep YouTube only.
  Build: `ExerciseFigure` (joint-angle poses, looping), poses for the 3 trial exercises.
  Learner check: Do the figures read as the exercise? Keep, improve, or drop?
  Commit: `Add animated exercise figure for trial exercises`

- [x] **9. Animated figures for every exercise and warm-up**
  Becomes usable: Every plan card's sheet shows its exercise moving, with simple equipment (benches, bars, cables, machines).
  Build: extend `lib/figure.ts` (separate near/far limbs, torso-relative arms, foreshortened reach, foot angle, linear keyframes) and the figure props; poses for all exercises and warm-ups in `data/figures.ts`.
  Verify (mechanical): test that every exercise and warm-up has a figure that stays in frame with planted hands/feet in place; contact-sheet render checked by eye; `npm test` and `npm run build` pass.
  Learner check: browse them in the library (slice 10) and flag any that look wrong.
  Commit: `Animate every exercise and warm-up`

- [x] **10. Exercise library from the Start menu**
  Becomes usable: The corner menu on Start has Exercise library: every exercise and warm-up by group, each opening its how-to sheet. Easy to remove later (learner may drop or keep it).
  Build: `LibraryScreen`, menu item on Start, sheet reused with a sets/reps range instead of a drawn volume.
  Commit: `Add exercise library to the Start menu`

- [x] **11. A reload doesn't lose the draw**
  Becomes usable: Refreshing the page comes back to the same screen. Setup, the plan, and a workout in progress are kept; a roll that was mid-animation starts over (its results are re-drawn).
  Build: `lib/storage.ts` — one `store` object (session + history) on localStorage, the single place to swap for Supabase later; `resumeState` in `drawState.ts`; App loads and saves the session.
  Verify (mechanical): tests for `resumeState` (roll steps rewind, plan kept, unknown exercise ids drop the session); `npm test` and `npm run build` pass.
  Commit: `Keep the draw across reloads`

- [x] **12. Workout mode: tick off every set, then save the workout**
  Becomes usable: Start workout on the plan walks through each exercise (warm-up first) with its figure; tap each set to tick it, Next unlocks when all sets are done; a timer runs. Finish saves the workout (date, time taken, sets per exercise) to this device's history and shows a done screen.
  Build: `lib/workout.ts` (run, record, duration format), `workout`/`done` steps in the reducer, `WorkoutScreen`, `DoneScreen`, Start workout on `PlanScreen`.
  Verify (mechanical): reducer tests (Next blocked until sets done, finish produces a record with the right sets per muscle); `npm test` and `npm run build` pass.
  Learner check: do a short workout end to end, reload in the middle, and finish it.
  Commit: `Add workout mode that saves finished workouts`

- [x] **13. Stats on Start: a growing stickman and a 7-sided chart**
  Becomes usable: Start shows a stickman whose muscle groups grow with finished sets; swipe to a 7-sided chart of training balance per group, plus totals (workouts, time, sets).
  Commit: `Show training stats on the Start screen`

- [x] **14. Polish pass on the new screens**
  Commit: `Polish workout and stats animations`

## Hands-on Checkpoints

- [x] Early usable behavior explored — after slice 1: you try the case-opening roll so its feel can shape the warm-up and every later roll. Tried on desktop and phone (LAN); feedback applied: always spin despite OS reduced motion, tick + land sounds, steadier slowdown, winner pop-and-shake, glowing cases with a chest-style lid that opens before the roll and shows the muscle color after landing. Learner confirmed "looks good".
- [x] Final kick-the-tires exploration and feedback completed

## Final Review

- [x] Warm-up respects gym/home: machine, rope and band warm-ups only at the gym (learner found Rowing machine etc. at home)
- [x] Gym drops home workarounds (Towel door curl, Loaded backpack curl, Inverted table row) but keeps good bodyweight moves; Concentration curl added so gym biceps still has 8
- [x] Final review complete — feedback resolved and learner confirms ready to ship

## Code Tour and App Map

- [x] Learning activity complete — guided route, focused alternative, prior practice connected, or brief recap
- [x] Optional edit and transfer reflection addressed — offered/declined/already covered/not applicable as appropriate
- [x] `devpost/app-map.html` generated from finished code, checked, and shown, including a project-grounded practice to reuse

Activity and evidence: Focused alternative tied to the stated goal (choosing and creating good skills). Took the real stickman failure (stills looked right; the loop had stopped after ~5 frames, fixed in `src/lib/useFrameLoop.ts`) and wrote the procedure that caught it as a project skill, `.claude/skills/animation-check/` (`SKILL.md` + `scripts/probe.mjs`). The learner decided the trigger (only when the user reports an animation isn't working, trading a round trip for fewer checks), the "verified" bar (positions sampled over real time, real taps, screenshots as support only), and the name. Tested once on the stickman: arm x2 moved 114.1 → 116.5 → 114.7 → 112.0 while idle, a real tap at 3.2 s set off a move (x2 137.1 at 3.8 s). The test exposed a gap (probing before the dev server answered); a wait-for-200 step was added.
Route and stops: Reference route only (not toured interactively), in the app map: `src/screens/MuscleMan.tsx` `tap()` → `src/lib/muscleMan.ts` `TAP_MOVES` / `pickTapMove` / `playBeats` → `src/lib/useFrameLoop.ts` `useFrameLoop`.
Edit outcome: Kept: the new `animation-check` skill (no app code changed), committed f664240.
Reflection: Offered and answered; the answer is kept in the ignored learner profile.
Activity mode: Focused alternative, with the skill tested against the live dev server over CDP.

## Revisions

- Motion skill source changed from jezweb to secondsky/claude-skills — the jezweb `motion` skill no longer exists in that repo. Installed `frontend-design` + `motion`; skipped `animate` (overlap, outdated imports, no license). `spec.md > External Services and Dependencies` updated.
- Reducer moved to `src/lib/drawState.ts` (still one `useReducer` in `App`) — keeps `App` small and lets slice 5 test `reset` directly. `spec.md > File Structure` updated.
- Pull-up, chin-up, dips, and hanging leg raise marked gym-only; added loaded backpack curl — they use bodyweight but need a bar, which would break "Home = no equipment".
- Cases screen puts the strip near the top and the case row at the bottom — the fixed middle-right Continue arrow overlapped both when they were centered.
- Rolls always spin (`MotionConfig reducedMotion="never"`) — the learner's PC has Windows animation effects off, so the skill's `reducedMotion="user"` made rolls jump straight to the result; learner chose always-spin, with a manual toggle possible in a later settings menu. `spec.md > Components > CaseRoll` updated.
- `lib/sound.ts` moved from slice 4 into slice 1 with a roll tick and land chime, plus a pop-and-shake on the winner — learner feedback at the early checkpoint. Slice 4 adds only the switch click.
- Roll curve changed to a steady ease-out quad over 5.2 s with a longer strip — the steep curve crawled inside the last card for ~1.5 s, so ticks went silent while it was visibly slowing (learner feedback).
- Cases became `CaseTile` with a lid seam, ready glow, and a lid that opens before the roll; the inside shows the muscle color only after landing so it doesn't spoil the result (learner feedback). `spec.md > Components > CasesScreen` updated.
- Time wheel plays a ratchet click (`playDial`) per minute, pitch rising with the time — added during slice 2 and approved by the learner over reusing the roll tick. Until slices 3–4 exist, Time's Continue locks a fully random gym draw directly.
- Body map fills selected groups with their plate color instead of the single accent, with name chips under the map — keeps one color language across map, reels, cases, and plan, and makes the abstract shapes unambiguous. `spec.md > Look and Feel` updated. Until slice 4, the Muscles screen's Continue locks the draw (gym).
- `planCounts` already caps each group at its pool size (needed for Home in slice 4); slot reels play a low clunk (`playReelStop`) as each reel locks.
- Slice 3 learner feedback: Go arrow moved to the bottom right on every screen except the cases (top right there); bigger body map; slot reels size to fit the screen and wait for a `Lever` pull (curved arrow from the title, `playLever` sound); cases can be opened while others roll, each with its own row that shrinks as more roll at once — "should feel more fun and entertaining." `spec.md > Look and Feel`, `Components` (SlotReels / CountScreen, CasesScreen), and the core journey updated. Follow-up: the time wheel is bigger and centered in the free space, and the lever can be dragged down (ratchet click per notch; letting go past 60% still counts) as well as tapped.
- Neon toggle can also be dragged and either sign tapped (matching the draggable lever the learner asked for in slice 3); a drag uses a plain click guarded by pointer movement, because motion's `onTap` still fired after a short drag.
- The warm-up roll uses one case on the same layout as the exercise cases (tap, lid opens, roll), so every roll in the app works the same way; it fills with the accent yellow since a warm-up has no muscle group. A "No warm-up" result adds no card to the plan. The corner menu sits top left, where Back is on setup screens, since Go is top right on roll screens.
- "No warm-up" is a gold card in the warm-up roll (and the case fills gold when it lands there), same odds as each warm-up — learner request.
- Added the "Reduce animations" toggle to the corner menu, moved in from the deferred list at the learner's request (`prd.md > Deferred From the POC` named a skip/fast-animations setting). When on, rolls slide onto the result in 0.6 s, reels stop in under 1 s, and flicker/pulse/slide effects stop; sounds stay. Saved in this browser only. The menu now also shows on Start and Plan (setting only; Start over stays on the roll screens).
- Layout made consistent (learner request): the menu sits top right on every screen and Go is always bottom right, including the warm-up and cases screens, which now leave bottom room for it under the cases.
- Final review: the bodyweight yes/no flag became a `where` tag (gym / home / any) on exercises and warm-ups, so Home and Gym each filter the right way, and the warm-up now follows the place too.
- Added slices 6–8 before shipping (learner wants "more content" rather than shipping as is): share as text/photo, an exercise detail sheet with a YouTube search link, and an animated how-to figure experiment with YouTube as the fallback. Pulls "How-to per exercise" in from `prd.md > Deferred From the POC`.
- Learner review of the figures: added a front/back view (shoulder and hip width, mirrored left side) for jumping jacks, cable crossover, seated dumbbell press, Arnold press, lateral and cable lateral raises; pull-up and lat pulldown are seen from behind; the hammer curl's dumbbell is drawn across the hand. The exercise library stays on the Start menu (learner decision). Head-on push-ups (wide, diamond, shoulder taps) were tried and reverted to the side view: without depth they read as handstands.
- Slices 11 and 12 landed in one commit (they share the reducer). The PRD's "nothing persists" non-goal is lifted: the session and finished workouts are kept on this device; an online database (Supabase) stays possible later behind `lib/storage.ts`.
- Slice 13 learner feedback: the Balance chart uses the same absolute growth curve as the stickman (one workout is a small shape, not the tip); the stickman is smaller, has its own posable skeleton, idles, dances when tapped, and after a new workout hits one pose per trained group while that group glows and grows; the chart grows from before to after with +sets badges. Celebrated once per workout (`loadCelebrated`/`saveCelebrated` in the store).
- Fix: Motion's `useAnimationFrame` re-subscribes on every render, so the stickman (which re-renders each frame) stopped after a few frames: no idle, no celebration. Both figures now use `lib/useFrameLoop.ts` (one rAF loop, latest callback). Verified in real time over the Chrome DevTools Protocol, since headless virtual time only renders a few frames. Also: the Muscles/Balance pills became carousel dots, and the stickman box has a fixed height so it is smaller and centered.
- Learner feedback round 2: the celebration now plays on the Workout done screen (Start no longer replays it); the idle is clearly visible (bob, weight shift, arm swing); the stickman and chart always animate (the menu's Reduce animations is for rolls and transitions, like the exercise figures); the Start stickman box is 360px. Checked in real time on the dev server over CDP: done screen poses chest then biceps, Start idles and dances on a real tap.
- Learner feedback round 3: Balance always shows the last workout's +sets (the one-time part is only the stickman's celebration); Start uses a grid (title / flexible middle / Start) and the stickman draws absolutely inside its box, so he centres between title and dots and shrinks on short screens (checked at 420x860 and 420x640); tapping him plays a random one of 3 dances (groove, disco, YMCA) or 5 poses (front double biceps, front lat spread, most muscular, abs and thigh, victory), never the same twice in a row.
- Tap dances changed (learner): YMCA and the groove replaced by a sideways griddy (body can now move sideways, `x` on the pose) and a stanky leg; disco stays.
- Workout history (learner request): the Start menu has Workout history, newest first: date, time taken, gym/home, groups as colored chips with sets; tap to expand each exercise's sets × reps.
