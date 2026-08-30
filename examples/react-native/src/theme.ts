export const colors = {
  background: '#0b0f19',
  surface: '#151b2b',
  surfaceStrong: '#1e2740',
  border: '#26314d',
  text: '#f2f5ff',
  textMuted: '#8e9bbd',
  accent: '#6c7bff',
  accentSoft: '#2a3160',
  danger: '#ff5a6e',
  success: '#3ddc97',
}

export const radius = {
  small: 10,
  medium: 16,
  large: 28,
}

/**
 * Turns a level in dBFS into a 0..1 ratio a bar can be drawn with
 * @param volume - The level to convert, -Infinity for silence
 * @param floor - The level shown as an empty bar
 */
export function volumeRatio(volume: number, floor = -60): number {
  if (!isFinite(volume)) return 0
  return Math.max(0, Math.min(1, (volume - floor) / -floor))
}
