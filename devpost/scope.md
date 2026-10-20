---
doc: scope
status: approved
---

# Workout Randomizer (working title)

A fun pre-workout tool: tell it how much time you have, and each exercise slot gets revealed with a case-opening / slot-machine roll, then turns into a clean workout plan.

## The Unique Kernel
Every exercise is a **reveal**. Instead of handing you a list, each slot spins through exercises like opening a case on a loot site or pulling a slot machine, then lands on one. It's openly built for fun over optimization: "maybe not that useful… it's just made to be fun."

## Who It's For
Someone walking into the gym (or training at home) who doesn't know what to train today, or who wants variety: new machines, new exercises they haven't tried or don't know. Today they'd pick exercises themselves, usually falling back on the same routine.

## The Core Loop
Open it before a workout → set the starting configuration (time available, optionally muscle group(s) or fully random, gym or home) → the app creates a set of exercise slots (e.g. ~6 based on time) → each slot rolls and lands on an exercise → the result becomes a workout plan with sets and reps suited to each exercise.
They come back for the variety and the fun of the roll.

## Inspiration & Identity
- Case-opening sites (rolling strip of options that slows down and stops on one), slot machines, pack draws.
- Fluid, satisfying animations; the final plan should look "all very pretty."
- Tone: playful, a little gamified, "be up for whatever we throw at you."

## Why This Matters to the Learner
They go to the gym and want variety in their training. It also gives them lots of UI and animation work to practice using skills, which is their learning goal for this hackathon.

## What "Working" Looks Like
Demo: someone walks into the gym unsure what to do today, opens the app, enters the starting configuration, and the rolls begin. Each slot (e.g. a warm-up first, then the exercises) spins and lands on an exercise, like jumping jacks for the warm-up. At the end, the results become a clean workout plan with sets and reps.
"Oh, that's cool" beat: the slot spinning and landing on an exercise.

## The POC Boundary
- Starting configuration: time available, muscle group(s) or fully random, gym vs. home.
- Number of slots derived from the time available.
- Animated case-opening / slot reveal per exercise.
- Final workout plan: exercise list with sets and reps chosen per exercise.

Open for PRD: whether reveals flow automatically or the user taps each slot (and can reveal one at a time while training); exact warm-up handling.

## Later
- Checking off exercises / sets during the workout.
- How-to for each exercise: a YouTube/video link per exercise first, custom exercise animations afterward.
- Growing it into a more complete product.

## Explicitly Cut
- **Energy level input:** not needed. You can't really judge your energy, and you go at your own pace anyway.
