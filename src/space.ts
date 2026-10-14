import kaplay from 'kaplay';
import { getCompanion } from './content';
import type { MissionId, Size } from './types';

export function createSpace(root: HTMLElement) {
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.tabIndex = -1;
  root.append(canvas);
  let view: 'home' | 'battle' | 'summary' = 'home';
  let selected: Size = 'light';
  let mission: MissionId = 'MIS-01';
  let reduced = false;
  let pulseAt = -100;
  let special = false;
  const ready = new Set<string>();
  const k = kaplay({ root, canvas, width: 960, height: 520, background: [0, 0, 0, 0], stretch: true, letterbox: true, global: false, debug: false, focus: false, loadingScreen: false, maxFPS: 30, pixelDensity: Math.min(window.devicePixelRatio, 2) });
  canvas.tabIndex = -1;
  for (const id of ['light', 'medium', 'large', 'ultra']) {
    k.loadSprite(id, `${import.meta.env.BASE_URL}crew/${id}.svg`).onLoad(() => {
      ready.add(id);
      if (ready.size === 4) canvas.dataset.ready = 'true';
    });
  }
  const circle = (options: Parameters<typeof k.drawCircle>[0]) => k.drawCircle({ ...options, anchor: 'center' });
  const ellipse = (options: Parameters<typeof k.drawEllipse>[0]) => k.drawEllipse({ ...options, anchor: 'center' });
  const stars = Array.from({ length: 85 }, (_, i) => ({ x: (i * 137.57) % 960, y: (i * 79.39) % 520, r: i % 7 === 0 ? 2 : 1, alpha: 0.15 + (i % 5) / 8 }));
  k.onDraw(() => {
    const t = reduced ? 0 : k.time();
    for (const star of stars) circle({ pos: k.vec2(star.x, star.y), radius: star.r, color: k.rgb('#d3e7ef'), opacity: star.alpha * (0.8 + Math.sin(t / 2 + star.x) * 0.2) });
    const cx = view === 'battle' ? 480 : 465;
    const cy = 252;
    const radius = view === 'battle' ? 116 : 145;
    const palette = ['#547d91', '#777cb3', '#539283', '#8b77a0', '#4e88a3', '#aa8771'];
    const color = view === 'battle' ? palette[Number(mission.at(-1)) - 1] : '#5e8594';
    for (let i = 7; i >= 1; i--) circle({ pos: k.vec2(cx, cy), radius: radius + i * 12, color: k.rgb(color), opacity: 0.012 + (special ? 0.012 : 0) });
    ellipse({ pos: k.vec2(cx, cy), radiusX: 299, radiusY: 88, angle: -22, fill: false, outline: { color: k.rgb('#75949c'), width: 1 }, opacity: 0.25 });
    ellipse({ pos: k.vec2(cx, cy), radiusX: 245, radiusY: 72, angle: -22, fill: false, outline: { color: k.rgb('#b3d4be'), width: 2 }, opacity: 0.2 });
    circle({ pos: k.vec2(cx, cy), radius, color: k.rgb(color) });
    circle({ pos: k.vec2(cx - 32, cy - 23), radius: radius - 32, color: k.rgb('#83a8a8'), opacity: 0.24 });
    circle({ pos: k.vec2(cx + 22, cy + 20), radius: radius - 24, color: k.rgb('#0d1f36'), opacity: 0.31 });
    // Bands of orbital land and clouds; the illustration never encodes difficulty.
    for (let i = 0; i < 6; i++) {
      const y = cy - 86 + i * 30;
      const x = cx - 64 + Math.sin(i * 3.1) * 30;
      ellipse({ pos: k.vec2(x, y), radiusX: 39 + i * 5, radiusY: 6, angle: -17, color: k.rgb('#b1cfbb'), opacity: 0.13 });
    }
    ellipse({ pos: k.vec2(cx, cy + 10), radiusX: 226, radiusY: 54, angle: -22, fill: false, outline: { color: k.rgb('#bdd1b1'), width: 3 }, opacity: 0.5 });
    const orbitX = cx + Math.cos(t * 0.13 + 2.6) * 284;
    const orbitY = cy + Math.sin(t * 0.13 + 2.6) * 85;
    circle({ pos: k.vec2(orbitX, orbitY), radius: 7, color: k.rgb('#baf769'), opacity: 0.8 });
    k.drawLine({ p1: k.vec2(orbitX + 13, orbitY + 6), p2: k.vec2(orbitX + 56, orbitY + 17), color: k.rgb('#baf769'), width: 1, opacity: 0.35 });
    const float = Math.sin(t * 1.3) * 9;
    const id = view === 'battle' ? selected : view === 'summary' ? 'ultra' : 'light';
    if (ready.has(id)) {
      k.drawSprite({ sprite: id, pos: k.vec2(cx + 20, cy - 3 + float), width: 276, height: 276, anchor: 'center', angle: reduced ? 0 : Math.sin(t * 0.6) * 3 });
    }
    if (special && view !== 'battle') {
      k.drawLine({ p1: k.vec2(780 - ((t * 25) % 250), 75), p2: k.vec2(850 - ((t * 25) % 250), 50), width: 2, color: k.rgb('#f6c878'), opacity: 0.5 });
    }
    const age = k.time() - pulseAt;
    if (age < 1.1) {
      const accent = k.rgb(getCompanion(selected).color);
      circle({ pos: k.vec2(cx, cy), radius: reduced ? 167 : 110 + age * 190, fill: false, outline: { color: accent, width: 3 }, opacity: 1 - age / 1.1 });
      if (!reduced) for (let i = 0; i < 12; i++) {
        const angle = i * Math.PI / 6;
        circle({ pos: k.vec2(cx + Math.cos(angle) * age * 210, cy + Math.sin(angle) * age * 180), radius: 3, color: accent, opacity: 1 - age / 1.1 });
      }
    }
  });
  return {
    mount(slot: HTMLElement, options: { view: typeof view; selected?: Size; mission?: MissionId; reduced: boolean; special: boolean }) {
      view = options.view; selected = options.selected ?? 'light'; mission = options.mission ?? 'MIS-01'; reduced = options.reduced; special = options.special;
      slot.replaceChildren(canvas);
    },
    pulse() { if (!reduced) pulseAt = k.time(); },
    destroy() { k.quit(); },
  };
}
