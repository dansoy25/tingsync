export { default as Avatar } from '../components/Avatar'

const STATUS = {
  present: { bg: '#ecfdf5', fg: '#10b981', label: 'Present' },
  ongoing: { bg: '#ecfdf5', fg: '#10b981', label: 'Present' },
  late: { bg: '#fffbeb', fg: '#f59e0b', label: 'Late' },
  absent: { bg: '#f3f6fb', fg: '#94a3b8', label: 'Absent' },
  on_leave: { bg: '#eff6ff', fg: '#2563eb', label: 'On leave' },
  active: { bg: '#ecfdf5', fg: '#10b981', label: 'Active' },
  inactive: { bg: '#f3f6fb', fg: '#94a3b8', label: 'Inactive' },
  in_stock: { bg: '#ecfdf5', fg: '#10b981', label: 'In stock' },
  low: { bg: '#fffbeb', fg: '#f59e0b', label: 'Low stock' },
  critical: { bg: '#fef2f2', fg: '#ef4444', label: 'Critical' },
  pending: { bg: '#fffbeb', fg: '#f59e0b', label: 'Pending' },
  approved: { bg: '#ecfdf5', fg: '#10b981', label: 'Approved' },
  rejected: { bg: '#fef2f2', fg: '#ef4444', label: 'Rejected' },
  draft: { bg: '#f3f6fb', fg: '#94a3b8', label: 'Draft' },
  locked: { bg: '#ecfdf5', fg: '#10b981', label: 'Locked' },
  todo: { bg: '#f3f6fb', fg: '#94a3b8', label: 'To do' },
  in_progress: { bg: '#eff6ff', fg: '#2563eb', label: 'In progress' },
  done: { bg: '#ecfdf5', fg: '#10b981', label: 'Done' },
  high: { bg: '#fef2f2', fg: '#ef4444', label: 'High' },
  medium: { bg: '#fffbeb', fg: '#f59e0b', label: 'Medium' },
  low_priority: { bg: '#f3f6fb', fg: '#64748b', label: 'Low' },
}

export function Pill({ kind, children }) {
  const s = STATUS[kind] || { bg: '#f3f6fb', fg: '#475569', label: children }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ background: s.bg, color: s.fg }}
    >
      {children || s.label}
    </span>
  )
}

export function Card({ children, className = '' }) {
  return (
    <div className={'bg-white border border-border rounded-lg shadow-soft-pop ' + className}>
      {children}
    </div>
  )
}

// Teal gradient card header from the new design
export function CardHead({ title, sub, right, className = '' }) {
  return (
    <div className={'card-head-teal flex items-center justify-between px-4 py-3.5 rounded-t-lg ' + className}>
      <div>
        <div className="text-[13px] font-semibold">{title}</div>
        {sub && <div className="text-[11px] text-white/70">{sub}</div>}
      </div>
      {right}
    </div>
  )
}

export function Button({ children, variant = 'default', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center gap-1.5 rounded-md font-medium transition-colors whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    default: 'bg-white border border-border text-ink hover:bg-bg-soft',
    primary: 'brand-btn text-white border border-brand shadow-[0_4px_12px_rgba(37,99,235,.25)]',
    ghost: 'border-transparent bg-transparent hover:bg-bg-soft',
    danger: 'bg-white border border-border text-red hover:bg-red-tint hover:border-red',
  }
  const sizes = {
    sm: 'px-2.5 py-1.5 text-xs',
    md: 'px-3 py-2 text-[13px]',
    lg: 'px-4 py-2.5 text-sm font-semibold',
  }
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}

export function Input({ className = '', ...props }) {
  return (
    <input
      className={'block w-full px-2.5 py-2 border border-border rounded-md text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition ' + className}
      {...props}
    />
  )
}

export function Select({ children, className = '', ...props }) {
  return (
    <select
      className={'block w-full px-2.5 py-2 border border-border rounded-md text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 bg-white transition ' + className}
      {...props}
    >
      {children}
    </select>
  )
}

export function Label({ children }) {
  return <label className="block text-xs font-medium text-ink-soft mb-1.5">{children}</label>
}

export function EmptyState({ icon: Icon, title, sub }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center gap-2">
      {Icon && <Icon className="w-8 h-8 text-faint mb-1" />}
      <div className="text-sm font-semibold text-ink-soft">{title}</div>
      {sub && <div className="text-xs text-faint max-w-xs">{sub}</div>}
    </div>
  )
}
