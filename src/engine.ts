import { CONTENT_VERSION, effortInfo, getCompanion, getMission } from './content';
import type { Attempt, Effort, Encounter, Expedition, MissionId, Outcome, Selection, Size } from './types';

export const cost = (size: Size, effort: Effort) => Math.ceil(getCompanion(size).base * effortInfo[effort].multiplier);
export const selectionLabel = (selection: Selection) => `${getCompanion(selection.size).label} + ${effortInfo[selection.effort].label}`;
export function hashSeed(value: string): number {
  let hash = 2166136261;
  for (const char of value) { hash ^= char.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}
function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6D2B79F5;
    let n = Math.imul(state ^ state >>> 15, 1 | state);
    n ^= n + Math.imul(n ^ n >>> 7, 61 | n);
    return ((n ^ n >>> 14) >>> 0) / 4294967296;
  };
}
export function createExpedition(seed: number, mode: 'T' | 'P' = 'P'): Expedition {
  const rng = random(seed);
  const pool: MissionId[] = ['MIS-01', 'MIS-02', 'MIS-03', 'MIS-04', 'MIS-05'];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const ids: MissionId[] = mode === 'T' ? ['MIS-01', 'MIS-02', 'MIS-05', 'MIS-06'] : [...pool.slice(0, 3), 'MIS-06'];
  const encounters: Encounter[] = ids.map(missionId => ({ missionId, variant: mode === 'T' ? 0 : rng() < 0.5 ? 0 : 1, scanned: false }));
  return { seed: seed >>> 0, version: CONTENT_VERSION, mode, encounters, index: 0, energy: 100, history: [], phase: 'choosing', selection: { size: null, effort: null } };
}
export function practiceSeed(seed: number, missionId?: MissionId, lastVariant?: 0 | 1): number {
  if (!missionId) return seed;
  for (let i = 0; i < 1000; i++) {
    const candidate = (seed + i) >>> 0;
    const encounter = createExpedition(candidate).encounters.find(e => e.missionId === missionId);
    if (encounter && (lastVariant === undefined || encounter.variant !== lastVariant)) return candidate;
  }
  return seed;
}
export function dailySeed(date = new Date()): number {
  return hashSeed(`${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`);
}
export function challengeCode(expedition: Pick<Expedition, 'seed' | 'mode' | 'version'>): string {
  return `NOVA${expedition.version}-${expedition.mode}-${expedition.seed.toString(16).padStart(8, '0').toUpperCase()}`;
}
export function parseChallenge(input: string): { seed: number; mode: 'T' | 'P' } {
  const match = /^NOVA(\d+)-([TP])-([0-9A-F]{8})$/i.exec(input.trim());
  if (!match) throw new Error('Ese código no es válido. Usa un código como NOVA1-P-12AB34CD.');
  if (Number(match[1]) !== CONTENT_VERSION) throw new Error('Este desafío usa otra versión de contenido. Puedes iniciar una expedición nueva.');
  return { seed: parseInt(match[3], 16), mode: match[2].toUpperCase() as 'T' | 'P' };
}
export function efficientBudget(expedition: Expedition): number {
  const reference = expedition.encounters.reduce((sum, encounter) => {
    const { size, effort } = getMission(encounter.missionId).reference;
    return sum + cost(size, effort);
  }, 0);
  return reference + Math.max(6, Math.ceil(reference * 0.2));
}
export function stars(expedition: Expedition): number {
  if (expedition.phase !== 'complete') return 0;
  if (expedition.history.some(attempt => attempt.outcome !== 'apto')) return 1;
  return 100 - expedition.energy <= efficientBudget(expedition) ? 3 : 2;
}
export type Execution = { accepted: true; expedition: Expedition; attempt: Attempt } | { accepted: false; reason: string };
export function execute(expedition: Expedition, selection: Selection, id: string): Execution {
  if (expedition.phase !== 'choosing' || expedition.history.some(a => a.id === id)) return { accepted: false, reason: 'Ya hay una ejecución resuelta. Continúa o reintenta.' };
  const mission = getMission(expedition.encounters[expedition.index].missionId);
  const encounter = expedition.encounters[expedition.index];
  const amount = cost(selection.size, selection.effort);
  if (amount > expedition.energy) return { accepted: false, reason: 'Energía insuficiente. Cambia tu selección o reinicia la expedición.' };
  const missing = Boolean(mission.variants[encounter.variant].missing) && !encounter.scanned;
  const sizeOK = mission.sizes.includes(selection.size);
  const effortOK = mission.efforts.includes(selection.effort);
  const outcome: Outcome = missing ? 'faltan-datos' : sizeOK && effortOK ? 'apto' : 'incompleto';
  let explanation: string;
  if (missing) explanation = 'Falta la hora de llegada. Escanea para pedir ese dato; ninguna combinación puede inventarlo.';
  else if (outcome === 'incompleto') explanation = [!sizeOK ? mission.sizeFailure : '', !effortOK ? mission.effortFailure : ''].filter(Boolean).join(' ');
  else {
    explanation = `${selectionLabel(selection)} cumplió los criterios. ${mission.lesson}`;
    if (amount > cost(mission.reference.size, mission.reference.effort)) explanation += ` ${selectionLabel(mission.reference)} también habría sido apto con menos energía.`;
  }
  const attempt: Attempt = { ...selection, id, missionId: mission.id, encounterIndex: expedition.index, variant: encounter.variant, scanned: encounter.scanned, cost: amount, outcome, explanation };
  return { accepted: true, attempt, expedition: { ...expedition, energy: expedition.energy - amount, history: [...expedition.history, attempt], phase: 'result', selection } };
}
export function scan(expedition: Expedition): Expedition {
  if (expedition.phase !== 'choosing') return expedition;
  return { ...expedition, encounters: expedition.encounters.map((encounter, index) => index === expedition.index ? { ...encounter, scanned: true } : encounter) };
}
export function retry(expedition: Expedition): Expedition {
  if (expedition.phase !== 'result' || expedition.history.at(-1)?.outcome === 'apto') return expedition;
  return { ...expedition, phase: 'choosing' };
}
export function advance(expedition: Expedition): Expedition {
  if (expedition.phase !== 'result' || expedition.history.at(-1)?.outcome !== 'apto') return expedition;
  if (expedition.index === 3) return { ...expedition, phase: 'complete' };
  return { ...expedition, index: expedition.index + 1, phase: 'choosing', selection: { size: null, effort: null } };
}
export function shareResult(expedition: Expedition): string {
  const decisions = expedition.history.filter(a => a.outcome === 'apto').map(a => `${a.missionId}: ${selectionLabel(a)}`).join('\n');
  return `NOVA ARENA · Contenido v${expedition.version}\nDesafío: ${challengeCode(expedition)}\n${stars(expedition)}/3 estrellas · ${100 - expedition.energy} de energía usada\n${decisions}`;
}
