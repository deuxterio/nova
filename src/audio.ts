let context: AudioContext | null = null;
export function playSignal(type: 'select' | 'success' | 'failure' | 'scan', enabled: boolean) {
  if (!enabled) return;
  try {
    context ??= new AudioContext();
    void context.resume();
    const notes = type === 'success' ? [392, 494, 587] : type === 'failure' ? [220, 174] : type === 'scan' ? [440, 660] : [460];
    notes.forEach((frequency, index) => {
      const oscillator = context!.createOscillator();
      const gain = context!.createGain();
      const start = context!.currentTime + index * 0.09;
      oscillator.type = 'sine'; oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.045, start + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.18);
      oscillator.connect(gain); gain.connect(context!.destination);
      oscillator.start(start); oscillator.stop(start + 0.2);
    });
  } catch { /* Audio is optional; browsers may block it without a user gesture. */ }
}
