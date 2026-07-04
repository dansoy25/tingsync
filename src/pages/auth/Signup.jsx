import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import AuthShell from './AuthShell'

export default function Signup() {
  const { signUp } = useAuth()
  const nav = useNavigate()
  const [businessName, setBusinessName] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [needsConfirm, setNeedsConfirm] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) return setError('Passwords do not match.')
    if (password.length < 6) return setError('Password must be at least 6 characters.')
    setBusy(true)
    try {
      const result = await signUp(email.trim(), password)
      if (result.session) {
        nav('/onboarding', { state: { businessName, fullName }, replace: true })
      } else {
        setNeedsConfirm(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (needsConfirm) {
    return (
      <AuthShell>
        <h1 className="text-lg font-bold text-center tracking-tight">Check your email</h1>
        <p className="text-[13px] text-muted text-center mt-2">
          We sent a confirmation link to <span className="font-medium text-ink">{email}</span>. Click it, then log in to finish setting up {businessName}.
        </p>
        <Link
          to="/login"
          className="brand-btn w-full flex items-center justify-center text-white text-sm font-semibold rounded-lg py-3 mt-6"
        >
          Back to log in
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell>
      <h1 className="text-lg font-bold text-center tracking-tight">Create your account</h1>
      <p className="text-[13px] text-muted text-center mt-2 mb-6">Start managing your team in minutes.</p>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {error && <div className="text-[12px] text-red bg-red-tint border border-red/20 rounded-md px-3 py-2">{error}</div>}
        <Field label="Business name">
          <input required value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Acme Trading Corp." className={inputCls} />
        </Field>
        <Field label="Your full name">
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Maria Dela Cruz" className={inputCls} />
        </Field>
        <Field label="Work email">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Password">
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls + ' pr-9'} />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-faint">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>
          <Field label="Confirm">
            <input type={showPw ? 'text' : 'password'} required value={confirm} onChange={(e) => setConfirm(e.target.value)} className={inputCls} />
          </Field>
        </div>
        <button type="submit" disabled={busy} className="brand-btn text-white text-sm font-semibold rounded-lg py-3 mt-1.5 disabled:opacity-60">
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <div className="text-center text-xs text-muted mt-6">
        Already have an account? <Link to="/login" className="font-medium text-brand">Log in</Link>
      </div>
    </AuthShell>
  )
}

const inputCls =
  'w-full text-[13px] px-3 py-2.5 border border-[#5E91F6] rounded-lg shadow-[0_4px_12px_rgba(0,0,0,.15)] outline-none focus:ring-2 focus:ring-brand/20'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-soft mb-1.5 block">{label}</span>
      {children}
    </label>
  )
}
