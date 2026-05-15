// Lightweight confirmation chime via the Web Audio API — no audio asset needed.

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

/** Short rising two-note chime to confirm an egg was logged. */
export function playConfirmSound(): void {
  const c = getCtx()
  if (!c) return
  if (c.state === 'suspended') void c.resume()

  const now = c.currentTime
  const gain = c.createGain()
  gain.connect(c.destination)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.38)

  const osc = c.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(880, now) // A5
  osc.frequency.setValueAtTime(1318.51, now + 0.1) // E6
  osc.connect(gain)
  osc.start(now)
  osc.stop(now + 0.4)
}
