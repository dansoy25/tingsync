import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, User, Lock, Eye, EyeOff, Fingerprint } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import logoMark from '../assets/logo-mark.png'

export default function MobileLogin() {
  const { signInWithPin } = useAuth()
  const nav = useNavigate()
  const [company, setCompany] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [pin, setPin] = useState('')
  const [showPin, setShowPin] = useState(false)
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [hint, setHint] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await signInWithPin(company.trim(), employeeId.trim(), pin.trim())
      nav('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Sign in failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const field =
    'w-full font-mono text-[13px] h-10 rounded-lg border-[1.5px] border-[#579DEC] pl-[34px] pr-3 outline-none focus:border-brand shadow-[0_4px_12px_rgba(0,0,0,.38)] text-ink'

  return (
    <div className="min-h-dvh w-full flex justify-center px-6 pt-12 pb-8" style={{ background: '#0088FF' }}>
      <div className="w-full max-w-[360px]">
        {/* Header */}
        <div className="text-center mb-7 mt-4">
          <img src={logoMark} alt="" className="w-12 h-12 mx-auto mb-3 drop-shadow-[0_4px_16px_rgba(0,0,0,.35)]" />
          <div className="inline-block px-3.5 py-1 rounded-full mb-3 bg-[rgba(0,205,76,.10)] border border-[rgba(0,205,76,.35)] shadow-[0_4px_12px_rgba(29,242,0,.48)]">
            <span className="text-[10px] font-bold tracking-[1px] uppercase text-[#0BFF00]">● Employee access</span>
          </div>
          <div className="text-[30px] font-extrabold leading-none tracking-tight text-white drop-shadow-[0_4px_12px_rgba(8,107,246,.48)]">
            ting<span className="text-[#00B7FF]">sync</span>
          </div>
          <div className="mt-2.5 text-[9px] font-semibold tracking-[2px] uppercase text-[#CFCFCF]">Attendance · GPS Verified</div>
        </div>

        {/* Card */}
        <div className="rounded-[14px] px-5 py-[22px] bg-[#FCFCFC] shadow-[0_8px_12px_rgba(1,1,1,.68)]">
          <div className="text-[17px] font-bold text-[#222] text-center tracking-tight">Sign in to your account</div>
          <div className="text-[12px] text-[#262626] text-center mt-1.5 mb-[22px]">Use the credentials from your admin.</div>

          <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
            <div>
              <div className="text-[12px] font-semibold text-[#2E3D73] mb-1.5">Company code</div>
              <div className="relative">
                <Building2 className="w-3.5 h-3.5 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className={field + ' uppercase tracking-[1px]'}
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="ACME-2024"
                  autoCapitalize="characters"
                  required
                />
              </div>
            </div>
            <div>
              <div className="text-[12px] font-semibold text-[#2E3D73] mb-1.5">Employee ID</div>
              <div className="relative">
                <User className="w-3.5 h-3.5 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className={field}
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  placeholder="EMP-0098"
                  autoCapitalize="characters"
                  required
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[12px] font-semibold text-[#2E3D73]">PIN</span>
                <span className="text-[10px] text-[#2E3D73]">4–6 digits</span>
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-[#94a3b8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className={field + ' pr-[38px] text-center text-[15px] tracking-[6px]'}
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#94a3b8]"
                  title="Show / hide"
                >
                  {showPin ? <EyeOff className="w-[15px] h-[15px]" /> : <Eye className="w-[15px] h-[15px]" />}
                </button>
              </div>
            </div>

            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-1.5 text-[12px] text-[#2E3D73]">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-brand w-3.5 h-3.5" />
                Remember me
              </span>
              <span className="text-[11px] text-[#2E3D73]">on this device</span>
            </label>

            {error && (
              <div className="text-[12px] text-red bg-red-tint border border-red/20 rounded-lg px-3 py-2">{error}</div>
            )}
            {hint && <div className="text-[12px] text-brand bg-brand-tint rounded-lg px-3 py-2">{hint}</div>}

            <button
              type="submit"
              disabled={busy}
              className="w-full h-[46px] rounded-[10px] font-semibold text-white shadow-[0_6px_14px_rgba(37,99,235,.83)] disabled:opacity-60"
              style={{ background: 'linear-gradient(180deg,#2563eb,#0023E8,#00136C)' }}
            >
              {busy ? 'Signing in…' : 'Sign in'}
            </button>

            <div className="flex items-center gap-2.5 my-1">
              <div className="flex-1 h-px bg-[#e5e7eb]" />
              <span className="text-[10px] text-[#2E3D73] font-medium tracking-[1px] uppercase">Or</span>
              <div className="flex-1 h-px bg-[#e5e7eb]" />
            </div>

            <button
              type="button"
              onClick={() => setHint('Biometric unlock is coming soon — use your PIN for now.')}
              className="w-full h-[46px] rounded-[10px] flex items-center justify-center gap-2 font-semibold text-[#001647] bg-[rgba(104,167,248,.48)]"
            >
              <Fingerprint className="w-[18px] h-[18px]" /> Unlock with biometrics
            </button>
          </form>
        </div>

        <div className="text-center mt-[18px]">
          <span className="text-[11px] text-[#C9D4FF]">Forgot your PIN?</span>{' '}
          <span className="text-[11px] text-white font-semibold">Contact your admin</span>
        </div>
        <div className="text-center mt-3.5 text-[10px] text-[#B9C6FF]">
          Protected by TingSync · <Link to="/admin-login" className="text-white/90 underline underline-offset-2">Admin sign-in</Link>
        </div>
      </div>
    </div>
  )
}
