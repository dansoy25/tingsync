import { useEffect, useState } from 'react'
import { ChevronLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useMobile } from '../MobileShell'
import { money, shortDate, hm } from '../../lib/format'

const MCARD = 'bg-white text-ink rounded-2xl border border-[#7CA0E7] shadow-[0_4px_12px_rgba(0,0,0,.27)]'

function periodLabel(s) {
  return `${shortDate(s.period_start)} – ${shortDate(s.period_end)}, ${new Date(s.period_end + 'T00:00:00+08:00').getFullYear()}`
}
function paidLabel(s) {
  return s.status === 'paid' ? 'Paid' : (s.status ? s.status[0].toUpperCase() + s.status.slice(1) : 'Ready')
}

export default function MPayslips() {
  const { profile } = useMobile()
  const [slips, setSlips] = useState([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(null)

  useEffect(() => {
    supabase
      .from('payslips')
      .select('*')
      .eq('profile_id', profile.id)
      .order('period_start', { ascending: false })
      .then(({ data }) => setSlips(data || []))
      .then(() => setLoading(false))
  }, [profile.id])

  if (open) {
    const earnings = Array.isArray(open.earnings) ? open.earnings : []
    const deductions = Array.isArray(open.deductions) ? open.deductions : []
    return (
      <div className="pb-6">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <button onClick={() => setOpen(null)} className="w-8 h-8 flex items-center justify-center text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-white">Payslip</h1>
        </div>
        <div className="p-4">
          <div
            className="rounded-2xl p-[18px] mb-4 text-white shadow-[2px_4px_12px_rgba(0,0,0,.62)]"
            style={{ background: 'linear-gradient(250deg, #002285, #001C59, #002881)' }}
          >
            <div className="text-[10px] font-bold tracking-[.6px] opacity-85">NET PAY</div>
            <div className="text-[28px] font-bold mt-1.5 tnum -tracking-[1px]">{money(open.net)}</div>
            <div className="text-xs mt-1.5 opacity-85">{periodLabel(open)} • {paidLabel(open)}</div>
          </div>

          <div className={MCARD + ' divide-y divide-border'}>
            <div className="p-4">
              <div className="text-[11px] font-bold tracking-wide text-muted mb-2">EARNINGS</div>
              {earnings.length === 0 ? (
                <div className="flex justify-between text-[13px]"><span className="text-muted">Gross pay</span><span className="font-semibold tnum">{money(open.gross)}</span></div>
              ) : (
                earnings.map((e, i) => (
                  <div key={i} className="flex justify-between text-[13px] py-0.5">
                    <span className="text-muted">{e.label || e.name}</span>
                    <span className="font-semibold tnum">{money(e.amount)}</span>
                  </div>
                ))
              )}
            </div>
            {deductions.length > 0 && (
              <div className="p-4">
                <div className="text-[11px] font-bold tracking-wide text-muted mb-2">DEDUCTIONS</div>
                {deductions.map((d, i) => (
                  <div key={i} className="flex justify-between text-[13px] py-0.5">
                    <span className="text-muted">{d.label || d.name}</span>
                    <span className="font-semibold tnum text-red">−{money(d.amount)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="p-4 flex justify-between text-sm">
              <span className="font-semibold">Net pay</span>
              <span className="font-bold tnum text-green">{money(open.net)}</span>
            </div>
          </div>
          <div className="text-[11px] text-white/40 mt-3 text-center">
            {hm(open.regular_hours)} regular hrs{Number(open.ot_hours) > 0 ? ` • ${hm(open.ot_hours)} OT` : ''}
          </div>
        </div>
      </div>
    )
  }

  const latest = slips[0]

  return (
    <div className="pb-6">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-white">Payslips</h1>
      </div>
      <div className="p-4">
        {loading ? (
          <div className="py-16 text-center text-sm text-white/45">Loading…</div>
        ) : slips.length === 0 ? (
          <div className="py-16 text-center text-sm text-white/45">
            No payslips yet.<br />They appear here after each payroll run.
          </div>
        ) : (
          <>
            {/* Latest net pay */}
            <div
              className="rounded-2xl p-[18px] mb-4 text-white shadow-[2px_4px_12px_rgba(0,0,0,.62)]"
              style={{ background: 'linear-gradient(250deg, #002285, #001C59, #002881)' }}
            >
              <div className="text-[10px] font-bold tracking-[.6px] opacity-85">LATEST NET PAY</div>
              <div className="text-[28px] font-bold mt-1.5 tnum -tracking-[1px]">{money(latest.net)}</div>
              <div className="text-xs mt-1.5 opacity-85">{periodLabel(latest)} • {paidLabel(latest)}</div>
            </div>

            <div className="flex flex-col gap-2.5">
              {slips.map((s) => (
                <button key={s.id} onClick={() => setOpen(s)} className={MCARD + ' flex items-center justify-between p-3.5 text-left'}>
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
