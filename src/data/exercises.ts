export type Muscle = 'chest' | 'back' | 'shoulders' | 'biceps' | 'triceps' | 'abs' | 'legs';
export type Place = 'gym' | 'home';

export interface Exercise {
  id: string;
  name: string;
  muscle: Muscle;
  bodyweight: boolean; // true → allowed at home
  sets: [min: number, max: number];
  reps: [min: number, max: number];
}

export interface Warmup {
  id: string;
  name: string;
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

// Shorthand so the list below stays readable: [id, name, bodyweight, sets, reps]
type Row = [string, string, boolean, [number, number], [number, number]];

const rows: Record<Muscle, Row[]> = {
  chest: [
    ['bench-press', 'Barbell bench press', false, [3, 5], [5, 10]],
    ['incline-db-press', 'Incline dumbbell press', false, [3, 4], [8, 12]],
    ['db-flye', 'Dumbbell flye', false, [3, 4], [10, 15]],
    ['cable-crossover', 'Cable crossover', false, [3, 4], [12, 15]],
    ['chest-press-machine', 'Machine chest press', false, [3, 4], [8, 12]],
    ['pec-deck', 'Pec deck', false, [3, 4], [12, 15]],
    ['decline-bench', 'Decline bench press', false, [3, 4], [6, 10]],
    ['dips-chest', 'Chest dips', false, [3, 4], [6, 12]],
    ['push-up', 'Push-up', true, [3, 4], [10, 20]],
    ['wide-push-up', 'Wide push-up', true, [3, 4], [10, 20]],
    ['decline-push-up', 'Decline push-up', true, [3, 4], [8, 15]],
  ],
  back: [
    ['deadlift', 'Deadlift', false, [3, 5], [3, 8]],
    ['lat-pulldown', 'Lat pulldown', false, [3, 4], [8, 12]],
    ['barbell-row', 'Barbell row', false, [3, 4], [6, 10]],
    ['seated-cable-row', 'Seated cable row', false, [3, 4], [10, 12]],
    ['one-arm-db-row', 'One-arm dumbbell row', false, [3, 4], [8, 12]],
    ['t-bar-row', 'T-bar row', false, [3, 4], [8, 12]],
    ['straight-arm-pulldown', 'Straight-arm pulldown', false, [3, 4], [12, 15]],
    ['pull-up', 'Pull-up', false, [3, 4], [5, 12]],
    ['superman', 'Superman hold', true, [3, 4], [10, 15]],
    ['table-row', 'Inverted table row', true, [3, 4], [8, 15]],
    ['reverse-snow-angel', 'Reverse snow angel', true, [3, 4], [10, 15]],
  ],
  shoulders: [
    ['ohp', 'Overhead press', false, [3, 5], [5, 10]],
    ['db-shoulder-press', 'Seated dumbbell press', false, [3, 4], [8, 12]],
    ['lateral-raise', 'Lateral raise', false, [3, 4], [12, 15]],
    ['cable-lateral', 'Cable lateral raise', false, [3, 4], [12, 15]],
    ['rear-delt-flye', 'Rear delt flye', false, [3, 4], [12, 15]],
    ['face-pull', 'Face pull', false, [3, 4], [12, 15]],
    ['arnold-press', 'Arnold press', false, [3, 4], [8, 12]],
    ['pike-push-up', 'Pike push-up', true, [3, 4], [8, 12]],
    ['wall-handstand', 'Wall handstand hold', true, [3, 4], [20, 40]],
    ['plank-shoulder-tap', 'Plank shoulder tap', true, [3, 4], [16, 30]],
  ],
  biceps: [
    ['barbell-curl', 'Barbell curl', false, [3, 4], [8, 12]],
    ['db-curl', 'Dumbbell curl', false, [3, 4], [10, 12]],
    ['hammer-curl', 'Hammer curl', false, [3, 4], [10, 12]],
    ['preacher-curl', 'Preacher curl', false, [3, 4], [8, 12]],
    ['cable-curl', 'Cable curl', false, [3, 4], [12, 15]],
    ['incline-db-curl', 'Incline dumbbell curl', false, [3, 4], [10, 12]],
    ['chin-up', 'Chin-up', false, [3, 4], [5, 10]],
    ['towel-curl', 'Towel door curl', true, [3, 4], [10, 15]],
    ['backpack-curl', 'Loaded backpack curl', true, [3, 4], [10, 15]],
  ],
  triceps: [
    ['rope-pushdown', 'Rope pushdown', false, [3, 4], [10, 15]],
    ['skull-crusher', 'Skull crusher', false, [3, 4], [8, 12]],
    ['overhead-db-ext', 'Overhead dumbbell extension', false, [3, 4], [10, 12]],
    ['close-grip-bench', 'Close-grip bench press', false, [3, 4], [6, 10]],
    ['cable-kickback', 'Cable kickback', false, [3, 4], [12, 15]],
    ['bench-dip', 'Bench dip', true, [3, 4], [10, 15]],
    ['diamond-push-up', 'Diamond push-up', true, [3, 4], [8, 15]],
    ['triceps-dip', 'Parallel bar dip', false, [3, 4], [6, 12]],
  ],
  abs: [
    ['cable-crunch', 'Cable crunch', false, [3, 4], [12, 15]],
    ['hanging-leg-raise', 'Hanging leg raise', false, [3, 4], [8, 15]],
    ['ab-wheel', 'Ab wheel rollout', false, [3, 4], [8, 12]],
    ['decline-sit-up', 'Decline sit-up', false, [3, 4], [12, 20]],
    ['plank', 'Plank (seconds)', true, [3, 3], [30, 60]],
    ['crunch', 'Crunch', true, [3, 4], [15, 25]],
    ['bicycle-crunch', 'Bicycle crunch', true, [3, 4], [20, 30]],
    ['lying-leg-raise', 'Lying leg raise', true, [3, 4], [12, 20]],
    ['mountain-climber', 'Mountain climber', true, [3, 4], [20, 40]],
    ['dead-bug', 'Dead bug', true, [3, 4], [10, 16]],
  ],
  legs: [
    ['back-squat', 'Back squat', false, [3, 5], [5, 10]],
    ['leg-press', 'Leg press', false, [3, 4], [10, 15]],
    ['romanian-deadlift', 'Romanian deadlift', false, [3, 4], [8, 12]],
    ['leg-extension', 'Leg extension', false, [3, 4], [12, 15]],
    ['leg-curl', 'Lying leg curl', false, [3, 4], [10, 15]],
    ['hip-thrust', 'Barbell hip thrust', false, [3, 4], [8, 12]],
    ['walking-lunge-db', 'Dumbbell walking lunge', false, [3, 4], [10, 14]],
    ['calf-raise-machine', 'Standing calf raise', false, [3, 4], [12, 20]],
    ['bodyweight-squat', 'Bodyweight squat', true, [3, 4], [15, 25]],
    ['lunge', 'Reverse lunge', true, [3, 4], [10, 16]],
    ['bulgarian-split-squat', 'Bulgarian split squat', true, [3, 4], [8, 12]],
    ['glute-bridge', 'Glute bridge', true, [3, 4], [12, 20]],
    ['jump-squat', 'Jump squat', true, [3, 4], [10, 15]],
    ['wall-sit', 'Wall sit (seconds)', true, [3, 3], [30, 60]],
  ],
};

export const EXERCISES: Exercise[] = MUSCLES.flatMap((muscle) =>
  rows[muscle].map(([id, name, bodyweight, sets, reps]) => ({ id, name, muscle, bodyweight, sets, reps })),
);

export const WARMUPS: Warmup[] = [
  { id: 'jumping-jacks', name: 'Jumping jacks, 2 min' },
  { id: 'jump-rope', name: 'Jump rope, 3 min' },
  { id: 'rower', name: 'Rowing machine, 5 min' },
  { id: 'bike', name: 'Bike, 5 min' },
  { id: 'arm-circles', name: 'Arm circles and band pull-aparts' },
  { id: 'high-knees', name: 'High knees, 1 min' },
  { id: 'world-greatest', name: 'World’s greatest stretch, 5 per side' },
  { id: 'incline-walk', name: 'Incline treadmill walk, 5 min' },
];
