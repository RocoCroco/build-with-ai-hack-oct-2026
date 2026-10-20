---
doc: spec
status: approved
---

# Workout Draw — Technical Spec

## How This Works, In Plain Language
Workout Draw is a **website that runs entirely in the phone's browser**. There's no server and no database. When you open it, the browser downloads the app once, and everything after that (the rolls, the plan) happens on the phone.

It has three kinds of pieces:
1. **Screens.** Each step of the journey (Start, Time, Muscles, Gym/Home, Warm-up, Count, Cases, Plan) is its own React component. One screen shows at a time, with an animated transition between them.
2. **The exercise list.** A plain data file inside the code, listing every exercise with its muscle group, whether it's bodyweight, and its sets/reps ranges. Think of it as a spreadsheet baked into the app.
3. **The draw logic.** A few small functions that decide the random results: how many exercises your time gives you, how many each group gets, which exercise each case lands on (never repeating), and the sets/reps for each.

The key trick: **the result is decided *before* each animation plays.** When you tap a case, the draw logic picks the exercise first. Then the animation builds a strip of random exercises with the real result placed at the spot where the strip will stop. The animation is pure show; the logic is simple and testable. The same goes for the slot reels and the warm-up roll.

The current draw (your setup choices plus the results so far) lives in the app's memory while you use it. Closing the page or pressing New Draw wipes it, which matches `prd.md > States and Boundaries` (nothing persists).

Why this shape: the whole product is the UI and the reveals. A backend would add accounts, hosting, and failure points without making a single roll more fun. If accounts or saved history come later, the draw logic and exercise list can move behind an API without changing the screens.

## The Core Journey Through the System
PRD ref: `prd.md > The Core Journey`.

1. **Start:** `App` shows `StartScreen`. Tapping Start moves to `TimeScreen`.
2. **Time:** you drag the `TimeWheel`; it turns the angle into minutes and saves `minutes` in the draw state. Continue is enabled when minutes > 0.
3. **Muscles:** `MuscleScreen` / `BodyMap`: taps toggle groups in `muscles` (or set `fullyRandom`). Continue is enabled when at least one group is selected or random is on. Back returns to Time with choices kept.
4. **Gym/Home:** `EquipmentScreen` / `NeonSwitch` sets `place: 'gym' | 'home'` and plays a click. Continue **locks the draw**: `planDraw()` runs once and computes the exercise total and the per-group counts. Back still works here; after Continue it doesn't.
5. **Warm-up:** `WarmupScreen` asks `drawWarmup()` for a result (a warm-up or "No warm-up"), then `CaseRoll` animates to it.
6. **Count:** `CountScreen` shows `SlotReels` animating each group's reel to its precomputed count (0 for dropped groups). Skipped when `fullyRandom`.
7. **Cases:** `CasesScreen` goes group by group. Tapping a case calls `drawExercise(group, place, alreadyDrawn)`, then `CaseRoll` animates to the result. When all cases are revealed, Continue moves to the plan.
8. **Plan:** `PlanScreen` lists the warm-up plus each exercise with its sets × reps (picked within its ranges when drawn). **New Draw** resets the draw state and goes to Start.
9. **Start over:** during steps 5–7, a small `MenuButton` resets the state and returns to Start.

```
Start → Time → Muscles → Gym/Home ──(lock: planDraw)──→ Warm-up → Count* → Cases → Plan → (New Draw → Start)
          ↑______Back______↑______Back____↑                      *skipped if fully random
                                         Menu "Start over" available from Warm-up / Count / Cases
```

## Stack
Learner choices: React, phone-sized web app, nothing stored, deploy optionally later. Agent recommendations accepted by the learner: Vite, TypeScript, Motion. Styling was left to the agent, with a lean toward plain CSS.

- **Vite** (current major) — dev server and build tool for a client-only React app. https://vite.dev/guide/
- **React 19** + **TypeScript** — screens as components; TypeScript keeps the exercise data shape consistent. https://react.dev/
- **Motion for React** (`motion` package, import from `motion/react`) — drag (time wheel), springs, screen transitions (`AnimatePresence`), and the roll/reel animations. https://motion.dev/docs/react
- **CSS Modules** (plain CSS, built into Vite) — each screen can have its own look; plain CSS is the easier carry-over if the project later moves to another platform. https://vite.dev/guide/features#css-modules
- **Vitest** — a few unit tests for the draw logic (the part with real rules). https://vitest.dev/
- **Sound:** a short click generated with the browser's Web Audio API, so there's no audio file to source. https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API

To verify at the start of the build: install the current versions with `npm create vite@latest`, and check that `motion` is installed as `motion` (not the older `framer-motion` name).

## Where It Runs and How Someone Tries It
- **Runtime:** any modern browser. Designed for phone width (~390px) and centered on desktop. Needs Node.js (v24 is installed). No API keys.
- **Run locally:** `npm install`, then `npm run dev`, and open the printed `http://localhost:5173`.
  - Desktop browser: use DevTools device mode (e.g. iPhone size) for recording.
  - Real phone: `npm run dev -- --host` and open the shown network URL on a phone on the same Wi-Fi.
- **Tests:** `npm test`.
- **Demo recording:** record the phone-sized view going Start → Time → Muscles → Gym/Home → Warm-up → Count → Cases → Plan in about a minute.
- **Submission:** demo video + public GitHub repo (required).
- **Deployment (optional, later):** Vercel or Netlify, import the GitHub repo, framework preset "Vite", build `npm run build`, output `dist`. Free tier. https://vercel.com/docs/frameworks/vite · https://docs.netlify.com/frameworks/vite/

## Look and Feel
From `prd.md > Look and Feel`. The build should follow it without asking again.

- **Overall:** simple, clean, smooth. Lots of space, one focal element per screen, minimal copy. Every interaction should feel physical (springs, not linear tweens).
- **Shared baseline: dark.** A dark base (near-black / deep charcoal background, off-white text, one bright accent color for primary actions and selections). Workout apps read as dark, and the neon screen fits naturally. Dark is the baseline, not "everything black": cards and surfaces can use lighter charcoal layers. A clean sans-serif (e.g. Inter / system UI) and the same arrow-shaped Continue button on the middle right. This keeps the app coherent while each screen gets its own treatment.
- **Per-screen treatments (intentionally different):**
  - **Time wheel:** big circular dial, arrow at the top, a large tabular-number readout that ticks as you rotate.
  - **Body map:** front/back silhouette; selected groups fill with the accent color with a small spring "pop."
  - **Neon switch:** the one screen that goes full neon on the dark base. GYM and HOME neon tubes (glow with `text-shadow`), the inactive one off, and the active one flickering on like an old sign. A chunky toggle with a click sound.
  - **Rolls:** a horizontal case-opening strip with a center marker, fast at first and easing to a stop with a slight overshoot. Vertical slot reels for the counts.
  - **Plan:** a clean card list, with the results animating in one after another.
- **Avoid:** neon glow everywhere (neon stays on the gym/home screen), busy screens, generic "AI app" gradients.
- **Skills drive this layer:** UI/animation skills selected at the start of the build (see `Decisions and Open Issues > Learning: finding and using UI/animation skills`) guide how these screens are built and polished.

## Components

### App Shell and Flow
`App.tsx` holds the draw state and the current step, renders one screen at a time inside Motion's `AnimatePresence` for screen transitions, and caps width to phone size.
PRD ref: `prd.md > Screens and Layout`, `prd.md > The Core Journey`.

### Draw State
A single `useReducer` in `App`: setup choices, the locked plan, and the results so far. Actions include `setMinutes`, `toggleMuscle`, `setRandom`, `setPlace`, `lockDraw`, `revealWarmup`, `revealExercise`, `next`, `back`, and `reset`. `back` is only allowed on setup steps.
PRD ref: `prd.md > States and Boundaries`, `prd.md > Start Over (during rolls)`.

### Draw Logic (`lib/draw.ts`)
Pure functions with no UI:
- `exerciseCountFor(minutes)` → total exercises. Rough ranges: ≤20 min → 3, ≤35 → 4, ≤50 → 5, ≤75 → 6, ≤100 → 7, otherwise 8. Easy to tune. (15 min → 3; the PRD's "2–3" is satisfied.)
- `planCounts(groups, total, place)` → per-group counts summing to `total`. If there are more groups than `total`, it picks `total` groups at random (1 each) and the rest get 0. Otherwise each group gets 1 and the remainder is spread randomly. No group gets more than its available exercise pool (see failure modes).
- `drawWarmup()` → a random warm-up or "No warm-up."
- `drawExercise(group | 'any', place, alreadyDrawn)` → a random exercise from the filtered pool, excluding already drawn ones, with sets/reps picked within its ranges.
PRD ref: `prd.md > Count Slot Machine`, `prd.md > Exercise Case Openings`, `prd.md > Warm-up Roll`, `prd.md > Workout Plan`, `prd.md > Gym / Home Switch`.

### Exercise Data (`data/exercises.ts`)
A curated list compiled by the agent (delegated by the learner). Each of the 7 groups gets plenty of gym exercises and as many bodyweight ones as make sense, plus a warm-up list. The learner can review it.
PRD ref: `prd.md > Open Questions` (exercise list content).

### StartScreen
App name "Workout Draw" with the tagline "Randomize your routine" and a big Start button.
PRD ref: `prd.md > Screens and Layout`.

### TimeWheel / TimeScreen
A dial using pointer drag. The pointer's angle around the center maps to minutes piecewise: 0–90° → 0–15, 90–180° → 15–45, 180–270° → 45–60, 270–360° → 60–120, rounded to whole minutes. The display shows the value (e.g. "1 h 03"). It's clamped at 0 and 120 (no wrapping past a full turn).
PRD ref: `prd.md > Time Wheel`.

### BodyMap / MuscleScreen
An inline SVG front/back silhouette with 7 tappable regions (chest, back, shoulders, biceps, triceps, abs, legs; back on the rear view) and a "Fully random" dice toggle that clears group selection.
PRD ref: `prd.md > Muscle Group Body Map`.

### NeonSwitch / EquipmentScreen
Two neon signs and a toggle with a CSS flicker keyframe on activation and a Web Audio click. Default: Gym.
PRD ref: `prd.md > Gym / Home Switch`.

### CaseRoll
A reusable horizontal strip. Given the `result` and a pool, it builds ~40 random items with `result` at a fixed winning index, then animates the strip's x position so the winner stops under the center marker (~5 s with a steady ease-out-quad deceleration, so cards keep crossing the marker almost to the stop). A tick sounds as each item crosses the marker, a chime plays on landing, and the winner pops and shakes. It always spins, even with the OS "reduce motion" setting on (learner decision; a manual toggle can come with a later settings menu). Used for both the warm-up and the exercises.
PRD ref: `prd.md > Warm-up Roll`, `prd.md > Exercise Case Openings`.

### SlotReels / CountScreen
One vertical reel per chosen group, labeled with the group name. Each spins and stops on its precomputed count (0–N), staggered left to right.
PRD ref: `prd.md > Count Slot Machine`.

### CasesScreen
Shows the current group's closed cases (`CaseTile`: lid seam with latch; ready cases pulse with a soft glow). Tapping one draws the result and opens the lid like a chest hinged at the back (front face tips away, lid rises upright behind the case, ~0.45 s), then starts `CaseRoll`; on landing the lid fades away and the open case's inside fills with the muscle group's plate color. It then advances to the next group, or to the Plan once all are revealed. In fully random mode it shows N cases drawing from `'any'`.
PRD ref: `prd.md > Exercise Case Openings`.

### PlanScreen
Cards for the warm-up (if any) and each exercise (name, muscle group, sets × reps), revealed one after another. New Draw dispatches `reset`.
PRD ref: `prd.md > Workout Plan`.

### MenuButton
A small corner button on the roll screens with a "Start over" option that dispatches `reset`.
PRD ref: `prd.md > Start Over (during rolls)`.

## Data Model
```ts
type Muscle = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'abs' | 'legs';
type Place = 'gym' | 'home';

interface Exercise {
  id: string; name: string; muscle: Muscle;
  bodyweight: boolean;            // true → allowed at home
  sets: [min: number, max: number];
  reps: [min: number, max: number];
}
interface Warmup { id: string; name: string; }   // plus a special "No warm-up"

interface DrawnExercise { exercise: Exercise; sets: number; reps: number; }

interface DrawState {
  step: 'start' | 'time' | 'muscles' | 'place' | 'warmup' | 'count' | 'cases' | 'plan';
  minutes: number;                // 0–120
  muscles: Muscle[];              // empty when fullyRandom
  fullyRandom: boolean;
  place: Place;                   // default 'gym'
  // set at lock:
  total: number;
  counts: Partial<Record<Muscle, number>>;  // includes 0s for dropped groups
  // revealed as you go:
  warmup: Warmup | 'none' | null;
  drawn: DrawnExercise[];
}
```
- **Where it lives:** in memory (React state in `App`). The exercise list is a static file.
- **How it updates:** reducer actions from the screens. Results are decided in `lib/draw.ts` and then animated.
- **Leaving and coming back:** everything is gone. A refresh lands on Start. This is intentional (`prd.md > States and Boundaries`).

## File Structure
```
build-with-ai-hack-oct-2026/
├── index.html
├── package.json
├── vite.config.ts            # Vite + Vitest config
├── src/
│   ├── main.tsx              # mounts <App/>
│   ├── App.tsx               # draw state (useReducer), step router, screen transitions
│   ├── App.module.css        # phone-width shell, shared baseline
│   ├── styles/
│   │   └── base.css          # tokens: colors, font, spacing; Continue arrow button
│   ├── data/
│   │   └── exercises.ts      # exercise list + warm-ups (curated)
│   ├── lib/
│   │   ├── draw.ts           # exerciseCountFor, planCounts, drawWarmup, drawExercise
│   │   ├── draw.test.ts      # Vitest: totals, dropping, no repeats, home=bodyweight
│   │   ├── drawState.ts      # DrawState type, actions, and the reducer App uses
│   │   ├── timeWheel.ts      # angle ↔ minutes mapping
│   │   └── sound.ts          # Web Audio: roll tick, land chime, switch click
│   └── screens/
│       ├── StartScreen.tsx (+ .module.css)
│       ├── TimeScreen.tsx  + TimeWheel.tsx
│       ├── MuscleScreen.tsx + BodyMap.tsx
│       ├── EquipmentScreen.tsx + NeonSwitch.tsx
│       ├── WarmupScreen.tsx
│       ├── CountScreen.tsx + SlotReels.tsx
│       ├── CasesScreen.tsx
│       ├── PlanScreen.tsx
│       ├── CaseRoll.tsx       # shared case-opening strip
│       └── MenuButton.tsx
├── .claude/skills/            # course skills + UI/animation skills installed during build
├── devpost/                   # Devpost learning workspace
└── README.md
```

## External Services and Dependencies
None at runtime: no APIs, keys, or database. npm packages only (react, react-dom, motion, vite, typescript, vitest). Optional later: Vercel/Netlify free hosting (see Where It Runs).

UI/animation **skills** are development-time dependencies for Claude, not app code. Chosen by the learner in slice 1 after vetting each `SKILL.md` and its scripts, installed with `npx skills add <repo> --skill <name> -a claude-code --copy` into `.claude/skills/`, and recorded in `skills-lock.json`:
- `frontend-design` (Anthropic, Apache-2.0): design plan, review against generic defaults, self-critique. https://github.com/anthropics/skills
- `motion` (secondsky/claude-skills, MIT): Motion API patterns for `useAnimate`, springs, drag, `AnimatePresence`, reduced motion. https://github.com/secondsky/claude-skills
- Not installed: `animate` (delphi-ai). Its timing rules overlap `motion`, its examples use the old `framer-motion` import, and it has no license (the repo is public).

## Important Failure Modes
- **Home + a group with few bodyweight exercises (e.g. biceps):** the pool may be smaller than the count. `planCounts` caps each group at its pool size and shifts the extra to other groups. If the total pool is still too small, the total shrinks. The user never sees a case with nothing to draw.
- **Fully random with a pool smaller than N:** the same cap applies.
- **Roll animation and result out of sync:** avoided by design. The result is chosen first, and the strip is built around it.
- **Audio blocked by the browser:** the click only plays after a user tap (allowed). If it fails, it fails silently, and the switch still works.

## What Was Simplified and Why
- **Exercise data in a code file** instead of a database/API, because nothing is stored and the list rarely changes. The fuller version would move it behind a backend when accounts arrive.
- **Web app on phone** instead of native, as the learner chose. The fuller version would mean React Native/Expo. Plain CSS Modules keep styling portable-ish.
- **Generated click sound** instead of sourced audio, so there's no asset to find or license.
- **Rough time → count ranges**, tunable in one function.

## Decisions and Open Issues
**Learner decisions**
- React, phone-sized web app, no stored data. Deployment optional later on Vercel/Netlify.
- Accepted the recommended Vite + TypeScript + Motion stack. Styling left to the agent with a lean toward plain CSS → CSS Modules.
- Agent compiles the exercise list (delegated in the PRD).

**Agent implementation details derived from those**
- Result-first rolls (decide, then animate). A single reducer for draw state. Piecewise wheel mapping. Count ranges. Default place = Gym. Vitest on the draw logic only.

**Learning: finding and using UI/animation skills** (the useful unknown)
The learner's question: *how do you find, choose, and install good UI/animation skills, and how do you get Claude to use them in a development plan?* What clarifies it, as a small investigation in the first build steps:
1. **Find:** search skills directories (skills.sh, the anthropics/skills repo, marketplaces) for frontend design and Motion/animation.
2. **Vet before installing:** read each candidate's `SKILL.md` (and any scripts). Skills are instructions Claude follows, so check that they're relevant and safe, and prefer reputable sources.
3. **Install** with `npx skills add <repo> --skill <name>` (the same tool that installed this course; it records entries in `skills-lock.json`) into the project's `.claude/skills/`.
4. **Use:** skills trigger automatically from their description, or can be invoked by name (`/frontend-design`) or named in a build step ("use the motion skill for this screen").
5. **Evidence:** at least one screen (e.g. CaseRoll or TimeWheel) is built or polished with a chosen skill, and the learner can say what the skill changed.

**Still open (not blocking)**
- Exact time → count ranges (tune while testing).
- Exercise list review by the learner during the build.
