import { describe, expect, it } from 'vitest';
import { EFFORTS, getMission, missions, SIZES } from '../../src/content';
import { advance, challengeCode, cost, createExpedition, dailySeed, efficientBudget, execute, parseChallenge, practiceSeed, retry, scan, selectionLabel, shareResult, stars } from '../../src/engine';
import type { Expedition, Selection } from '../../src/types';

const apply = (expedition: Expedition, selection: Selection, id = `attempt-${expedition.history.length}`) => {
  const result = execute(expedition, selection, id);
  if (!result.accepted) throw new Error(result.reason);
  return result.expedition;
};
function complete(expedition: Expedition) {
  while (expedition.phase !== 'complete') {
    const mission = getMission(expedition.encounters[expedition.index].missionId);
    expedition = scan(expedition);
    expedition = advance(apply(expedition, mission.reference));
  }
  return expedition;
}

describe('All twelve exact costs', () => {
  const expected = [[3, 5, 6], [6, 9, 12], [10, 15, 20], [15, 23, 30]];
  SIZES.forEach((size, i) => EFFORTS.forEach((effort, j) => {
    it(`${size} + ${effort} costs ${expected[i][j]}`, () => expect(cost(size, effort)).toBe(expected[i][j]));
  }));
});
describe('Every mission, both variants, every combination', () => {
  for (const mission of missions) for (const variant of [0, 1] as const) for (const size of SIZES) for (const effort of EFFORTS) {
    it(`${mission.id} variant ${variant}: ${size} + ${effort}`, () => {
      const expedition = createExpedition(123);
      expedition.encounters[0] = { missionId: mission.id, variant, scanned: true };
      const result = apply(expedition, { size, effort });
      const expected = mission.sizes.includes(size) && mission.efforts.includes(effort) ? 'apto' : 'incompleto';
      expect(result.history[0].outcome).toBe(expected);
      expect(result.energy).toBe(100 - cost(size, effort));
      expect(result.history[0].cost).toBe(cost(size, effort));
      expect(result.phase).toBe('result');
      if (expected === 'apto') expect(result.history[0].explanation).toContain(selectionLabel({ size, effort }));
      else expect(advance(result)).toEqual(result);
    });
  }
});
describe('Missing information and attempts', () => {
  for (const variant of [0, 1] as const) for (const size of SIZES) for (const effort of EFFORTS) {
    it(`No missing-data shortcut: ${variant} / ${size} + ${effort}`, () => {
      const expedition = createExpedition(123);
      expedition.encounters[0] = { missionId: 'MIS-05', variant, scanned: false };
      const first = apply(expedition, { size, effort });
      expect(first.history[0].outcome).toBe('faltan-datos');
      expect(first.energy).toBe(100 - cost(size, effort));
      const scanned = scan(retry(first));
      expect(scanned.energy).toBe(first.energy);
      expect(scanned.selection).toEqual({ size, effort });
      const second = apply(scanned, { size, effort });
      expect(second.history[1].outcome).toBe(getMission('MIS-05').sizes.includes(size) && getMission('MIS-05').efforts.includes(effort) ? 'apto' : 'incompleto');
    });
  }
  it('prevents duplicate deduction during a result or with a reused id', () => {
    const expedition = createExpedition(123, 'T');
    const result = apply(expedition, { size: 'light', effort: 'low' }, 'unique');
    expect(execute(result, { size: 'light', effort: 'low' }, 'another').accepted).toBe(false);
    expect(result.energy).toBe(97);
    const choosing = { ...result, phase: 'choosing' as const };
    expect(execute(choosing, { size: 'light', effort: 'low' }, 'unique').accepted).toBe(false);
  });
  it('blocks insufficient energy without spending it or recording an attempt', () => {
    const expedition = { ...createExpedition(123), energy: 2 };
    expect(execute(expedition, { size: 'ultra', effort: 'high' }, 'x').accepted).toBe(false);
    expect(expedition.energy).toBe(2);
    expect(expedition.history).toEqual([]);
  });
  it('does not allow retry to undo a successful result', () => {
    const result = apply(createExpedition(123, 'T'), { size: 'light', effort: 'low' });
    expect(retry(result)).toEqual(result);
  });
});
describe('Expedition content and scoring', () => {
  it('uses the specified tutorial order and 58-unit efficient budget', () => {
    const expedition = createExpedition(123, 'T');
    expect(expedition.encounters.map(e => e.missionId)).toEqual(['MIS-01', 'MIS-02', 'MIS-05', 'MIS-06']);
    expect(efficientBudget(expedition)).toBe(58);
    const result = complete(expedition);
    expect(result.energy).toBe(52);
    expect(stars(result)).toBe(3);
  });
  it('completes all 10 compositions within 100 energy and covers both variants', () => {
    const compositions = new Set<string>();
    const variants = new Set<string>();
    for (let seed = 0; seed < 200; seed++) {
      const expedition = createExpedition(seed);
      expect(new Set(expedition.encounters.slice(0, 3).map(e => e.missionId)).size).toBe(3);
      expect(expedition.encounters[3].missionId).toBe('MIS-06');
      compositions.add(expedition.encounters.slice(0, 3).map(e => e.missionId).sort().join(','));
      expedition.encounters.forEach(e => variants.add(`${e.missionId}:${e.variant}`));
      const result = complete(expedition);
      expect(result.energy).toBeGreaterThanOrEqual(0);
      expect(stars(result)).toBe(3);
    }
    expect(compositions.size).toBe(10);
    expect(variants.size).toBe(12);
  });
  it('allows valid oversized choices, but distinguishes energy efficiency', () => {
    let expedition = createExpedition(123, 'T');
    for (const choice of [{ size: 'ultra', effort: 'low' }, { size: 'ultra', effort: 'low' }, { size: 'ultra', effort: 'medium' }, { size: 'ultra', effort: 'high' }] as Selection[]) {
      expedition = advance(apply(scan(expedition), choice));
    }
    expect(expedition.phase).toBe('complete');
    expect(expedition.energy).toBe(17);
    expect(stars(expedition)).toBe(2);
  });
  it('awards only completion after a missing-data attempt, even with little energy spent', () => {
    let expedition = createExpedition(123, 'T');
    expedition = advance(apply(expedition, getMission('MIS-01').reference));
    expedition = advance(apply(expedition, getMission('MIS-02').reference));
    expedition = retry(apply(expedition, getMission('MIS-05').reference));
    expedition = complete(expedition);
    expect(stars(expedition)).toBe(1);
    expect(stars(createExpedition(123))).toBe(0);
  });
  it('prioritizes a failed principle in a new variant without breaking challenge reproducibility', () => {
    for (const mission of missions) {
      const seed = practiceSeed(101, mission.id, 0);
      const expedition = createExpedition(seed);
      expect(expedition.encounters.find(e => e.missionId === mission.id)?.variant).toBe(1);
      const parsed = parseChallenge(challengeCode(expedition));
      expect(createExpedition(parsed.seed, parsed.mode)).toEqual(expedition);
    }
  });
});
describe('Reproducible challenges', () => {
  for (const seed of [0, 1, 0x1234abcd, 0xffffffff]) for (const mode of ['T', 'P'] as const) {
    it(`round-trips seed ${seed} and mode ${mode}`, () => {
      const expedition = createExpedition(seed, mode);
      const parsed = parseChallenge(challengeCode(expedition).toLowerCase());
      expect(createExpedition(parsed.seed, parsed.mode)).toEqual(expedition);
    });
  }
  it('rejects unsupported versions and malformed codes', () => {
    expect(() => parseChallenge('NOVA2-P-1234ABCD')).toThrow('otra versión');
    for (const code of ['', 'NOVA1-X-1234ABCD', 'NOVA1-P-1', '<script>']) expect(() => parseChallenge(code)).toThrow('no es válido');
  });
  it('derives the daily seed from the local calendar date, not the time', () => {
    expect(dailySeed(new Date(2026, 9, 13, 0, 5))).toBe(dailySeed(new Date(2026, 9, 13, 23, 59)));
    expect(dailySeed(new Date(2026, 9, 13))).not.toBe(dailySeed(new Date(2026, 9, 14)));
  });
  it('shares the real successful selections and content version', () => {
    const result = complete(createExpedition(123, 'T'));
    const text = shareResult(result);
    expect(text).toContain('Contenido v1'); expect(text).toContain(challengeCode(result));
    expect(text).toContain('3/3 estrellas'); expect(text).toContain('Ultra + Alto');
    expect(text.split('MIS-')).toHaveLength(5);
  });
});
