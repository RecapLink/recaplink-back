const UNIT_MS: Record<string, number> = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
  w: 7 * 24 * 60 * 60 * 1000,
  y: 365 * 24 * 60 * 60 * 1000,
};

/** Parses simple durations like "15m", "7d", "1h" (as used by jsonwebtoken's expiresIn) into milliseconds. */
export function parseDurationMs(duration: string): number {
  const match = /^(\d+)\s*(s|m|h|d|w|y)$/i.exec(duration.trim());
  if (!match) return 7 * UNIT_MS.d; // sane fallback
  const [, amount, unit] = match;
  return Number(amount) * UNIT_MS[unit.toLowerCase()];
}

export function addDuration(base: Date, duration: string): Date {
  return new Date(base.getTime() + parseDurationMs(duration));
}
