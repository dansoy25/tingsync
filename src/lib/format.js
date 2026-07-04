export const money = (n) =>
  '₱' +
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export const timePH = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Manila',
  })
}

export const longDate = (d) => {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00+08:00') : d
  return date.toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  })
}

export const shortDate = (d) => {
  if (!d) return '—'
  const date = typeof d === 'string' ? new Date(d + 'T00:00:00+08:00') : d
  return date.toLocaleDateString('en-PH', {
    month: 'short',
    day: 'numeric',
    timeZone: 'Asia/Manila',
  })
}

export const initials = (name = '') =>
  name
    .split(' ')
    .map((s) => s[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

const AVATAR_COLORS = [
  { bg: '#dbeafe', text: '#1d4ed8' },
  { bg: '#fce7f3', text: '#be185d' },
  { bg: '#dcfce7', text: '#15803d' },
  { bg: '#fef3c7', text: '#a16207' },
  { bg: '#ede9fe', text: '#6d28d9' },
  { bg: '#fee2e2', text: '#b91c1c' },
  { bg: '#cffafe', text: '#0e7490' },
  { bg: '#fed7aa', text: '#9a3412' },
]
export const avatarColor = (name = '') => {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

export const hm = (hours) => {
  if (hours == null) return '0:00'
  const h = Math.floor(hours)
  const m = Math.round((hours - h) * 60)
  return `${h}:${String(m).padStart(2, '0')}`
}
