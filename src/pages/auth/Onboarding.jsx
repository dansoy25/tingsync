import { useState, Fragment } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Check, Flag, SlidersHorizontal, Clock, ArrowRight, Send } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import BrandLogo from '../../components/BrandLogo'

const INDUSTRIES = [
  'Retail & Trading', 'Food & Beverage', 'Restaurant / Cafe', 'Convenience Store / Sari-sari',
  'Grocery / Supermarket', 'Services', 'Professional Services', 'Beauty & Wellness', 'Healthcare & Clinics',
  'Education / Learning Center', 'Construction', 'Manufacturing', 'Agriculture & Fisheries',
  'Transportation & Logistics', 'Warehousing & Distribution', 'Real Estate', 'Hospitality & Tourism',
  'BPO / Call Center', 'Technology / IT Services', 'Software Development', 'Creative & Media Agency',
  'Automotive / Repair Shop', 'E-commerce / Online Store', 'Non-profit / NGO', 'Cooperative',
  'Security Services', 'Cleaning & Facilities', 'Event Management', 'Print & Publishing', 'Other',
]
const TEAM_SIZES = ['1–10', '11–50', '51–200', '201–500', '500+']

export default function Onboarding() {
  const { createWorkspace, profile } = useAuth()
  const nav = useNavigate()
  const location = useLocation()
  const [step, setStep] = useState(1)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    company_name: location.state?.businessName || '',
    address: '',
    industry: INDUSTRIES[0],
    team_size: TEAM_SIZES[0],
    full_name: location.state?.fullName || '',
    deduction_mode: 'defaults',
    invites: '',
  })

  if (profile && step < 4) {
    nav('/', { replace: true })
    return null
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function finish() {
    setBusy(true)
    setError('')
    try {
      await createWorkspace({
        company_name: form.company_name,
        full_name: form.full_name,
        industry: form.industry,
        team_size: form.team_size,
        address: form.address,
      })
      setStep(4)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="min-h-dvh flex justify-center pt-16 px-4 pb-10"
      style={{ background: 'radial-gradient(circle at 30% 20%, #0b1e46 0%, #020817 55%, #01040f 100%)' }}
    >
      <div className="w-full max-w-[560px]">
        <div className="flex flex-col items-center mb-7">
          <BrandLogo size={28} />
          <div className="text-[11px] text-slate-400 tracking-[3px] mt-2">WORKFORCE MANAGEMENT, SYNCED.</div>
        </div>
        <Steps step={step} />
        <div className="bg-white border border-border rounded-xl p-8">
          {error && <div className="text-[12px] text-red bg-red-tint border border-red/20 rounded-md px-3 py-2 mb-4">{error}</div>}

          {step === 1 && (
            <>
              <h2 className="text-lg font-bold">Tell us about your company</h2>
              <p className="text-[13px] text-muted mt-1.5 mb-5">This appears on payslips and reports.</p>
              <div className="flex flex-col gap-3.5">
                <Field label="Company name">
                  <input required value={form.company_name} onChange={set('company_name')} className={inputCls} placeholder="Acme Trading Corporation" />
                </Field>
                <Field label="Your full name">
                  <input required value={form.full_name} onChange={set('full_name')} className={inputCls} placeholder="Maria Dela Cruz" />
                </Field>
                <Field label="Business address">
                  <input value={form.address} onChange={set('address')} className={inputCls} placeholder="123 Ayala Avenue, Makati City" />
                </Field>
                <div className="grid grid-cols-2 gap-3.5">
                  <Field label="Industry">
                    <select value={form.industry} onChange={set('industry')} className={inputCls}>
                      {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                    </select>
                  </Field>
                  <Field label="Team size">
                    <select value={form.team_size} onChange={set('team_size')} className={inputCls}>
                      {TEAM_SIZES.map((i) => <option key={i}>{i}</option>)}
                    </select>
                  </Field>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  disabled={!form.company_name || !form.full_name}
                  onClick={() => setStep(2)}
                  className="brand-btn text-white text-sm font-semibold rounded-lg px-5 py-2.5 disabled:opacity-50"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-lg font-bold">Deductions & tax setup</h2>
              <p className="text-[13px] text-muted mt-1.5 mb-5">
                Pick a starting point. You can fully customize SSS, PhilHealth, Pag-IBIG, tax brackets, and holiday premiums anytime from Settings → Payroll.
              </p>
              <div className="flex flex-col gap-2.5">
                <DeductionOption
                  icon={Flag}
                  title="Philippine defaults"
                  badge="Recommended"
                  sub="Pre-filled SSS, PhilHealth, Pag-IBIG and BIR withholding tax"
                  active={form.deduction_mode === 'defaults'}
                  onClick={() => setForm((f) => ({ ...f, deduction_mode: 'defaults' }))}
                />
                <DeductionOption
                  icon={SlidersHorizontal}
                  title="Start from scratch"
                  sub="Empty tables — add only the deductions your business uses"
                  active={form.deduction_mode === 'scratch'}
                  onClick={() => setForm((f) => ({ ...f, deduction_mode: 'scratch' }))}
                />
                <DeductionOption
                  icon={Clock}
                  title="Configure later"
                  sub="Skip for now — set it all up before your first payroll run"
                  active={form.deduction_mode === 'later'}
                  onClick={() => setForm((f) => ({ ...f, deduction_mode: 'later' }))}
                />
              </div>
              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(1)} className="text-sm font-medium text-ink-soft px-4 py-2">Back</button>
                <button onClick={() => setStep(3)} className="brand-btn text-white text-sm font-semibold rounded-lg px-5 py-2.5">Continue</button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="text-lg font-bold">Invite your team</h2>
              <p className="text-[13px] text-muted mt-1.5 mb-5">Employees will use the mobile app to clock in. You can add them anytime from Employees.</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Field label="Send email invites">
                    <textarea value={form.invites} onChange={set('invites')} rows={6} className={inputCls + ' font-mono text-xs'} placeholder={'email1@team.com\nemail2@team.com'} />
                  </Field>
                  <button type="button" className="w-full justify-center flex items-center gap-2 border border-border rounded-lg py-2 text-[13px] font-medium mt-1">
                    <Send size={14} /> Send invites
                  </button>
                </div>
                <div className="text-center p-5 border border-border rounded-lg bg-bg-soft flex flex-col justify-center">
                  <div className="w-[100px] h-[100px] mx-auto mb-2.5 rounded-md bg-white border border-border" />
                  <div className="text-[12px] font-medium">Or scan to join</div>
                  <div className="text-[11px] text-faint mt-1">Employees scan this QR<br />to install the app</div>
                </div>
              </div>
              <div className="flex justify-between mt-6 items-center">
                <button onClick={() => setStep(2)} className="text-sm font-medium text-ink-soft px-4 py-2">Back</button>
                <div className="flex items-center gap-3">
                  <button onClick={finish} disabled={busy} className="text-[11px] font-medium text-brand">Skip for now</button>
                  <button onClick={finish} disabled={busy} className="brand-btn text-white text-sm font-semibold rounded-lg px-5 py-2.5 disabled:opacity-60">
                    {busy ? 'Setting up…' : 'Continue'}
                  </button>
                </div>
              </div>
            </>
          )}

          {step === 4 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-tint text-green inline-flex items-center justify-center mb-4">
                <Check size={32} />
              </div>
              <h2 className="text-xl font-bold">You're all set</h2>
              <p className="text-sm text-muted mt-3 mb-6">Your workspace is ready. Let's go to the dashboard.</p>
              <button onClick={() => nav('/', { replace: true })} className="brand-btn text-white font-semibold rounded-lg px-7 py-2.5 inline-flex items-center gap-2">
                Enter TingSync <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Steps({ step }) {
  const dots = [1, 2, 3, 4]
  return (
    <div className="flex items-center gap-2 mb-7">
      {dots.map((d, i) => (
        <Fragment key={d}>
          <div
            className={
              'w-7 h-7 rounded-full border-[1.5px] flex items-center justify-center text-xs font-semibold shrink-0 ' +
              (d < step ? 'bg-brand border-brand text-white' : d === step ? 'border-brand text-brand bg-white' : 'border-border text-faint bg-white')
            }
          >
            {d}
          </div>
          {i < dots.length - 1 && (
            <div className={'flex-1 h-[1.5px] ' + (d < step ? 'bg-brand' : 'bg-border')} />
          )}
        </Fragment>
      ))}
    </div>
  )
}

function DeductionOption({ icon: Icon, title, badge, sub, active, onClick }) {
  return (
    <label
      onClick={onClick}
      className={'flex items-center justify-between p-3.5 border rounded-lg cursor-pointer transition ' + (active ? 'border-brand bg-brand-tint' : 'border-border bg-white')}
    >
      <div className="flex items-center gap-3">
        <div className={'w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ' + (active ? 'bg-brand-tint text-brand' : 'bg-bg-tint text-ink-soft')}>
          <Icon size={18} />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <div className="font-semibold text-[13px]">{title}</div>
            {badge && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-brand-tint text-brand font-medium">{badge}</span>}
          </div>
          <div className="text-[11px] text-muted mt-0.5">{sub}</div>
        </div>
      </div>
      <div className={'w-[18px] h-[18px] rounded-full border shrink-0 ' + (active ? 'border-[5px] border-brand' : 'border-[1.5px] border-border-strong')} />
    </label>
  )
}

const inputCls =
  'w-full text-[13px] px-3 py-2.5 border border-border rounded-lg outline-none focus:border-brand focus:ring-2 focus:ring-brand/15'

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-ink-soft mb-1.5 block">{label}</span>
      {children}
    </label>
  )
}
