import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import BrandLogo from '../../components/BrandLogo'
import AuthShell from './AuthShell'

export default function Login() {
  const { signIn } = useAuth()
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signIn(email.trim(), password)
      nav('/', { replace: true })
    } catch (err) {
      setError(err.message === 'Invalid login credentials' ? 'Incorrect email or password.' : err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="text-lg font-bold text-center tracking-tight">Log in to your workspace</h1>
      <p className="text-[13px] text-muted text-center mt-2 mb-7">Welcome back. Enter your credentials to continue.</p>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {error && <div className="text-[12px] text-red bg-red-tint border border-red/20 rounded-md px-3 py-2">{error}</div>}
        <div>
          <div className="text-xs font-medium mb-2">Email</div>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full text-[13px] px-3 py-2.5 border border-[#5E91F6] rounded-lg shadow-[0_4px_12px_rgba(0,0,0,.15)] outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium">Password</span>
            <Link to="/forgot-password" className="text-[11px] font-medium text-brand">Forgot password?</Link>
          </div>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              className="w-full text-[13px] px-3 py-2.5 border border-[#5E91F6] rounded-lg shadow-[0_4px_12px_rgba(0,0,0,.15)] outline-none focus:ring-2 focus:ring-brand/20 pr-10"
            />
            <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4082DF]">
              {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-ink-soft cursor-pointer mt-0.5">
          <input type="checkbox" defaultChecked className="accent-brand w-3.5 h-3.5" />
          Remember me for 30 days
        </label>
        <button
          type="submit"
          disabled={busy}
          className="brand-btn w-full flex items-center justify-center gap-2 text-white text-sm font-semibold rounded-lg py-3 mt-1 shadow-[0_4px_12px_rgba(37,99,235,.25)] disabled:opacity-60"
        >
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <div className="text-center text-xs text-muted mt-6">
        No account yet? <Link to="/signup" className="font-medium text-brand">Create one</Link>
      </div>
    </AuthShell>
  )
}
