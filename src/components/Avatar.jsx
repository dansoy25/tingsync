import { initials, avatarColor } from '../lib/format'

export default function Avatar({ name, src, size = 32, className = '' }) {
  const dim = { width: size, height: size }
  if (src) {
    return (
      <img
        src={src}
        alt={name || ''}
        className={'rounded-full object-cover shrink-0 bg-bg-tint ' + className}
        style={dim}
        loading="lazy"
      />
    )
  }
  const c = avatarColor(name)
  return (
    <div
      className={'rounded-full flex items-center justify-center font-semibold shrink-0 ' + className}
      style={{ ...dim, background: c.bg, color: c.text, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </div>
  )
}
