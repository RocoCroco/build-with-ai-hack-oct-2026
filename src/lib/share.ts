import { MUSCLE_LABELS, type Muscle } from '../data/exercises';
import type { DrawState } from './drawState';
import { formatMinutes } from './timeWheel';

type Plan = Pick<DrawState, 'minutes' | 'place' | 'warmup' | 'drawn'>;

const PLACE_LABELS = { gym: 'Gym', home: 'Home' } as const;

/** The plan as plain text for a chat or notes app. "No warm-up" leaves the line out. */
export function planText(plan: Plan): string {
  const lines = [`My workout · ${formatMinutes(plan.minutes)} · ${PLACE_LABELS[plan.place]}`, ''];
  if (plan.warmup && plan.warmup !== 'none') lines.push(`Warm-up: ${plan.warmup.name}`);
  for (const { exercise, sets, reps } of plan.drawn) {
    lines.push(`${exercise.name} (${MUSCLE_LABELS[exercise.muscle]}): ${sets} × ${reps}`);
  }
  lines.push('', 'Drawn with Workout Draw 🎰');
  return lines.join('\n');
}

export type ShareResult = 'shared' | 'copied' | 'saved' | 'cancelled' | 'failed';

function isAbort(error: unknown) {
  return error instanceof DOMException && error.name === 'AbortError';
}

/**
 * Opens the phone's share sheet, or copies to the clipboard where there is none
 * (desktop browsers, and plain-http dev servers, which hide navigator.share).
 */
export async function shareText(text: string): Promise<ShareResult> {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return 'shared';
    } catch (error) {
      if (isAbort(error)) return 'cancelled';
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    return 'copied';
  } catch {
    // The clipboard API also needs https; the old copy command works on plain http.
    const area = document.createElement('textarea');
    area.value = text;
    document.body.append(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok ? 'copied' : 'failed';
  }
}

/** Shares the image file where the share sheet takes files, otherwise downloads it. */
export async function sharePhoto(blob: Blob): Promise<ShareResult> {
  const file = new File([blob], 'workout-draw.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return 'shared';
    } catch (error) {
      if (isAbort(error)) return 'cancelled';
    }
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'saved';
}

// ---- The photo: the plan drawn on a canvas, in the app's own colors and fonts ----

const WIDTH = 1080;
const PAD = 72;
const CARD_H = 132;
const CARD_GAP = 20;

const MUSCLE_COLORS: Record<Muscle, string> = {
  chest: '--plate-red',
  back: '--plate-blue',
  shoulders: '--plate-yellow',
  biceps: '--plate-green',
  triceps: '--plate-orange',
  abs: '--plate-white',
  legs: '--plate-violet',
};

/** Cuts text with an ellipsis so it fits in maxWidth at the current font. */
function fit(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let cut = text;
  while (cut.length > 1 && ctx.measureText(`${cut}…`).width > maxWidth) cut = cut.slice(0, -1);
  return `${cut.trimEnd()}…`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

export async function planImage(plan: Plan): Promise<Blob> {
  // Colors come from the CSS tokens so the photo matches the screen.
  const css = getComputedStyle(document.documentElement);
  const color = (name: string) => css.getPropertyValue(name).trim();
  const display = '"Barlow Condensed", "Barlow", sans-serif';
  const body = '"Barlow", sans-serif';
  // The canvas silently falls back to a system font if the web fonts aren't loaded yet.
  await Promise.all([
    document.fonts.load(`700 40px "Barlow Condensed"`),
    document.fonts.load(`600 40px "Barlow"`),
    document.fonts.load(`400 40px "Barlow"`),
  ]);

  const rows: { name: string; label: string; volume: string; color: string }[] = [];
  if (plan.warmup && plan.warmup !== 'none') {
    rows.push({ name: plan.warmup.name, label: 'Warm-up', volume: '', color: color('--plate') });
  }
  for (const { exercise, sets, reps } of plan.drawn) {
    rows.push({
      name: exercise.name,
      label: MUSCLE_LABELS[exercise.muscle],
      volume: `${sets} × ${reps}`,
      color: color(MUSCLE_COLORS[exercise.muscle]),
    });
  }

  const headerH = 300;
  const footerH = 140;
  const height = headerH + rows.length * (CARD_H + CARD_GAP) - CARD_GAP + footerH;
  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas');

  ctx.fillStyle = color('--floor');
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.textBaseline = 'alphabetic';

  // Header: app name, title, and the setup that made this draw
  ctx.fillStyle = color('--plate');
  ctx.font = `700 40px ${display}`;
  ctx.fillText('WORKOUT DRAW', PAD, PAD + 36);
  ctx.fillStyle = color('--chalk');
  ctx.font = `700 110px ${display}`;
  ctx.fillText('Your workout', PAD, PAD + 150);
  ctx.fillStyle = color('--chalk-dim');
  ctx.font = `400 38px ${body}`;
  ctx.fillText(`${formatMinutes(plan.minutes)} · ${PLACE_LABELS[plan.place]} · ${plan.drawn.length} exercises`, PAD, PAD + 205);

  // One card per row, like the plan screen
  rows.forEach((row, i) => {
    const y = headerH + i * (CARD_H + CARD_GAP);
    const w = WIDTH - PAD * 2;
    ctx.fillStyle = color('--surface');
    roundRect(ctx, PAD, y, w, CARD_H, 20);
    ctx.fillStyle = row.color;
    roundRect(ctx, PAD, y, 14, CARD_H, 7);

    ctx.font = `700 60px ${display}`;
    const volumeW = row.volume ? ctx.measureText(row.volume).width : 0;
    if (row.volume) {
      ctx.fillStyle = color('--chalk');
      ctx.textAlign = 'right';
      ctx.fillText(row.volume, PAD + w - 36, y + CARD_H / 2 + 22);
      ctx.textAlign = 'left';
    }
    ctx.fillStyle = color('--chalk');
    ctx.font = `600 44px ${body}`;
    ctx.fillText(fit(ctx, row.name, w - 50 - 36 - volumeW - 32), PAD + 50, y + 62);
    ctx.fillStyle = color('--chalk-dim');
    ctx.font = `400 32px ${body}`;
    ctx.fillText(row.label, PAD + 50, y + 106);
  });

  ctx.fillStyle = color('--chalk-dim');
  ctx.font = `400 32px ${body}`;
  ctx.textAlign = 'center';
  ctx.fillText('Randomize your routine', WIDTH / 2, height - 64);

  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('No image'))), 'image/png'),
  );
}
