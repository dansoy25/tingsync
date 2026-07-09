import { useEffect, useState } from 'react'
import { ChevronLeft, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useMobile } from '../MobileShell'
import { money, shortDate, hm } from '../../lib/format'

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
      <div className="p-4 pb-8">
        <button onClick={() => setOpen(null)} className="flex items-center gap-1.5 text-sm font-semibold mb-4 text-white/90">
          <ChevronLeft className="w-[18px] h-[18px]" /> Payslip
        </button>
        <div
          className="rounded-2xl p-5 mb-4 text-center"
          style={{ background: 'linear-gradient(200deg, #05437c, #12729c, #05437c)' }}
        >
          <div className="text-[11px] text-sky-100/70">
            {shortDate(open.period_start)} — {shortDate(open.period_end)}
          </div>
          <div className="text-[30px] font-bold tnum tracking-tight mt-1">{money(open.net)}</div>
          <div className="text-[11px] text-sky-100/70">net pay{open.paid_to ? ` • ${open.paid_to}` : ''}</div>
        </div>

        <div className="rounded-xl bg-white/[.04] border border-white/10 divide-y divide-white/10">
          <div className="p-3.5">
            <div className="text-[11px] font-bold tracking-wide text-white/40 mb-2">EARNINGS</div>
            {earnings.length === 0 ? (
              <div className="flex justify-between text-[13px]"><span className="text-white/60">Gross pay</span><span className="font-semibold tnum">{money(open.gross)}</span></div>
            ) : (
              earnings.map((e, i) => (
                <div key={i} className="flex justify-between text-[13px] py-0.5">
                  <span className="text-white/60">{e.label || e.name}</span>
                  <span className="font-semibold tnum">{money(e.amount)}</span>
                </div>
              ))
            )}
          </div>
          {deductions.length > 0 && (
            <div className="p-3.5">
              <div className="text-[11px] font-bold tracking-wide text-white/40 mb-2">DEDUCTIONS</div>
              {deductions.map((d, i) => (
                <div key={i} className="flex justify-between text-[13px] py-0.5">
                  <span className="text-white/60">{d.label || d.name}</span>
                  <span className="font-semibold tnum text-red-300">−{money(d.amount)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="p-3.5 flex justify-between text-sm">
            <span className="font-semibold">Net pay</span>
            <span className="font-bold tnum text-emerald-300">{money(open.net)}</span>
          </div>
        </div>
        <div className="text-[11px] text-white/40 mt-3 text-center">
          {hm(open.regular_hours)} regular hrs{Number(open.ot_hours) > 0 ? ` • ${hm(open.ot_hours)} OT` : ''}
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 pb-8">
      <h1 className="text-lg font-bold mb-4">Payslips</h1>
      {loading ? (
        <div className="py-16 text-center text-sm text-white/45">Loading…</div>
      ) : slips.length === 0 ? (
        <div className="py-16 text-center text-sm text-white/45">
          No payslips yet.<br />They appear here after each payroll run.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {slips.map((s) => (
            <button
              key={s.id}
              onClick={() => setOpen(s)}
              className="flex items-center gap-3 rounded-xl p-3.5 bg-white/[.04] border border-white/10 text-left active:bg-white/[.08]"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4 text-emerald-300" />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-semibold">
                  {shortDate(s.period_start)} — {shortDate(s.period_end)}
                </div>
                <div className="text-[11px] text-white/45 mt-0.5 capitalize">{s.status || 'ready'}</div>
              </div>
              <div className="text-sm font-bold tnum">{money(s.net)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
