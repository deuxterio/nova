const paths: Record<string, string> = {
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron: '<path d="m9 5 7 7-7 7"/>',
  bolt: '<path d="m13 2-9 12h7l-1 8 10-12h-7l0-8Z"/>',
  settings: '<path d="m9 3 1-1h4l1 1 1 3 3 1 2 3v4l-2 3-3 1-1 3-1 1h-4l-1-1-1-3-3-1-2-3v-4l2-3 3-1Z"/><circle cx="12" cy="12" r="3"/>',
  sound: '<path d="M4 9h4l5-4v14l-5-4H4Z"/><path d="M17 8a7 7 0 0 1 0 8m3-11a11 11 0 0 1 0 14"/>',
  mute: '<path d="M4 9h4l5-4v14l-5-4H4Z"/><path d="m17 9 5 6m0-6-5 6"/>',
  scan: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5M7 12h10"/><circle cx="12" cy="12" r="3"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  restart: '<path d="M3 9a9 9 0 1 1 0 7M3 3v6h6"/>',
  copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M15 8V3H3v13h5"/>',
  home: '<path d="m3 11 9-8 9 8v10h-6v-7H9v7H3Z"/>',
  book: '<path d="M12 5v16M3 3l9 2 9-2v16l-9 2-9-2Z"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/>',
  star: '<path d="m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z"/>',
};
export const icon = (name: string) => `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] ?? paths.info}</svg>`;
export const novaMark = '<svg class="nova-mark" viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="m20 2 5 13 13 5-13 5-5 13-5-13-13-5 13-5Z" fill="currentColor"/><circle cx="20" cy="20" r="4" fill="#0b1222"/></svg>';
