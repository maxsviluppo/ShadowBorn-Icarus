/** Dimensioni sheet — risoluzione nativa sorgente (6400×3600, frame 1280×720) */
export const WALK_SHEET_DIMENSIONS = {
  sheetWidth: 6400,
  sheetHeight: 3600,
  frameWidth: 1280,
  frameHeight: 720,
};

/** Sheet camminata 5×5 — 25 frame per direzione (frame 0 = placeholder nero) */
export const WALK_SHEET_GRID = {
  cols: 5,
  rows: 5,
  framesPerDir: 25,
};

export const DIRECTION_ORDER = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;
export type WalkDirection = (typeof DIRECTION_ORDER)[number];

/** File PNG in public/assets/character/ (nomi italiani O=West, NO=NorthWest, SO=SouthWest) */
export const WALK_SHEET_FILES: Record<WalkDirection, { key: string; path: string; file: string }> = {
  N: { key: 'sheet_n', path: '/assets/character/N.png', file: 'N.png' },
  NE: { key: 'sheet_ne', path: '/assets/character/NE.png', file: 'NE.png' },
  E: { key: 'sheet_e', path: '/assets/character/E.png', file: 'E.png' },
  SE: { key: 'sheet_se', path: '/assets/character/SE.png', file: 'SE.png' },
  S: { key: 'sheet_s', path: '/assets/character/S.png', file: 'S.png' },
  SW: { key: 'sheet_sw', path: '/assets/character/SO.png', file: 'SO.png' },
  W: { key: 'sheet_w', path: '/assets/character/O.png', file: 'O.png' },
  NW: { key: 'sheet_nw', path: '/assets/character/NO.png', file: 'NO.png' },
};

export const AVAILABLE_WALK_DIRS: WalkDirection[] = [...DIRECTION_ORDER];

export const DIRECTION_ANIM: Record<WalkDirection, string> = {
  N: 'walk_n',
  NE: 'walk_ne',
  E: 'walk_e',
  SE: 'walk_se',
  S: 'walk_s',
  SW: 'walk_sw',
  W: 'walk_w',
  NW: 'walk_nw',
};

/** Angoli schermo (gradi) per mappatura movimento → direzione */
export const DIR_ANGLES: Record<WalkDirection, number> = {
  E: 0,
  SE: 45,
  S: 90,
  SW: 135,
  W: 180,
  NW: -135,
  N: -90,
  NE: -45,
};

export const IDLE = {
  key: 'idle',
  path: '/assets/character/idle.png',
};

export const DEFAULT_CALIBRATION = {
  originX: 0.5,
  originY: 1.0,
  scale: 0.11,
  frameDurationMs: 80,
  moveSpeed: 6,
};

export function directionTextureKey(dir: WalkDirection): string {
  return `walk_frames_${dir.toLowerCase()}`;
}

export function pickWalkDirection(
  dx: number,
  dy: number,
  available: readonly WalkDirection[] = AVAILABLE_WALK_DIRS,
): WalkDirection {
  if (available.length === 0) return 'SE';
  if (Math.hypot(dx, dy) < 0.001) return available[0];

  const target = (Math.atan2(dy, dx) * 180) / Math.PI;
  let best = available[0];
  let bestDiff = Infinity;

  for (const dir of available) {
    const a = DIR_ANGLES[dir];
    const diff = Math.abs(((target - a + 180) % 360) - 180);
    if (diff < bestDiff) {
      bestDiff = diff;
      best = dir;
    }
  }
  return best;
}

export function directionRowIndex(dir: WalkDirection): number {
  return DIRECTION_ORDER.indexOf(dir);
}

/** @deprecated Usare WALK_SHEET_FILES */
export const WALK_ATLAS = {
  path: '/assets/character/atlas_8dir_0001.png',
  cols: 25,
  rows: 8,
  framesPerDir: 25,
};
