/** Initiales du pseudo (2 lettres max, sans accents). */
export function pseudoInitials(name: string): string {
  const clean = name.replace(/\s*\(toi\)\s*/gi, '').trim()
  const ascii = clean.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const letters = ascii.replace(/[^a-zA-Z]/g, '')
  if (letters.length >= 2) return letters.slice(0, 2).toUpperCase()
  if (letters.length === 1) return letters.toUpperCase()
  return '?'
}

/** Couleur de fond stable par pseudo. */
export function pseudoColor(userId: string): string {
  const hues = [195, 260, 320, 45, 160, 210, 280, 25, 140, 350]
  const h = hues[Math.abs(hash(userId)) % hues.length]
  return `hsl(${h} 45% 28%)`
}

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i)
  return h
}
