import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import AuthShell from './AuthShell'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell>
      <h1 className="text-lg font-bold text-center tracking-tight">Reset your password</h1>
      <p className="text-[13px] text-muted text-center mt-2 mb-6">We'll email you a link to reset it.</p>
      {sent ? (
        <div className="text-[13px] text-green bg-green-tint border border-green/20 rounded-md px-3 py-3 text-center">
          Check your inbox for a reset link.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          {error && <div className="text-[12px] text-red bg-red-tint border border-red/20 rounded-md px-3 py-2">{error}</div>}
          <label className="block">
            <span className="text-xs font-medium text-ink-soft mb-1.5 block">Email address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="w-full text-[13px] px-3 py-2.5 border border-[#697285] border-dotted rounded-lg shadow-[0_4px_12px_rgba(0,0,0,.15)] outline-none focus:ring-2 focus:ring-brand/20"
            />
          </label>
          <button type="submit" disabled={busy} className="brand-btn text-white text-sm font-semibold rounded-lg py-3 disabled:opacity-60">
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}
      <div className="text-center mt-6">
        <Link to="/login" className="text-brand text-xs font-medium">Back to log in</Link>
      </div>
    </AuthShell>
  )
}
