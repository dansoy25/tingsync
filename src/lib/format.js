// Display currency symbol — swapped by the topbar ₱/$ toggle (display only, no FX conversion)
let CURRENCY_SYMBOL = localStorage.getItem('ts_currency') === 'USD' ? '$' : '₱'
export const setCurrencySymbol = (code) => {
  CURRENCY_SYMBOL = code === 'USD' ? '$' : '₱'
  localStorage.setItem('ts_currency', code)
}
export const currencyCode = () => (CURRENCY_SYMBOL === '$' ? 'USD' : 'PHP')

export const money = (n) =>
  CURRENCY_SYMBOL +
  Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export const moneyShort = (n) => {
  const v = Number(n || 0)
  if (v >= 1_000_000) return CURRENCY_SYMBOL + (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (v >= 1_000) return CURRENCY_SYMBOL + (v / 1_000).toFixed(1).replace(/\.0$/, '') + 'K'
  return CURRENCY_SYMBOL + v.toLocaleString('en-US', { maximumFractionDigits: 0 })
}

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
