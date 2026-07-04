import { useEffect } from 'react'

export default function Modal({ title, subtitle, onClose, children, footer }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}
    >
      <div className="absolute inset-0 bg-black/45" />
      <div className="relative w-full max-w-[460px] max-h-[90dvh] bg-white rounded-2xl shadow-[0_24px_60px_rgba(15,23,42,0.32)] flex flex-col animate-fadeIn">
        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-border shrink-0">
          <div>
            <div className="text-[17px] font-bold">{title}</div>
            {subtitle && <div className="text-[13px] text-muted mt-0.5">{subtitle}</div>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="border-none bg-bg-tint w-8 h-8 rounded-[10px] flex items-center justify-center text-muted hover:bg-border shrink-0"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-border shrink-0">{footer}</div>}
      </div>
    </div>
  )
}

export function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="text-xs font-medium text-ink-soft mb-1.5 block">{label}</span>
      {children}
    </label>
  )
}
