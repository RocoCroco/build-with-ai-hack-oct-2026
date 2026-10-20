export type Muscle = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'abs' | 'legs';
export type Place = 'gym' | 'home';
/** Where something belongs: 'any' fits both, 'home' is a workaround you'd skip with real equipment. */
export type Where = Place | 'any';

export interface Exercise {
  id: string;
  name: string;
  muscle: Muscle;
  where: Where;
  sets: [min: number, max: number];
  reps: [min: number, max: number];
}

export interface Warmup {
  id: string;
  name: string;
  where: Where;
}

export const MUSCLES: Muscle[] = ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'abs', 'legs'];

export const MUSCLE_LABELS: Record<Muscle, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  biceps: 'Biceps',
  triceps: 'Triceps',
  abs: 'Abs',
  legs: 'Legs',
};

// Shorthand so the list below stays readable: [id, name, where, sets, reps]
type Row = [string, string, Where, [number, number], [number, number]];

const rows: Record<Muscle, Row[]> = {
  chest: [
    ['bench-press', 'Barbell bench press', 'gym', [3, 5], [5, 10]],
    ['incline-db-press', 'Incline dumbbell press', 'gym', [3, 4], [8, 12]],
    ['db-flye', 'Dumbbell flye', 'gym', [3, 4], [10, 15]],
    ['cable-crossover', 'Cable crossover', 'gym', [3, 4], [12, 15]],
    ['chest-press-machine', 'Machine chest press', 'gym', [3, 4], [8, 12]],
    ['pec-deck', 'Pec deck', 'gym', [3, 4], [12, 15]],
    ['decline-bench', 'Decline bench press', 'gym', [3, 4], [6, 10]],
    ['dips-chest', 'Chest dips', 'gym', [3, 4], [6, 12]],
    ['push-up', 'Push-up', 'any', [3, 4], [10, 20]],
    ['wide-push-up', 'Wide push-up', 'any', [3, 4], [10, 20]],
    ['decline-push-up', 'Decline push-up', 'any', [3, 4], [8, 15]],
  ],
  back: [
    ['deadlift', 'Deadlift', 'gym', [3, 5], [3, 8]],
    ['lat-pulldown', 'Lat pulldown', 'gym', [3, 4], [8, 12]],
    ['barbell-row', 'Barbell row', 'gym', [3, 4], [6, 10]],
    ['seated-cable-row', 'Seated cable row', 'gym', [3, 4], [10, 12]],
    ['one-arm-db-row', 'One-arm dumbbell row', 'gym', [3, 4], [8, 12]],
    ['t-bar-row', 'T-bar row', 'gym', [3, 4], [8, 12]],
    ['straight-arm-pulldown', 'Straight-arm pulldown', 'gym', [3, 4], [12, 15]],
    ['pull-up', 'Pull-up', 'gym', [3, 4], [5, 12]],
    ['superman', 'Superman hold', 'any', [3, 4], [10, 15]],
    ['table-row', 'Inverted table row', 'home', [3, 4], [8, 15]],
    ['reverse-snow-angel', 'Reverse snow angel', 'any', [3, 4], [10, 15]],
  ],
  shoulders: [
    ['ohp', 'Overhead press', 'gym', [3, 5], [5, 10]],
    ['db-shoulder-press', 'Seated dumbbell press', 'gym', [3, 4], [8, 12]],
    ['lateral-raise', 'Lateral raise', 'gym', [3, 4], [12, 15]],
    ['cable-lateral', 'Cable lateral raise', 'gym', [3, 4], [12, 15]],
    ['rear-delt-flye', 'Rear delt flye', 'gym', [3, 4], [12, 15]],
    ['face-pull', 'Face pull', 'gym', [3, 4], [12, 15]],
    ['arnold-press', 'Arnold press', 'gym', [3, 4], [8, 12]],
    ['pike-push-up', 'Pike push-up', 'any', [3, 4], [8, 12]],
    ['wall-handstand', 'Wall handstand hold', 'any', [3, 4], [20, 40]],
    ['plank-shoulder-tap', 'Plank shoulder tap', 'any', [3, 4], [16, 30]],
  ],
  biceps: [
    ['barbell-curl', 'Barbell curl', 'gym', [3, 4], [8, 12]],
    ['db-curl', 'Dumbbell curl', 'gym', [3, 4], [10, 12]],
    ['hammer-curl', 'Hammer curl', 'gym', [3, 4], [10, 12]],
    ['preacher-curl', 'Preacher curl', 'gym', [3, 4], [8, 12]],
    ['cable-curl', 'Cable curl', 'gym', [3, 4], [12, 15]],
    ['incline-db-curl', 'Incline dumbbell curl', 'gym', [3, 4], [10, 12]],
    ['chin-up', 'Chin-up', 'gym', [3, 4], [5, 10]],
    ['concentration-curl', 'Concentration curl', 'gym', [3, 4], [10, 12]],
    ['towel-curl', 'Towel door curl', 'home', [3, 4], [10, 15]],
    ['backpack-curl', 'Loaded backpack curl', 'home', [3, 4], [10, 15]],
  ],
  triceps: [
    ['rope-pushdown', 'Rope pushdown', 'gym', [3, 4], [10, 15]],
    ['skull-crusher', 'Skull crusher', 'gym', [3, 4], [8, 12]],
    ['overhead-db-ext', 'Overhead dumbbell extension', 'gym', [3, 4], [10, 12]],
    ['close-grip-bench', 'Close-grip bench press', 'gym', [3, 4], [6, 10]],
    ['cable-kickback', 'Cable kickback', 'gym', [3, 4], [12, 15]],
    ['bench-dip', 'Bench dip', 'any', [3, 4], [10, 15]],
    ['diamond-push-up', 'Diamond push-up', 'any', [3, 4], [8, 15]],
    ['triceps-dip', 'Parallel bar dip', 'gym', [3, 4], [6, 12]],
  ],
  abs: [
    ['cable-crunch', 'Cable crunch', 'gym', [3, 4], [12, 15]],
    ['hanging-leg-raise', 'Hanging leg raise', 'gym', [3, 4], [8, 15]],
    ['ab-wheel', 'Ab wheel rollout', 'gym', [3, 4], [8, 12]],
    ['decline-sit-up', 'Decline sit-up', 'gym', [3, 4], [12, 20]],
    ['plank', 'Plank (seconds)', 'any', [3, 3], [30, 60]],
    ['crunch', 'Crunch', 'any', [3, 4], [15, 25]],
    ['bicycle-crunch', 'Bicycle crunch', 'any', [3, 4], [20, 30]],
    ['lying-leg-raise', 'Lying leg raise', 'any', [3, 4], [12, 20]],
    ['mountain-climber', 'Mountain climber', 'any', [3, 4], [20, 40]],
    ['dead-bug', 'Dead bug', 'any', [3, 4], [10, 16]],
  ],
  legs: [
    ['back-squat', 'Back squat', 'gym', [3, 5], [5, 10]],
    ['leg-press', 'Leg press', 'gym', [3, 4], [10, 15]],
    ['romanian-deadlift', 'Romanian deadlift', 'gym', [3, 4], [8, 12]],
    ['leg-extension', 'Leg extension', 'gym', [3, 4], [12, 15]],
    ['leg-curl', 'Lying leg curl', 'gym', [3, 4], [10, 15]],
    ['hip-thrust', 'Barbell hip thrust', 'gym', [3, 4], [8, 12]],
    ['walking-lunge-db', 'Dumbbell walking lunge', 'gym', [3, 4], [10, 14]],
    ['calf-raise-machine', 'Standing calf raise', 'gym', [3, 4], [12, 20]],
    ['bodyweight-squat', 'Bodyweight squat', 'any', [3, 4], [15, 25]],
    ['lunge', 'Reverse lunge', 'any', [3, 4], [10, 16]],
    ['bulgarian-split-squat', 'Bulgarian split squat', 'any', [3, 4], [8, 12]],
    ['glute-bridge', 'Glute bridge', 'any', [3, 4], [12, 20]],
    ['jump-squat', 'Jump squat', 'any', [3, 4], [10, 15]],
    ['wall-sit', 'Wall sit (seconds)', 'any', [3, 3], [30, 60]],
  ],
};

export const EXERCISES: Exercise[] = MUSCLES.flatMap((muscle) =>
  rows[muscle].map(([id, name, where, sets, reps]) => ({ id, name, muscle, where, sets, reps })),
);

export const WARMUPS: Warmup[] = [
  { id: 'jumping-jacks', name: 'Jumping jacks, 2 min', where: 'any' },
  { id: 'jump-rope', name: 'Jump rope, 3 min', where: 'gym' },
  { id: 'rower', name: 'Rowing machine, 5 min', where: 'gym' },
  { id: 'bike', name: 'Bike, 5 min', where: 'gym' },
  { id: 'arm-circles', name: 'Arm circles, 1 min', where: 'any' },
  { id: 'band-pull-aparts', name: 'Band pull-aparts, 2 × 15', where: 'gym' },
  { id: 'high-knees', name: 'High knees, 1 min', where: 'any' },
  { id: 'world-greatest', name: 'World’s greatest stretch, 5 per side', where: 'any' },
  { id: 'incline-walk', name: 'Incline treadmill walk, 5 min', where: 'gym' },
];
