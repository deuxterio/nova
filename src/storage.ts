import { CONTENT_VERSION, EFFORTS, getMission, SIZES } from './content';
import { createExpedition, cost, execute, advance, retry, scan } from './engine';
import type { Attempt, Expedition, Progress } from './types';

export const STORAGE_KEY = 'nova-arena:progress:v1';
export const initialProgress = (): Progress => ({
  schema: 1, tutorialCompleted: false, completed: 0, bestStars: 0, rewards: [],
  settings: { sound: false, reducedMotion: false, hints: true },
  active: null, attempts: [], lastVariants: {},
});
type ObjectValue = Record<string, unknown>;
const object = (value: unknown): value is ObjectValue => Boolean(value && typeof value === 'object' && !Array.isArray(value));
function isAttempt(value: unknown): value is Attempt {
  if (!object(value)) return false;
  return typeof value.id === 'string' && typeof value.missionId === 'string' && /^MIS-0[1-6]$/.test(value.missionId)
    && SIZES.includes(value.size as Attempt['size']) && EFFORTS.includes(value.effort as Attempt['effort'])
    && (value.variant === 0 || value.variant === 1) && typeof value.scanned === 'boolean'
    && ['apto', 'incompleto', 'faltan-datos'].includes(value.outcome as string)
    && Number.isInteger(value.encounterIndex) && Number(value.encounterIndex) >= 0 && Number(value.encounterIndex) < 4
    && typeof value.explanation === 'string' && value.cost === cost(value.size as Attempt['size'], value.effort as Attempt['effort']);
}
// Replay saved attempts to reject damaged state and preserve the single-charge invariant.
export function validateExpedition(value: unknown): value is Expedition {
  if (!object(value) || value.version !== CONTENT_VERSION || !Number.isInteger(value.seed)
    || Number(value.seed) < 0 || Number(value.seed) > 0xffffffff || !['T', 'P'].includes(value.mode as string)
    || !Array.isArray(value.encounters) || value.encounters.length !== 4
    || !Array.isArray(value.history) || value.history.length > 34 || !value.history.every(isAttempt)
    || !object(value.selection)) return false;
  let replay = createExpedition(value.seed as number, value.mode as 'T' | 'P');
  for (const [i, saved] of value.encounters.entries()) {
    if (!object(saved) || saved.missionId !== replay.encounters[i].missionId || saved.variant !== replay.encounters[i].variant || typeof saved.scanned !== 'boolean') return false;
  }
  const history = value.history as Attempt[];
  for (const attempt of history) {
    if (replay.phase === 'result') replay = replay.history.at(-1)?.outcome === 'apto' ? advance(replay) : retry(replay);
    if (attempt.scanned) replay = scan(replay);
    if (attempt.missionId !== replay.encounters[replay.index]?.missionId || attempt.variant !== replay.encounters[replay.index]?.variant || attempt.encounterIndex !== replay.index) return false;
    const result = execute(replay, attempt, attempt.id);
    if (!result.accepted || result.attempt.outcome !== attempt.outcome) return false;
    replay = result.expedition;
  }
  if (replay.phase === 'result' && value.phase !== 'result') replay = replay.history.at(-1)?.outcome === 'apto' ? advance(replay) : retry(replay);
  if (value.index !== replay.index || value.phase !== replay.phase || value.energy !== replay.energy) return false;
  for (const [i, saved] of (value.encounters as Expedition['encounters']).entries()) {
    if (replay.encounters[i].scanned && !saved.scanned) return false;
    if (!replay.encounters[i].scanned && saved.scanned && i > replay.index) return false;
  }
  const { size, effort } = value.selection;
  return (size === null || SIZES.includes(size as Attempt['size'])) && (effort === null || EFFORTS.includes(effort as Attempt['effort']));
}
export function readProgress(storage?: Pick<Storage, 'getItem'>): { progress: Progress; notice: string | null } {
  try {
    const raw = (storage ?? window.localStorage).getItem(STORAGE_KEY);
    if (!raw) return { progress: initialProgress(), notice: null };
    const value: unknown = JSON.parse(raw);
    if (!object(value) || value.schema !== 1 || typeof value.tutorialCompleted !== 'boolean'
      || !Number.isInteger(value.completed) || Number(value.completed) < 0
      || !Number.isInteger(value.bestStars) || Number(value.bestStars) < 0 || Number(value.bestStars) > 3
      || !Array.isArray(value.rewards) || !value.rewards.every(r => typeof r === 'string')
      || !object(value.settings) || !['sound', 'reducedMotion', 'hints'].every(key => typeof (value.settings as ObjectValue)[key] === 'boolean')
      || !Array.isArray(value.attempts) || !value.attempts.every(isAttempt)
      || !object(value.lastVariants)
      || !Object.entries(value.lastVariants).every(([id, variant]) => /^MIS-0[1-6]$/.test(id) && (variant === 0 || variant === 1))) {
      return { progress: initialProgress(), notice: 'El guardado no es compatible. Puedes empezar una expedición nueva.' };
    }
    if (value.active !== null && !validateExpedition(value.active)) {
      value.active = null;
      return { progress: value as unknown as Progress, notice: 'La expedición guardada no se pudo recuperar. Tu progreso y ajustes siguen disponibles.' };
    }
    // Ensure content ids are known before any display code reads them.
    for (const attempt of value.attempts as Attempt[]) getMission(attempt.missionId);
    return { progress: value as unknown as Progress, notice: null };
  } catch {
    return { progress: initialProgress(), notice: 'No se pudo leer el progreso. Puedes jugar durante esta sesión.' };
  }
}
export function saveProgress(progress: Progress, storage?: Pick<Storage, 'setItem'>): boolean {
  try { (storage ?? window.localStorage).setItem(STORAGE_KEY, JSON.stringify(progress)); return true; }
  catch { return false; }
}
