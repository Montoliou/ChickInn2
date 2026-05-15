// Confirmation feedback for logging an egg: a swelling tone that lands on a
// low "womp", plus a vibration pulse where the platform supports it.

let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!ctx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  }
  return ctx
}

/** Call inside a user gesture (e.g. pointerdown) so iOS unlocks audio playback. */
export function primeAudio(): void {
  const c = getCtx()
  if (c && c.state === 'suspended') void c.resume()
}

/** A tone that swells up, then bends sharply down into a "womp". */
export function playConfirmSound(): void {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') void c.resume()
  const t = c.currentTime

  // Swell — rises in pitch and grows louder.
  const swellGain = c.createGain()
  swellGain.connect(c.destination)
  swellGain.gain.setValueAtTime(0.0001, t)
  swellGain.gain.exponentialRampToValueAtTime(0.3, t + 0.5)
  swellGain.gain.exponentialRampToValueAtTime(0.06, t + 0.6)

  const swell = c.createOscillator()
  swell.type = 'triangle'
  swell.frequency.setValueAtTime(240, t)
  swell.frequency.exponentialRampToValueAtTime(680, t + 0.52)
  swell.connect(swellGain)
  swell.start(t)
  swell.stop(t + 0.62)

  // Womp — a fat tone that drops hard to a low note to finish.
  const wompGain = c.createGain()
  wompGain.connect(c.destination)
  wompGain.gain.setValueAtTime(0.0001, t + 0.5)
  wompGain.gain.exponentialRampToValueAtTime(0.42, t + 0.58)
  wompGain.gain.exponentialRampToValueAtTime(0.0001, t + 1.05)

  const womp = c.createOscillator()
  womp.type = 'sawtooth'
  womp.frequency.setValueAtTime(360, t + 0.5)
  womp.frequency.exponentialRampToValueAtTime(90, t + 0.98)
  womp.connect(wompGain)
  womp.start(t + 0.5)
  womp.stop(t + 1.08)
}

/**
 * Vibration pulse shaped like the swell + womp. Works on Android browsers;
 * iOS Safari does not expose the Vibration API, so it is a no-op there.
 */
export function confirmVibrate(): void {
  try {
    navigator.vibrate?.([35, 45, 120])
  } catch {
    /* ignore */
  }
}
