import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import './style.css';
import { companions, effortInfo, EFFORTS, getCompanion, getMission, rewards } from './content';
import { advance, challengeCode, cost, createExpedition, dailySeed, efficientBudget, execute, parseChallenge, practiceSeed, retry, scan, selectionLabel, shareResult, stars } from './engine';
import { initialProgress, readProgress, saveProgress } from './storage';
import { icon, novaMark } from './icons';
import { createSpace } from './space';
import { playSignal } from './audio';
import type { Effort, Expedition, Size } from './types';

const app = document.querySelector<HTMLDivElement>('#app')!;
const loaded = readProgress();
let progress = loaded.progress;
let screen: 'home' | 'intro' | 'battle' | 'summary' = progress.active?.phase === 'result' ? 'battle' : 'home';
let introIndex = 0;
let busy = false;
let animationTimer: ReturnType<typeof setTimeout> | null = null;
let pendingConfirm: (() => void) | null = null;
let activeDialog: HTMLDialogElement | null = null;
let space: ReturnType<typeof createSpace> | null = null;
let storageAvailable = saveProgress(progress);
const systemMotion = matchMedia('(prefers-reduced-motion: reduce)');
const reduced = () => progress.settings.reducedMotion || systemMotion.matches;
const esc = (text: string | number) => String(text).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);
const portrait = (id: Size, css = '', alt = '') => `<img class="portrait ${css}" src="${import.meta.env.BASE_URL}crew/${id}.svg" alt="${esc(alt)}" width="320" height="320" />`;

const live = document.createElement('div');
live.className = 'toast'; live.setAttribute('role', 'status'); live.setAttribute('aria-live', 'polite');
document.body.append(live);
let toastTimer: ReturnType<typeof setTimeout> | null = null;
function toast(message: string) {
  live.textContent = message; live.classList.add('visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => live.classList.remove('visible'), 5500);
}
function persist() {
  if (!saveProgress(progress)) {
    if (storageAvailable) toast('El almacenamiento no está disponible. El progreso se conserva solo durante esta sesión.');
    storageAvailable = false;
  }
}
function sound(type: Parameters<typeof playSignal>[0]) { playSignal(type, progress.settings.sound); }
function header() {
  return `<header class="site-header">
    <a class="brand" href="#" data-action="home" aria-label="NOVA ARENA, inicio">${novaMark}<span>NOVA<span class="brand-arena">ARENA</span></span></a>
    <nav class="main-nav" aria-label="Navegación principal"><button class="nav-link ${screen === 'home' ? 'active' : ''}" data-action="home">La nave</button><button class="nav-link" data-action="guide">Cómo jugar</button></nav>
    <div class="header-right"><span class="system-status"><span></span> SISTEMAS EN LÍNEA</span><button class="icon-button" data-action="sound" aria-label="${progress.settings.sound ? 'Desactivar' : 'Activar'} sonido" aria-pressed="${progress.settings.sound}">${icon(progress.settings.sound ? 'sound' : 'mute')}</button><button class="icon-button" data-action="settings" aria-label="Ajustes">${icon('settings')}</button></div>
  </header>`;
}
function crewCards(selectable = false, expedition?: Expedition) {
  return companions.map((companion, index) => {
    const selected = selectable && expedition?.selection.size === companion.id;
    const content = `<div class="card-top"><span class="size-tag">${esc(companion.label)}</span><span class="base-cost" aria-label="Coste base ${companion.base}">${icon('bolt')}${companion.base}</span></div>
      <div class="portrait-wrap">${portrait(companion.id)}<span class="orbit-line"></span></div>
      <div class="card-caption"><span class="crew-number">0${index + 1}</span><h3>${companion.name}</h3>${selected ? `<span class="selected-check">${icon('check')}</span>` : ''}</div><p>${companion.description}</p>`;
    const classes = `crew-card ${selected ? 'selected' : ''} ${progress.rewards.includes('foil') ? 'foil' : ''}`;
    return selectable
      ? `<button id="size-${companion.id}" class="${classes}" style="--crew-color:${companion.color}" data-action="size" data-value="${companion.id}" aria-pressed="${selected}" aria-label="${companion.name}, tamaño ${companion.label}, coste base ${companion.base}">${content}</button>`
      : `<article class="${classes}" style="--crew-color:${companion.color}">${content}</article>`;
  }).join('');
}
function home() {
  const active = progress.active && progress.active.phase !== 'complete';
  return `<main id="main-content" class="home-page">
    <section class="hero">
      <div class="hero-copy"><div class="eyebrow"><span class="small-star">✦</span> UNA AVENTURA PARA ELEGIR MEJOR</div>
        <h1>Tu criterio.<br>Toda una <span>galaxia.</span></h1>
        <p class="hero-description">No todos los retos necesitan el máximo.<br>Elige a tu compañero, ajusta su esfuerzo<br class="desktop-break"> y libera los sistemas de Órbita Cero.</p>
        <div class="hero-actions"><button class="button primary" data-action="${active ? 'resume' : 'play'}">${active ? 'Continuar expedición' : 'Iniciar expedición'} ${icon('arrow')}</button><button class="button secondary" data-action="daily">Desafío diario <span class="day-dot"></span></button></div>
        <div class="hero-meta"><span>4 encuentros</span><i></i><span>3–5 minutos</span><i></i><span>A tu ritmo</span></div>
        ${active ? `<p class="resume-note">Guardado local · Encuentro ${progress.active!.index + 1}/4 · ${progress.active!.energy} de energía <button class="text-button" data-action="play">Nueva partida</button></p>` : ''}
      </div>
      <div class="hero-visual ${progress.rewards.includes('aurora') ? 'aurora' : ''}"><div class="coordinate top-coordinate">SECTOR 01 <span>／</span> 28.4° N · 06.8° E</div><div id="space-slot" class="space-slot"></div>
        <div class="orbit-label"><span class="orbit-pip"></span><div><span class="eyebrow">TU PRÓXIMO DESTINO</span><h2>Órbita Cero</h2><p>Un bloqueo. Cuatro sistemas por liberar.</p></div></div>
        <div class="chiqui-message"><span>CHIQUI, COPILOTO</span>“${progress.rewards.includes('smile') ? '¡Ya sonrío como capitán! ¿Otra vuelta?' : 'Yo ya pulsé despegar. Tú decides el resto.'}”</div>
      </div>
    </section>
    <section class="crew-section" aria-labelledby="crew-heading"><div class="section-heading"><div><span class="eyebrow">CONOCE A TU TRIPULACIÓN</span><h2 id="crew-heading">Cuatro tamaños. Un mismo equipo.</h2></div><p>Quién puede resolverlo <span>＋</span> cuánto necesita pensar.</p></div><div class="crew-grid home-crew">${crewCards()}</div></section>
    <section class="home-bottom"><div class="progress-overview"><span class="mini-symbol">◈</span><div><span class="eyebrow">TU BITÁCORA</span><p>${progress.completed ? `${progress.completed} ${progress.completed === 1 ? 'expedición' : 'expediciones'} · Mejor resultado: ${progress.bestStars}/3 estrellas` : 'Tu historia está a punto de comenzar.'}</p></div><button class="text-button" data-action="collection">${progress.rewards.length}/6 hallazgos ${icon('chevron')}</button></div><button class="challenge-link" data-action="challenge">${icon('copy')} ¿Tienes un código de desafío? ${icon('arrow')}</button></section>
  </main>`;
}
const panels = [
  { tag: '01 / LA INVOCACIÓN', title: 'Solo era una carta más.', text: 'Mientras trabajas con una IA, la pantalla se apaga. Una carta flota frente a ti: «¿Aceptar la invocación?». La tocas. Y la Tierra desaparece.', quote: 'Tu ruta de regreso está entre las estrellas.' },
  { tag: '02 / TU NUEVO COPILOTO', title: 'Bienvenido, capitán.', text: 'Despiertas en una nave abandonada. Un dron te saluda como si llevara años esperándote.', quote: '¡Por fin llegó nuestro capitán! Espero que sepas lo que haces… porque yo ya pulsé despegar.' },
  { tag: '03 / EL IMPERIO DEL NÚCLEO', title: 'El máximo tiene un coste.', text: 'El Imperio usa máxima capacidad y esfuerzo para cada operación. Los mundos se quedan sin energía. Tu rival Kael cree que no hay otra manera.', quote: 'Elige quién puede resolverlo y cuánto necesita pensar.' },
  { tag: '04 / ÓRBITA CERO', title: 'Una galaxia. Dos decisiones.', text: 'Recupera cuatro sistemas de la estación. Lee cada tarea, combina tamaño y esfuerzo y ejecuta. Si falta información, pídela. No hay prisa.', quote: '100 de energía. Cuatro compañeros. Y una pista para volver a casa.' },
];
function intro() {
  const panel = panels[introIndex];
  return `<main id="main-content" class="intro-page"><div class="intro-art">${portrait('light', '', 'Chiqui, tu dron copiloto')}<div class="intro-orbit"></div></div><section class="intro-copy"><div class="eyebrow">${panel.tag}</div><h1 id="intro-title" tabindex="-1">${panel.title}</h1><p>${panel.text}</p><blockquote>${panel.quote}</blockquote><div class="intro-dots" aria-label="Panel ${introIndex + 1} de 4">${panels.map((_, i) => `<span class="${i === introIndex ? 'current' : ''}"></span>`).join('')}</div><div class="hero-actions"><button class="button primary" data-action="intro-next">${introIndex === 3 ? 'Vamos a Órbita Cero' : 'Continuar'} ${icon('arrow')}</button><button class="text-button" data-action="intro-skip">Omitir introducción</button></div></section></main>`;
}
function missionPanel(expedition: Expedition) {
  const encounter = expedition.encounters[expedition.index];
  const mission = getMission(encounter.missionId);
  const variant = mission.variants[encounter.variant];
  return `<section class="mission-panel" aria-labelledby="mission-title"><div class="mission-art"><div id="space-slot" class="space-slot"></div><span class="mission-number">${mission.id} <span>／</span> ${encounter.variant === 1 ? 'TRANSFERENCIA' : 'EXPLORACIÓN'}</span><div class="mission-art-bottom"><span>SEÑAL DETECTADA</span><span class="signal-bars">▂ ▄ ▆ ▄ ▂</span></div></div>
    <div class="mission-copy"><div class="eyebrow">${mission.system}</div><h1 id="mission-title" tabindex="-1">${mission.title}</h1><p class="mission-brief">${variant.brief}</p><details class="context-panel" open><summary>Contexto disponible <span>＋</span></summary><ul>${variant.context.map(line => `<li>${esc(line)}</li>`).join('')}</ul>${encounter.scanned && variant.missing ? `<p class="revealed-data">${icon('scan')}<span><strong>Dato recuperado</strong>${variant.missing}</span></p>` : ''}</details><details class="criteria-panel" open><summary>Criterios para superar el encuentro</summary><ul>${variant.criteria.map(line => `<li>${esc(line)}</li>`).join('')}</ul></details></div></section>`;
}
function controls(expedition: Expedition) {
  const { size, effort } = expedition.selection;
  const amount = size && effort ? cost(size, effort) : null;
  const canExecute = amount !== null && amount <= expedition.energy;
  const encounter = expedition.encounters[expedition.index];
  const mission = getMission(encounter.missionId);
  const missing = mission.variants[encounter.variant].missing;
  const noRoute = expedition.energy < cost(mission.reference.size, mission.reference.effort);
  let hint = '';
  if (expedition.mode === 'T' && progress.settings.hints) {
    const hints = ['Los datos están escritos. Prueba Chiqui (Ligero) y esfuerzo Bajo. El tamaño del archivo no determina la dificultad.', 'Una bienvenida necesita capacidad para redactar. Prueba Medianito (Medio); el esfuerzo puede seguir en Bajo.', 'Falta la hora de llegada. Pide ese dato con Escanear antes de elegir una ruta.', 'Varias condiciones dependen entre sí. Esta vez Gigantón (Ultra) y esfuerzo Alto tienen una razón para estar aquí.'];
    hint = `<aside class="tutorial-hint">${portrait('light')}<div><strong>Chiqui te acompaña</strong><p>${hints[expedition.index]}</p><button class="text-button" data-action="hide-hints">Omitir indicaciones</button></div></aside>`;
  }
  return `<section class="decision-panel" aria-label="Tus decisiones">${hint}
    <fieldset class="card-fieldset"><legend><span class="step-number">01</span> Quién puede resolverlo <small>TAMAÑO DEL MODELO</small></legend><div class="crew-grid battle-crew">${crewCards(true, expedition)}</div></fieldset>
    <fieldset class="effort-fieldset"><legend><span class="step-number">02</span> Cuánto necesita pensar <small>ESFUERZO</small></legend><div class="effort-grid">${EFFORTS.map(id => `<button id="effort-${id}" class="effort-button ${effort === id ? 'selected' : ''}" data-action="effort" data-value="${id}" aria-pressed="${effort === id}"><span class="effort-symbol">${effortInfo[id].symbol}</span><div><strong>${effortInfo[id].label}</strong><span>${effortInfo[id].description}</span></div>${effort === id ? icon('check') : ''}</button>`).join('')}</div></fieldset>
    <div class="scan-row"><button id="scan-button" class="scan-button" data-action="scan">${icon('scan')} Escanear / pedir datos</button><span>Sin coste de energía</span></div>
    ${encounter.scanned ? `<p class="scan-status" role="status">${missing ? '✓ Hora de llegada recuperada. Ahora elige las dos cartas y ejecuta.' : '✓ El contexto ya está completo. No hace falta pedir más datos.'}</p>` : ''}
    <div class="execute-row"><div class="cost-preview"><span>COSTE PREVISTO</span><strong>${icon('bolt')}${amount ?? '—'} <small>/ ${expedition.energy}</small></strong></div><button id="execute-button" class="button primary execute-button" data-action="execute" ${!canExecute ? 'disabled' : ''}>Ejecutar ${icon('arrow')}</button></div>
    <p class="decision-footnote">${amount === null ? 'Elige un tamaño y un esfuerzo para ejecutar.' : !canExecute ? 'Energía insuficiente para esta combinación.' : 'La energía se descuenta una vez por intento, incluso si falta información.'}</p>
    ${noRoute ? `<aside class="energy-warning">${icon('bolt')}<div><strong>No queda energía para superar este encuentro.</strong><p>Puedes reiniciar ahora, sin esperar una recarga.</p><button class="text-button" data-action="restart">Reiniciar expedición</button></div></aside>` : ''}
  </section>`;
}
function result(expedition: Expedition) {
  const attempt = expedition.history.at(-1)!;
  const mission = getMission(attempt.missionId);
  const success = attempt.outcome === 'apto';
  const status = success ? 'Sistema recuperado' : attempt.outcome === 'faltan-datos' ? 'Faltan datos' : 'Resultado incompleto';
  return `<section class="result-panel ${success ? 'success' : 'needs-work'}" aria-labelledby="result-title"><div class="eyebrow">RESULTADO DEL ENCUENTRO</div><div class="result-emblem">${icon(success ? 'check' : attempt.outcome === 'faltan-datos' ? 'scan' : 'info')}</div><span class="outcome-tag">${success ? 'APTO' : attempt.outcome === 'faltan-datos' ? 'INFORMACIÓN AUSENTE' : 'INCOMPLETO'}</span><h2 id="result-title" tabindex="-1">${status}</h2><div class="selection-recap">${portrait(attempt.size)}<div><strong>${getCompanion(attempt.size).name}</strong><span>${selectionLabel(attempt)}</span></div><span class="spent-energy">−${attempt.cost} ${icon('bolt')}</span></div><p class="result-explanation">${esc(attempt.explanation)}</p>
    <details class="why-panel"><summary>Por qué ocurrió ${icon('info')}</summary><p>${mission.lesson}</p>${success ? `<p><strong>Resolución simulada:</strong> ${mission.solution[attempt.variant]}</p>` : `<p>Revisa los criterios y ajusta una o ambas variables.${attempt.outcome === 'faltan-datos' ? ' Primero solicita el horario de llegada.' : ''}</p>`}<p>La referencia de esta misión, con información completa, es ${selectionLabel(mission.reference)} (${cost(mission.reference.size, mission.reference.effort)} de energía). Las otras combinaciones definidas en el contenido también pueden ser aptas.</p></details>
    <aside class="work-note">${icon('book')}<div><strong>En tu trabajo</strong><p>${mission.work}</p></div></aside>
    <div class="result-balance"><span>ENERGÍA RESTANTE</span><strong>${expedition.energy}<small> / 100</small></strong></div>
    ${busy ? `<div class="animation-status"><span class="loading-dot"></span> Resolviendo en la órbita… <button class="text-button" data-action="skip-animation">Omitir animación</button></div>` : ''}
    <button id="result-next" class="button primary wide-button" data-action="${success ? 'advance' : 'retry'}" ${busy ? 'disabled' : ''}>${success ? expedition.index === 3 ? 'Ver mi expedición' : 'Siguiente encuentro' : attempt.outcome === 'faltan-datos' ? 'Volver y pedir datos' : 'Ajustar y reintentar'} ${icon('arrow')}</button>
    <p class="decision-footnote">${success ? 'Calidad primero. Después, el consumo.' : 'Tu selección se conserva. Puedes cambiar una variable y probar de nuevo.'}</p></section>`;
}
function battle() {
  const expedition = progress.active!;
  const current = expedition.encounters[expedition.index];
  return `<main id="main-content" class="battle-page"><div class="expedition-bar"><div><button class="text-button" data-action="home">${icon('home')} La nave</button><span class="bar-divider">/</span><strong>Órbita Cero</strong><span class="training-label">${expedition.mode === 'T' ? 'PRIMERA EXPEDICIÓN' : 'SIMULACIÓN'}</span></div><button class="text-button restart-button" data-action="restart">${icon('restart')} Reiniciar</button></div>
    <div class="expedition-status"><div class="encounter-track" aria-label="Encuentro ${expedition.index + 1} de 4">${expedition.encounters.map((encounter, index) => `<div class="encounter-node ${index < expedition.index ? 'done' : ''} ${index === expedition.index ? 'current' : ''}"><span>${index < expedition.index ? icon('check') : `0${index + 1}`}</span><small>${index === 3 ? 'NÚCLEO' : getMission(encounter.missionId).system.split(' ')[0]}</small></div>`).join('')}</div><div class="energy-indicator"><div><span>${icon('bolt')} ENERGÍA</span><strong id="energy-value">${expedition.energy}<small> / 100</small></strong></div><div class="energy-track" role="progressbar" aria-label="Energía disponible" aria-valuenow="${expedition.energy}" aria-valuemin="0" aria-valuemax="100"><span style="width:${expedition.energy}%"></span></div></div></div>
    <div class="combat-grid">${missionPanel(expedition)}${expedition.phase === 'result' ? result(expedition) : controls(expedition)}</div>
    <div class="combat-bottom"><span>${challengeCode(expedition)} · CONTENIDO V${expedition.version}</span><span>ENCUENTRO ${expedition.index + 1}/4 · ${getMission(current.missionId).system.toUpperCase()}</span></div></main>`;
}
function summary() {
  const expedition = progress.active!;
  const earnedStars = stars(expedition);
  const decisions = expedition.history.filter(a => a.outcome === 'apto');
  const remembered = [decisions[0], decisions.find(a => a.missionId === 'MIS-05') ?? decisions[2]];
  const reward = rewards[Math.min(progress.completed, rewards.length) - 1];
  return `<main id="main-content" class="summary-page"><section class="victory-header"><div class="eyebrow">EXPEDICIÓN COMPLETADA · ÓRBITA CERO</div><div class="stars" aria-label="${earnedStars} de 3 estrellas">${[1, 2, 3].map(n => `<span class="${n <= earnedStars ? 'earned' : ''}">${icon('star')}</span>`).join('')}</div><h1 id="summary-title" tabindex="-1">${progress.completed === 1 ? 'Una órbita más libre.' : 'Tu criterio llega más lejos.'}</h1><p>${progress.completed === 1 ? 'Cuatro sistemas recuperados. Un fragmento del camino a casa.' : 'Simulación completada. Cada decisión tiene una razón.'}</p><div class="summary-stats"><div><strong>4/4</strong><span>SISTEMAS</span></div><div><strong>${100 - expedition.energy}</strong><span>ENERGÍA USADA</span></div><div><strong>${expedition.history.length}</strong><span>INTENTOS</span></div></div></section>
    <div class="summary-grid"><section class="summary-details"><h2>Cada estrella cuenta.</h2><ul class="star-criteria"><li class="achieved">${icon('check')}<div><strong>La misión, primero</strong><span>Completaste los cuatro encuentros.</span></div></li><li class="${earnedStars >= 2 ? 'achieved' : ''}">${icon(earnedStars >= 2 ? 'check' : 'info')}<div><strong>Buen criterio desde el inicio</strong><span>${earnedStars >= 2 ? 'Sin intentos incompletos ni ejecuciones sin datos.' : 'Hubo un reintento o una ejecución sin datos. Pedirlos antes sí cuenta.'}</span></div></li><li class="${earnedStars === 3 ? 'achieved' : ''}">${icon(earnedStars === 3 ? 'check' : 'info')}<div><strong>Energía bien invertida</strong><span>Sin fallos y como máximo ${efficientBudget(expedition)} de energía. Usaste ${100 - expedition.energy}.</span></div></li></ul><h2>Dos decisiones para recordar</h2><div class="remembered-decisions">${remembered.map(attempt => `<article><span class="eyebrow">${getMission(attempt.missionId).system}</span><h3>${selectionLabel(attempt)}</h3><p>${getMission(attempt.missionId).lesson}</p></article>`).join('')}</div></section>
    <aside class="reward-panel"><div class="eyebrow">${progress.completed <= 6 ? 'HALLAZGO DESBLOQUEADO' : 'TU ÚLTIMO HALLAZGO'}</div><div class="reward-art"><div id="space-slot" class="space-slot"></div><span class="reward-symbol">${reward.icon}</span></div><h2>${reward.name}</h2><p>${reward.description}</p><div class="kael-quote"><span>KAEL, CAPITÁN RIVAL</span>“${progress.completed === 1 ? 'Yo usé el máximo en todo… y me quedé sin energía antes del portal.' : 'Creo que empiezo a entenderlo. La mejor elección depende de la tarea.'}”</div></aside></div>
    <div class="summary-actions"><button class="button primary" data-action="play">Volver a explorar ${icon('arrow')}</button><button class="button secondary" data-action="copy-result">${icon('copy')} Copiar resultado</button><button class="text-button" data-action="home">Volver a la nave</button></div><p class="share-code">Tu desafío: <button class="text-button" data-action="copy-code">${challengeCode(expedition)}</button> · Contenido v${expedition.version}</p></main>`;
}
function footer() {
  return `<footer class="site-footer"><span>✦ <strong>NOVA ARENA</strong> · Elige con criterio.</span><span>Entrenamiento ficticio · Sin conexión a modelos reales</span><button class="text-button" data-action="about">Acerca del juego ${icon('info')}</button></footer>`;
}
function render(focusId?: string) {
  app.dataset.motion = reduced() ? 'reduced' : 'full';
  app.innerHTML = `<a class="skip-link" href="#main-content">Saltar al contenido</a>${header()}${!storageAvailable ? '<div class="storage-warning" role="status">El progreso se conserva solo en esta sesión: el almacenamiento local no está disponible.</div>' : ''}${screen === 'home' ? home() : screen === 'intro' ? intro() : screen === 'battle' ? battle() : summary()}${footer()}`;
  const slot = app.querySelector<HTMLElement>('#space-slot');
  if (slot) {
    try {
      space ??= createSpace(slot);
      space.mount(slot, { view: screen === 'battle' ? 'battle' : screen === 'summary' ? 'summary' : 'home', selected: progress.active?.selection.size ?? 'light', mission: progress.active?.encounters[progress.active.index].missionId, reduced: reduced(), special: progress.rewards.includes('comet') });
    } catch {
      slot.innerHTML = portrait(progress.active?.selection.size ?? 'light', 'space-fallback');
    }
  }
  if (focusId) document.getElementById(focusId)?.focus({ preventScroll: true });
}
function navigate(next: typeof screen, focusId?: string) { screen = next; render(focusId); window.scrollTo({ top: 0, behavior: 'instant' }); }
function closeDialog() {
  activeDialog?.close(); activeDialog?.remove(); activeDialog = null; pendingConfirm = null;
}
function modal(title: string, contents: string) {
  closeDialog();
  const dialog = document.createElement('dialog');
  dialog.className = 'modal';
  dialog.setAttribute('aria-labelledby', 'dialog-title');
  dialog.innerHTML = `<div class="modal-header"><h2 id="dialog-title">${title}</h2><button class="icon-button" data-action="close-dialog" aria-label="Cerrar">${icon('close')}</button></div>${contents}`;
  document.body.append(dialog); activeDialog = dialog;
  dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(); } });
  dialog.showModal();
}
function confirm(title: string, description: string, label: string, action: () => void) {
  modal(title, `<p>${description}</p><div class="modal-actions"><button class="button secondary" data-action="close-dialog" autofocus>Cancelar</button><button class="button primary" data-action="confirm">${label}</button></div>`);
  pendingConfirm = action;
}
function settings() {
  modal('Ajustes de la nave', `<p class="modal-intro">Tú marcas el ritmo. Tus preferencias se guardan en este dispositivo.</p><div class="settings-list"><label><div><strong>Sonido</strong><span>Señales suaves al elegir y resolver. Desactivado al inicio.</span></div><input type="checkbox" data-setting="sound" ${progress.settings.sound ? 'checked' : ''} /></label><label><div><strong>Movimiento reducido</strong><span>Ilustraciones estáticas y resultados inmediatos.${systemMotion.matches ? ' Tu dispositivo ya solicita movimiento reducido.' : ''}</span></div><input type="checkbox" data-setting="reducedMotion" ${progress.settings.reducedMotion ? 'checked' : ''} /></label><label><div><strong>Ayuda de Chiqui</strong><span>Indicaciones breves durante la primera expedición.</span></div><input type="checkbox" data-setting="hints" ${progress.settings.hints ? 'checked' : ''} /></label></div><div class="danger-zone"><strong>Progreso local</strong><p>Expediciones, hallazgos y ajustes viven en este navegador.</p><button class="button danger" data-action="reset-progress">Borrar todo el progreso</button></div>`);
}
function guide() {
  modal('Dos decisiones. Una misión.', `<div class="guide-steps"><article><span>01</span><div><h3>Lee la tarea, no el tamaño del enemigo.</h3><p>El contexto y los criterios dicen qué necesitas resolver. No hay temporizador.</p></div></article><article><span>02</span><div><h3>Elige quién puede resolverlo.</h3><p>Ligero, Medio, Grande o Ultra: capacidad para el tipo de tarea. Todos siguen siendo útiles.</p></div></article><article><span>03</span><div><h3>Decide cuánto necesita pensar.</h3><p>Bajo, Medio o Alto: profundidad del análisis. Es independiente del tamaño.</p></div></article><article><span>04</span><div><h3>Pide datos si falta información.</h3><p>Escanear es gratis. Aumentar capacidad o esfuerzo no inventa un dato ausente.</p></div></article></div><p class="info-callout">Empiezas con 100 de energía para cuatro encuentros. Primero cumple los criterios; después valora el ahorro. Puedes reintentar o reiniciar sin esperas.</p><button class="button primary wide-button" data-action="close-dialog">Entendido ${icon('check')}</button>`);
}
function collection() {
  modal('Tu bitácora de hallazgos', `<p class="modal-intro">Seis expediciones, seis recuerdos. Son cosméticos: las reglas y costes siempre son los mismos.</p><div class="collection-grid">${rewards.map((reward, index) => `<article class="collection-item ${progress.rewards.includes(reward.id) ? 'unlocked' : ''}"><span>${reward.icon}</span><div><h3>${reward.name}</h3><p>${progress.rewards.includes(reward.id) ? reward.description : `Se desbloquea al completar ${index + 1} expediciones.`}</p></div>${progress.rewards.includes(reward.id) ? icon('check') : `<small>${index + 1}</small>`}</article>`).join('')}</div><p class="info-callout">${progress.attempts.length} decisiones registradas localmente. El entrenamiento adapta variantes para practicar principios que dieron lugar a un reintento.</p>`);
}
function start(mode: 'play' | 'daily' | 'challenge', code?: string) {
  let seed: number;
  let expeditionMode: 'T' | 'P' = 'P';
  if (mode === 'challenge') {
    const parsed = parseChallenge(code ?? ''); seed = parsed.seed; expeditionMode = parsed.mode;
  } else if (mode === 'daily') seed = dailySeed();
  else if (!progress.tutorialCompleted) { seed = 0x4e4f5641; expeditionMode = 'T'; }
  else {
    const failure = [...progress.attempts].reverse().find(a => a.outcome !== 'apto');
    seed = practiceSeed(crypto.getRandomValues(new Uint32Array(1))[0], failure?.missionId, failure ? progress.lastVariants[failure.missionId] : undefined);
  }
  const launch = () => {
    clearAnimation();
    progress.active = createExpedition(seed, expeditionMode); persist();
    introIndex = 0;
    navigate(expeditionMode === 'T' && mode === 'play' ? 'intro' : 'battle', expeditionMode === 'T' && mode === 'play' ? 'intro-title' : 'mission-title');
  };
  if (progress.active && progress.active.phase !== 'complete') confirm('¿Iniciar otra expedición?', 'Se sustituirá la expedición en curso. Tus hallazgos y ajustes se conservan.', 'Iniciar otra', launch);
  else { closeDialog(); launch(); }
}
function clearAnimation() { if (animationTimer) clearTimeout(animationTimer); animationTimer = null; busy = false; }
function executeAction() {
  const expedition = progress.active;
  if (!expedition || busy) return;
  const { size, effort } = expedition.selection;
  if (!size || !effort) return;
  const resolution = execute(expedition, { size, effort }, crypto.randomUUID());
  if (!resolution.accepted) { toast(resolution.reason); return; }
  progress.active = resolution.expedition;
  progress.attempts = [...progress.attempts, resolution.attempt].slice(-200);
  progress.lastVariants[resolution.attempt.missionId] = resolution.attempt.variant;
  persist(); // Persist before visual resolution. Reload cannot execute or charge again.
  busy = !reduced(); render('result-title'); space?.pulse();
  sound(resolution.attempt.outcome === 'apto' ? 'success' : 'failure');
  if (busy) animationTimer = setTimeout(() => { busy = false; render('result-next'); }, 1000);
}
function advanceAction() {
  if (!progress.active || busy) return;
  const oldPhase = progress.active.phase;
  progress.active = advance(progress.active);
  if (oldPhase !== 'complete' && progress.active.phase === 'complete') {
    progress.completed++;
    progress.bestStars = Math.max(progress.bestStars, stars(progress.active));
    if (progress.active.mode === 'T') progress.tutorialCompleted = true;
    const reward = rewards[progress.completed - 1];
    if (reward && !progress.rewards.includes(reward.id)) progress.rewards.push(reward.id);
    persist(); navigate('summary', 'summary-title');
  } else { persist(); render('mission-title'); window.scrollTo({ top: 0, behavior: 'instant' }); }
}
async function copy(text: string) {
  try { await navigator.clipboard.writeText(text); toast('Copiado. Compártelo cuando quieras.'); }
  catch { modal('Tu texto para compartir', `<p>Puedes seleccionar y copiar este texto.</p><textarea class="copy-text" readonly aria-label="Texto para compartir">${esc(text)}</textarea>`); activeDialog?.querySelector('textarea')?.select(); }
}
document.addEventListener('click', event => {
  const button = (event.target as Element).closest<HTMLElement>('[data-action]');
  if (!button || button.hasAttribute('disabled')) return;
  const action = button.dataset.action;
  if (button.tagName === 'A') event.preventDefault();
  switch (action) {
    case 'home': navigate('home'); break;
    case 'guide': guide(); break;
    case 'settings': settings(); break;
    case 'sound': progress.settings.sound = !progress.settings.sound; persist(); sound('select'); render(); break;
    case 'close-dialog': closeDialog(); break;
    case 'confirm': { const accepted = pendingConfirm; closeDialog(); accepted?.(); break; }
    case 'play': start('play'); break;
    case 'daily': start('daily'); break;
    case 'resume': navigate(progress.active?.phase === 'complete' ? 'summary' : 'battle', 'mission-title'); break;
    case 'intro-next': if (introIndex < 3) { introIndex++; render('intro-title'); } else navigate('battle', 'mission-title'); break;
    case 'intro-skip': navigate('battle', 'mission-title'); break;
    case 'size': case 'effort': {
      const expedition = progress.active;
      if (!expedition || expedition.phase !== 'choosing') break;
      if (action === 'size') expedition.selection.size = button.dataset.value as Size;
      else expedition.selection.effort = button.dataset.value as Effort;
      persist(); sound('select'); render(button.id); break;
    }
    case 'scan': {
      if (!progress.active) break;
      progress.active = scan(progress.active); persist(); sound('scan'); render('scan-button');
      const encounter = progress.active.encounters[progress.active.index];
      toast(getMission(encounter.missionId).variants[encounter.variant].missing ? 'Hora de llegada recuperada. El dato ya está en el contexto.' : 'El contexto ya está completo. No se necesitan más datos.'); break;
    }
    case 'hide-hints': progress.settings.hints = false; persist(); render('size-light'); break;
    case 'execute': executeAction(); break;
    case 'skip-animation': clearAnimation(); render('result-next'); break;
    case 'advance': advanceAction(); break;
    case 'retry': if (progress.active && !busy) { progress.active = retry(progress.active); persist(); render('size-' + (progress.active.selection.size ?? 'light')); } break;
    case 'restart': if (progress.active) {
      const { seed, mode } = progress.active;
      confirm('¿Reiniciar esta expedición?', 'Volverás al primer encuentro con 100 de energía y el mismo contenido. Tus intentos anteriores seguirán en la bitácora de aprendizaje.', 'Reiniciar', () => { clearAnimation(); progress.active = createExpedition(seed, mode); persist(); navigate('battle', 'mission-title'); });
      break;
    } break;
    case 'reset-progress': confirm('¿Borrar todo el progreso?', 'Se borrarán la expedición en curso, las decisiones guardadas, los seis hallazgos y tus ajustes de este navegador. Esta acción no se puede deshacer.', 'Sí, borrar todo', () => { clearAnimation(); progress = initialProgress(); persist(); navigate('home'); toast('Progreso borrado. Tu próxima aventura empieza de cero.'); }); break;
    case 'collection': collection(); break;
    case 'challenge': modal('Un desafío entre capitanes', `<p>Un mismo código reconstruye los mismos encuentros y variantes, aunque juegues en otra zona horaria.</p><form id="challenge-form"><label class="input-label" for="challenge-code">Código de desafío</label><input id="challenge-code" name="code" class="code-input" placeholder="NOVA1-P-12AB34CD" autocomplete="off" spellcheck="false" required /><p id="code-error" class="form-error" role="alert"></p><button class="button primary wide-button" type="submit">Abrir desafío ${icon('arrow')}</button></form>`); break;
    case 'copy-result': if (progress.active) void copy(shareResult(progress.active)); break;
    case 'copy-code': if (progress.active) void copy(challengeCode(progress.active)); break;
    case 'about': modal('Un universo para practicar', `<p>NOVA ARENA es una simulación educativa de aventura espacial. Sus tamaños, costes y reglas son ficticios: no miden modelos, precios ni rendimiento de proveedores reales.</p><p>La resolución usa contenido redactado y reglas estables. No hay llamadas a IA, cuentas, anuncios ni compras. El juego no transmite tu progreso; se guarda en este dispositivo.</p><p>Versión de contenido: 1 · Seis misiones, doce combinaciones y seis hallazgos cosméticos.</p><p>Los resultados de aprendizaje y el ritmo de juego todavía deben comprobarse con jugadores.</p>`); break;
  }
});
document.addEventListener('submit', event => {
  const form = event.target as HTMLFormElement;
  if (form.id !== 'challenge-form') return;
  event.preventDefault();
  try { start('challenge', String(new FormData(form).get('code') ?? '')); }
  catch (error) { document.getElementById('code-error')!.textContent = (error as Error).message; }
});
document.addEventListener('change', event => {
  const input = event.target as HTMLInputElement;
  const setting = input.dataset.setting as keyof typeof progress.settings | undefined;
  if (!setting || !(setting in progress.settings)) return;
  progress.settings[setting] = input.checked; persist(); render();
  if (setting === 'sound') sound('select');
});
systemMotion.addEventListener('change', () => render());
render();
if (loaded.notice) toast(loaded.notice);
