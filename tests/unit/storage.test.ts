import { describe, expect, it } from 'vitest';
import { getMission } from '../../src/content';
import { advance, createExpedition, execute, retry, scan } from '../../src/engine';
import { initialProgress, readProgress, saveProgress, STORAGE_KEY, validateExpedition } from '../../src/storage';
import type { Expedition, Selection } from '../../src/types';

function mockStorage() {
  const data = new Map<string, string>();
  return { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
}
function run(expedition: Expedition, selection: Selection): Expedition {
  const result = execute(expedition, selection, String(expedition.history.length));
  if (!result.accepted) throw new Error(result.reason);
  return result.expedition;
}
describe('Versioned local persistence', () => {
  it('round-trips preferences, rewards, and active results without charging again', () => {
    const storage = mockStorage();
    const progress = initialProgress();
    progress.settings.sound = true; progress.settings.reducedMotion = true;
    progress.rewards = ['portal']; progress.completed = 1;
    progress.active = run(createExpedition(123, 'T'), { size: 'light', effort: 'low' });
    expect(saveProgress(progress, storage)).toBe(true);
    const restored = readProgress(storage);
    expect(restored.notice).toBeNull(); expect(restored.progress).toEqual(progress);
    expect(restored.progress.active!.energy).toBe(97);
    expect(execute(restored.progress.active!, { size: 'ultra', effort: 'high' }, 'another').accepted).toBe(false);
  });
  it('validates every phase during a full expedition with missing-data retries', () => {
    let expedition = createExpedition(123, 'T');
    expect(validateExpedition(expedition)).toBe(true);
    while (expedition.phase !== 'complete') {
      const mission = getMission(expedition.encounters[expedition.index].missionId);
      if (mission.id === 'MIS-05') {
        expedition = run(expedition, mission.reference); expect(validateExpedition(expedition)).toBe(true);
        expedition = retry(expedition); expect(validateExpedition(expedition)).toBe(true);
      }
      expedition = scan(expedition); expect(validateExpedition(expedition)).toBe(true);
      expedition = run(expedition, mission.reference); expect(validateExpedition(expedition)).toBe(true);
      expedition = advance(expedition); expect(validateExpedition(expedition)).toBe(true);
    }
  });
  it('rejects broken JSON, schema versions, and invalid preference shapes', () => {
    const storage = mockStorage();
    for (const raw of ['{', JSON.stringify({ ...initialProgress(), schema: 2 }), JSON.stringify({ ...initialProgress(), settings: null })]) {
      storage.setItem(STORAGE_KEY, raw);
      expect(readProgress(storage).notice).not.toBeNull();
      expect(readProgress(storage).progress).toEqual(initialProgress());
    }
  });
  it('discards corrupted active state and preserves earned progress', () => {
    const storage = mockStorage();
    const progress = initialProgress();
    progress.completed = 2; progress.rewards = ['portal', 'smile'];
    progress.active = createExpedition(123, 'T'); progress.active.energy = -3;
    storage.setItem(STORAGE_KEY, JSON.stringify(progress));
    const restored = readProgress(storage);
    expect(restored.progress.active).toBeNull(); expect(restored.progress.completed).toBe(2);
    expect(restored.notice).toContain('recuperar');
  });
  it('rejects invalid mission ids, wrong outcomes, and tampered energy', () => {
    const expedition = run(createExpedition(123, 'T'), { size: 'light', effort: 'low' });
    for (const mutate of [
      (e: Expedition) => { e.encounters[0].missionId = 'MIS-99' as never; },
      (e: Expedition) => { e.history[0].outcome = 'incompleto'; },
      (e: Expedition) => { e.energy = 100; },
      (e: Expedition) => { e.history[0].cost = 0; },
    ]) { const changed = structuredClone(expedition); mutate(changed); expect(validateExpedition(changed)).toBe(false); }
  });
  it('continues in memory when the storage API throws', () => {
    const storage = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); } };
    expect(readProgress(storage).progress).toEqual(initialProgress());
    expect(readProgress(storage).notice).not.toBeNull();
    expect(saveProgress(initialProgress(), storage)).toBe(false);
  });
});
