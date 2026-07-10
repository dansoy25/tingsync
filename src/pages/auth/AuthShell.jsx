import { Check } from 'lucide-react'
import BrandLogo from '../../components/BrandLogo'
import logoMark from '../../assets/logo-mark.png'

const POINTS = [
  'Track your team from anywhere',
  'Stay compliant, without the stress',
  'Close payroll in minutes, not days',
]

export default function AuthShell({ children }) {
  return (
    <div
      className="min-h-dvh flex items-center justify-center relative overflow-hidden px-4 py-10"
      style={{ background: 'radial-gradient(circle at 30% 20%, #0b1e46 0%, #020817 55%, #01040f 100%)' }}
    >
      <div className="hidden lg:block absolute left-[8vw] top-1/2 -translate-y-1/2 max-w-[340px] text-slate-50">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand/15 border border-blue-400/35 text-[11px] font-semibold text-blue-300 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,.8)]" />
          Trusted By Growing Teams
        </div>
        <div className="text-[32px] font-extrabold leading-[1.15] tracking-tight text-slate-50">
          Run Your Business, Not The Paperwork.
        </div>
        <div className="text-sm leading-relaxed text-slate-400 mt-3.5 max-w-[325px]">
          TingSync unifies your business operations in one platform, giving your team hours back every week.
        </div>
        <div className="flex flex-col gap-2.5 mt-5 text-[13px] text-slate-300">
          {POINTS.map((p) => (
            <div key={p} className="flex items-center gap-2.5">
              <span className="w-[22px] h-[22px] rounded-md bg-brand/20 text-blue-400 inline-flex items-center justify-center shrink-0">
                <Check size={14} />
              </span>
              {p}
            </div>
          ))}
        </div>
      </div>

      <div className="w-full max-w-[380px] relative">
        <div className="flex flex-col items-center mb-5">
          <img src={logoMark} alt="TingSync" className="w-14 h-14 mb-2 drop-shadow-[0_4px_16px_rgba(37,99,235,.45)]" />
          <BrandLogo size={30} />
          <div className="text-[11px] text-slate-400 tracking-[3px] mt-2">WORKFORCE MANAGEMENT, SYNCED.</div>
        </div>
        <div className="text-center mb-4">
          <span
            className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-full text-[#00ff5f] bg-[#13dfbb29] animate-trialGlow"
            style={{ textShadow: '0 0 8px rgba(0,205,76,.55)' }}
          >
            ✦ 14-Day Free Trial — No Credit Card Required
          </span>
        </div>
        <div className="bg-white border border-border rounded-xl p-8 shadow-[0_25px_60px_rgba(0,0,0,.35)]">
          {children}
        </div>
        <div className="text-center text-[10px] text-white/60 mt-3.5">
          By continuing you agree to our Terms and Privacy.
        </div>
      </div>
    </div>
  )
}
