export function sanitizeFen(rawFen: string): string {
  const parts = rawFen.trim().split(/\s+/)
  while (parts.length < 6) parts.push('-')
  const ep = parts[3]
  if (!/^[a-h][36]$/.test(ep)) parts[3] = '-'
  return parts.slice(0, 6).join(' ')
}

export const mirror = (i: number) => 7 - i
