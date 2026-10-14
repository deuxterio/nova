export type Size = 'light' | 'medium' | 'large' | 'ultra';
export type Effort = 'low' | 'medium' | 'high';
export type MissionId = 'MIS-01' | 'MIS-02' | 'MIS-03' | 'MIS-04' | 'MIS-05' | 'MIS-06';
export type Outcome = 'apto' | 'incompleto' | 'faltan-datos';
export interface Selection { size: Size; effort: Effort }
export interface Companion { id: Size; name: string; label: string; description: string; base: number; color: string; quote: string }
export interface Variant { brief: string; context: string[]; criteria: string[]; missing?: string }
export interface Mission {
  id: MissionId; title: string; system: string; principle: string;
  variants: [Variant, Variant]; sizes: Size[]; efforts: Effort[];
  reference: Selection; lesson: string; work: string;
  sizeFailure: string; effortFailure: string; solution: [string, string];
}
export interface Encounter { missionId: MissionId; variant: 0 | 1; scanned: boolean }
export interface Attempt extends Selection {
  id: string; missionId: MissionId; encounterIndex: number; variant: 0 | 1;
  scanned: boolean; cost: number; outcome: Outcome; explanation: string;
}
export interface Expedition {
  seed: number; version: number; mode: 'T' | 'P'; encounters: Encounter[];
  index: number; energy: number; history: Attempt[]; phase: 'choosing' | 'result' | 'complete';
  selection: { size: Size | null; effort: Effort | null };
}
export interface Settings { sound: boolean; reducedMotion: boolean; hints: boolean }
export interface Progress {
  schema: 1; tutorialCompleted: boolean; completed: number; bestStars: number;
  rewards: string[]; settings: Settings; active: Expedition | null;
  attempts: Attempt[]; lastVariants: Partial<Record<MissionId, 0 | 1>>;
}
