---
doc: prd
status: approved
---

# Workout Draw — Product Requirements

**Workout Draw: Randomize your routine** (slogan still open). A fun pre-workout app for someone at the gym or at home who doesn't know what to train: set up a few choices, then every part of the workout is revealed through slot-machine and case-opening rolls, ending in a clean workout plan.
Source: `scope.md > The Unique Kernel`, `scope.md > The Core Loop`.

## The Core Journey
1. **Start:** the app opens on a simple start screen with a big Start button.
2. **Setup: Time.** Rotate the time wheel to pick how long you have. Continue.
3. **Setup: Muscle groups.** Tap muscle groups on the body map, or choose fully random. Continue.
4. **Setup: Gym or Home.** Flip the neon switch. Continue.
   (You can go back to earlier setup screens. Once rolling starts, the draw is locked in.)
5. **Warm-up roll:** a roll reveals a warm-up, which can land on "No warm-up."
6. **Count roll:** a slot machine with one reel per chosen muscle group spins and lands on how many exercises each group gets (e.g. Chest 2 · Triceps 1 · Legs 2). *Skipped in fully random mode.*
7. **Exercise case openings:** group by group, one case per exercise. Tap a case to start its roll; it lands on an exercise. Continue until every slot is revealed.
8. **Workout plan:** all results shown as a clean plan: warm-up plus each exercise with sets and reps.
9. **New draw:** a button starts over from the beginning.

Success = someone goes from Start to a complete, followable workout plan, with every exercise revealed by a roll.

## Screens and Layout
Each step is its own full-screen view, one decision or one roll at a time (`scope.md > The Core Loop`).

- **Start:** app name, big Start button.
- **Time:** the time wheel fills the screen; arrow-shaped Continue button on the middle right.
- **Muscle groups:** front/back body map; "fully random" option; Continue on the middle right.
- **Gym / Home:** two neon signs (GYM on top, HOME on bottom) with a switch between them; Continue on the middle right.
- **Warm-up roll:** a single roll.
- **Count roll:** a slot machine with one reel per chosen muscle group.
- **Exercise rolls:** case openings for the current muscle group, revealed by tapping each.
- **Workout plan:** a list of the full workout plus a New Draw button.
- **Menu (available during the rolls):** option to start over or go back to the start.

The setup screens have Back. The roll screens don't (locked in), except for the start-over menu option.

## Look and Feel
- **Overall:** simple, clean, smooth. Not busy: no screen with lots happening at once.
- **Per-screen variety is intentional:** each screen can have its own UI style and effects. The project is a playground for trying different UIs, effects, and animations, so the styles don't need to match. The neon look is only for the gym/home screen, not the whole app.
- **Signature interactions:**
  - Time wheel: physical-feeling rotation with quick-ticking minute values.
  - Body map: muscle groups animate when touched/selected.
  - Neon switch: signs flicker/blink on and off like old neon signs, with a click sound on switching.
  - Rolls: case-opening strip (slows down and stops on one), slot-machine reels for the counts.
- **Dark baseline** (decided in `4-spec`): the app is dark mode overall, like most workout apps, so the neon screen fits in. Dark, not pitch-black everywhere.
- **Avoid:** neon glow across the whole app (neon is only for the gym/home screen); cluttered, overly detailed screens.

## Features and Behavior

### Time Wheel
A circular dial with an arrow starting at the top. Dragging clockwise increases the time, mapped non-linearly: **¼ turn = 15 min, ½ turn = 45 min, ¾ turn = 1 h, full turn = 2 h**, with every minute in between selectable (e.g. 1 h 03). The value ticks quickly as you rotate.
Internally, the time falls into a **range** that sets the total number of exercises; small differences (1 h vs 1 h 03) give the same result.
- [ ] Rotating the wheel updates the displayed time continuously, hitting 15 / 45 / 60 / 120 min at the quarter points.
- [ ] Continue is disabled until a time above zero is selected.

### Muscle Group Body Map
Front/back body silhouette with tappable groups: **chest, back, shoulders, biceps, triceps, abs, legs**. Selected groups animate and stay highlighted; tapping again deselects. A fully random option chooses no specific groups.
- [ ] Tapping a group animates it and marks it selected; tapping again deselects it.
- [ ] Continue requires at least one group selected or fully random chosen.

### Gym / Home Switch
Two neon signs (GYM top, HOME bottom) and a switch. The active one is lit; the other is off. Flipping plays a click sound and a flicker animation.
- **Gym:** equipment exercises plus good bodyweight moves, but not home workarounds (like a towel door curl). **Home:** bodyweight only. The warm-up follows the same rule.
- [ ] Flipping the switch lights one sign, turns the other off, and plays a click.
- [ ] Choosing Home means only bodyweight exercises can appear in any roll.

### Warm-up Roll
A single roll over a list of warm-ups plus a "No warm-up" outcome.
- [ ] The roll animates and lands on a warm-up or "No warm-up," and the result appears on the plan.

### Count Slot Machine
One reel per chosen muscle group, each landing on a number of exercises. The total always equals the exercise count for the selected time range. Skipped in fully random mode.
If more groups are chosen than the time allows exercises (e.g. 7 groups, 15 min = 2 exercises), groups are **dropped at random**: those reels land on 0 and only the kept groups get exercises.
- [ ] Reels spin and stop on numbers whose total equals the time range's exercise count.
- [ ] With more groups than exercises, some reels land on 0, chosen at random, and those groups get no case openings.

### Exercise Case Openings
For each muscle group in turn, one case per exercise. Tapping a case starts a case-opening roll (strip slows and stops) that lands on an exercise for that group, matching gym/home. In fully random mode, there are N cases (N from time), each drawing from any group.
- [ ] Tapping a case starts its roll; it lands on a valid exercise for that group and environment.
- [ ] The flow moves through every group until all cases are revealed.
- [ ] No exercise repeats within one workout: an exercise already drawn can't appear again in any later case opening.

### Workout Plan
A list: warm-up (if any), then each exercise with **sets and reps**. No rest times: people rest as they like. Each exercise has its own sets/reps ranges (e.g. chest press: 3–4 sets × 8–12 reps); the exact numbers are picked randomly within the range and simply appear (no roll). New Draw returns to Start.
- [ ] Every rolled exercise appears with sets and reps within its defined ranges.
- [ ] New Draw resets everything and returns to the Start screen.

### Start Over (during rolls)
A small menu/settings option during the roll screens to abandon the draw and return to the start.
- [ ] Choosing start over during any roll returns to the Start screen with nothing carried over.

## States and Boundaries
- **First use / every use:** no accounts, no onboarding. Start → setup.
- **Nothing selected:** Continue is disabled on time (zero) and muscle groups (none selected and not random).
- **Locked flow:** after setup, there's no back navigation, only forward or start over.
- **Persistence:** none. Closing the app or New Draw discards the workout.

## Product Decisions
- **Name: Workout Draw: Randomize your routine.** Slogan to refine later.
- **Fun over optimization:** results are final. "They just have to deal with it." It's not meant to be taken seriously.
- **Two-layer reveal (count, then exercises):** makes the roll the heart of every step.
- **Fully random skips muscle selection and the count roll:** N exercises from any group.
- **Home = bodyweight only:** keeps the exercise data small. Equipment choices come later.
- **Sets/reps aren't rolled:** they appear from per-exercise ranges.
- **Setup can go back; rolls are locked in**, with a start-over escape.
- **Mixed visual styles per screen:** the app is a practice ground for UIs and animations, held together by being simple, clean, and smooth.
- **Seven muscle groups, legs not split:** good enough for an MVP.
- **Too many groups for the time → drop groups at random** rather than adding exercises. The time limit wins.
- **No repeated exercises** in one workout.
- **No rest times on the plan:** people decide their own rest.

## What We're Building
Start screen, three setup screens (time wheel, body map, gym/home neon switch) with back navigation, warm-up roll, count slot machine, exercise case openings, workout plan with sets/reps, New Draw, and start over during rolls. Plus the exercise list behind it: exercises per muscle group, marked bodyweight or gym, each with sets/reps ranges.

## Deferred From the POC
- **Equipment at home (dumbbells, bench, weights):** needs another choice and more exercise data.
- **Skip / fast animations setting:** brought into the POC during the build as a "Reduce animations" switch in the corner menu (learner request).
- **Checking off exercises during the workout:** from scope Later.
- **How-to per exercise (video link, then custom animations):** brought into the POC after the build (learner request): tap a plan card for form cues, an animated figure, and a YouTube search; also browsable from an Exercise library in the Start menu. Sharing the plan as text or a photo was added at the same time.

## Possible Later Enhancements
- **Gamble upgrade:** risk a result for a chance at a better or different exercise (e.g. 50% upgrade).
- **Slogan and branding polish.**
- **Finer muscle groups** (e.g. split legs into quads, hamstrings, glutes).

## Non-Goals
- **Workout optimization or progression tracking:** it's meant to be fun, not a training program.
- **Accounts or sync:** no sign-in; history is kept on this device only (moved in after the build at the learner's request). An online store such as Supabase may come later.
- **Energy level input:** cut in scope; you go at your own pace.
- **Re-rolls:** results are final for now (see gamble upgrade later).
- **Rest timing:** people rest as they like; the plan doesn't prescribe it.

## Open Questions
- **Time → exercise count ranges** (e.g. ≤20 min → 2–3, ~45 min → 5, ~1 h → 6, 1.5 h+ → 8): rough on purpose; tune during spec/build. Not blocking.
- **Exercise list content:** delegated to the agent. Compile exercises per muscle group (bodyweight/gym flag, sets/reps ranges) during spec/build; the learner can review. Not blocking.
