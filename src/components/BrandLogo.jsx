export default function BrandLogo({ size = 32, dark = true, className = '' }) {
  return (
    <div
      className={'font-extrabold tracking-tight leading-none ' + className}
      style={{ fontSize: size, color: dark ? '#f8f8f8' : '#0f172a' }}
    >
      ting<span style={{ color: '#0082ff' }}>sync</span>
    </div>
  )
}
