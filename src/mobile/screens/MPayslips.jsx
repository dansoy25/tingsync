import { useEffect, useState } from 'react'
import { ChevronLeft, Share2, Download } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useMobile } from '../MobileShell'
import { money, shortDate, hm } from '../../lib/format'

function periodLabel(s) {
  return `${shortDate(s.period_start)} – ${shortDate(s.period_end)}, ${new Date(s.period_end + 'T00:00:00+08:00').getFullYear()}`
}
const paidLabel = (s) => (s.status === 'paid' ? 'Paid' : s.status ? s.status[0].toUpperCase() + s.status.slice(1) : 'Ready')

export default function MPayslips() {
  const { profile } = useMobile()
  const [slips, setSlips] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(null)

  useEffect(() => {
    supabase.from('payslips').select('*').eq('profile_id', profile.id).order('period_start', { ascending: false })
      .then(({ data }) => setSlips(data || [])).then(() => setLoading(false))
  }, [profile.id])

  if (open) {
    const earnings = Array.isArray(open.earnings) ? open.earnings : []
    const deductions = Array.isArray(open.deductions) ? open.deductions : []
    const dedTotal = deductions.reduce((s, d) => s + Number(d.amount || 0), 0)
    return (
      <div className="bg-white min-h-full pb-6">
        <div className="px-4 pt-4 pb-2 text-center">
          <div className="text-[16px] font-medium text-[#191A1B]">Payslip • {profile.employee_code || 'EMP'}</div>
        </div>
        <div className="p-4">
          {/* Earnings */}
          <div className="rounded-2xl p-4 mb-3 bg-[#e7fbef] shadow-[0_4px_12px_rgba(0,0,0,.12)]">
            <div className="text-[11px] font-bold mb-3 tracking-[.4px] text-[#00140D]">EARNINGS</div>
            <div className="flex flex-col gap-2.5">
              {earnings.length === 0 ? (
                <div className="flex justify-between text-[13px] text-[#22281F]"><span>Gross pay</span><span className="font-mono tnum">{money(open.gross)}</span></div>
              ) : earnings.map((e, i) => (
                <div key={i} className="flex justify-between text-[13px] text-[#22281F]"><span>{e.label || e.name}</span><span className="font-mono tnum">{money(e.amount)}</span></div>
              ))}
            </div>
            <div className="h-px bg-black/10 my-2.5" />
            <div className="flex justify-between text-[13px] font-semibold text-[#22281F]"><span>Gross pay</span><span className="font-mono tnum">{money(open.gross)}</span></div>
          </div>

          {/* Deductions */}
          {deductions.length > 0 && (
            <div className="rounded-2xl p-4 mb-3 bg-[#fde8e8] shadow-[0_4px_12px_rgba(0,0,0,.12)]">
              <div className="text-[11px] font-bold mb-3 tracking-[.4px] text-[#470101]">DEDUCTIONS</div>
              <div className="flex flex-col gap-2.5">
                {deductions.map((d, i) => (
                  <div key={i} className="flex justify-between text-[13px] text-[#F20202]"><span>{d.label || d.name}</span><span className="font-mono tnum">– {money(d.amount)}</span></div>
                ))}
              </div>
              <div className="h-px bg-black/10 my-2.5" />
              <div className="flex justify-between text-[13px] font-semibold text-[#DB0303]"><span>Total deductions</span><span className="font-mono tnum">– {money(dedTotal)}</span></div>
            </div>
          )}

          {/* Net pay */}
          <div className="rounded-[14px] px-[18px] py-4 mb-4 text-white shadow-[0_4px_12px_rgba(0,0,0,.62)]" style={{ background: 'linear-gradient(180deg, #010B22, #000F3F, #000626)' }}>
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-bold tracking-[.6px] opacity-70">NET PAY</div>
              <div className="text-[22px] font-bold tnum tracking-[-.5px] text-[#60a5fa]">{money(open.net)}</div>
            </div>
          </div>

          <div className="flex gap-2.5 mb-4">
            <button onClick={() => setOpen(null)} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[10px] border border-dotted border-[#1B5CDD] text-sm shadow-[0_4px_12px_rgba(0,0,0,.48)]">
              <ChevronLeft className="w-3.5 h-3.5" /> Back
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 py-3 rounded-[10px] text-white text-sm shadow-[0_4px_12px_rgba(0,0,0,.62)]" style={{ background: 'linear-gradient(180deg, #0238AF, #000E42, #003099)' }}>
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
          </div>
          <div className="text-[11px] text-muted text-center">
            {hm(open.regular_hours)} regular hrs{Number(open.ot_hours) > 0 ? ` • ${hm(open.ot_hours)} OT` : ''}
          </div>
        </div>
      </div>
    )
  }

  const latest = slips[0]

  return (
    <div className="bg-white min-h-full pb-6">
      <div className="px-4 pt-4 pb-2"><h1 className="text-xl font-bold text-[#1B1A1A]">Payslips</h1></div>
      <div className="p-4">
        {loading ? (
          <div className="py-16 text-center text-sm text-muted">Loading…</div>
        ) : slips.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">No payslips yet.<br />They appear here after each payroll run.</div>
        ) : (
          <>
            <div className="rounded-2xl p-[18px] mb-4 text-white shadow-[2px_4px_12px_rgba(0,0,0,.62)]" style={{ background: 'linear-gradient(250deg, #002285, #001C59, #002881)' }}>
              <div className="text-[10px] font-bold tracking-[.6px] opacity-85">LATEST NET PAY</div>
              <div className="text-[28px] font-bold mt-1.5 tnum tracking-[-1px]">{money(latest.net)}</div>
              <div className="text-xs mt-1.5 opacity-85">{periodLabel(latest)} • {paidLabel(latest)}</div>
            </div>
            <div className="flex flex-col gap-2.5">
              {slips.map((s) => (
                <button key={s.id} onClick={() => setOpen(s)} className="flex items-center justify-between p-3.5 rounded-2xl bg-white border border-[#7CA0E7] shadow-[0_4px_12px_rgba(4,4,4,.62)] text-left">
                  <div>
                    <div className="text-sm font-semibold">{periodLabel(s)}</div>
                    <div className="text-[11px] text-muted mt-0.5">Net pay</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold tnum">{money(s.net)}</div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full mt-0.5 bg-green-tint text-green border border-[#3273E8]">
                      <span className="w-1.5 h-1.5 rounded-full bg-green" /> {paidLabel(s)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
