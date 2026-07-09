import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { useMobile } from '../MobileShell'
import { timePH } from '../../lib/format'
import { fetchMyHistory, manilaToday, shiftDays } from '../../lib/mobileApi'

const RANGES = [
  { key: 'week', label: 'This week', days: 7 },
  { key: 'month', label: 'Month', days: 31 },
  { key: 'all', label: 'All', days: null },
]

const BADGE = {
  present: 'bg-green-tint text-green',
  ongoing: 'bg-green-tint text-green',
  late: 'bg-amber-tint text-amber',
  absent: 'bg-red-tint text-red',
}
const LABEL = { present: 'Present', ongoing: 'Present', late: 'Late', absent: 'Absent' }

function dayHeader(workDate, today) {
  const d = new Date(workDate + 'T00:00:00+08:00')
  const parts = { weekday: 'long', month: 'short', day: 'numeric', timeZone: 'Asia/Manila' }
  const wd = workDate === today
    ? 'TODAY'
    : new Intl.DateTimeFormat('en-PH', { weekday: 'long', timeZone: 'Asia/Manila' }).format(d).toUpperCase()
  const md = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' }).format(d).toUpperCase()
  return `${wd} • ${md}`
}

function hoursLabel(r) {
  if (r.clock_out) return `${Number(r.hours || 0).toFixed(1)} h`
  const elapsed = (Date.now() - new Date(r.clock_in)) / 3600000
  return `${elapsed.toFixed(1)} h`
}

export default function MAttendance() {
  const { profile } = useMobile()
  const [range, setRange] = useState('week')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [selfie, setSelfie] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    const r = RANGES.find((x) => x.key === range)
    const from = r.days ? shiftDays(manilaToday(), -r.days) : null
    fetchMyHistory(profile.id, from)
      .then((d) => active && setRows(d))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [profile.id, range])

  const today = manilaToday()
  // group by work_date preserving order (already sorted desc by history)
  const groups = []
  const seen = {}
  for (const r of rows) {
    if (!seen[r.work_date]) {
      seen[r.work_date] = { date: r.work_date, items: [] }
      groups.push(seen[r.work_date])
    }
    seen[r.work_date].items.push(r)
  }

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold text-white">Attendance</h1>
        <button className="w-9 h-9 rounded-lg border border-[#9DA9EB] flex items-center justify-center">
          <Download className="w-[18px] h-[18px] text-white" />
        </button>
      </div>

      {/* White segmented control */}
      <div className="px-4">
        <div className="flex w-full rounded-[10px] border border-[#84A6EB] bg-bg-soft p-[3px] shadow-[0_4px_12px_rgba(0,0,0,.48)]">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={
                'flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ' +
                (range === r.key ? 'bg-white text-ink border-2 border-[#8FA9EF] shadow-sm' : 'text-muted')
              }
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="py-16 text-center text-sm text-white/45">Loading…</div>
        ) : groups.length === 0 ? (
          <div className="py-16 text-center text-sm text-white/45">No attendance records yet.</div>
        ) : (
          groups.map((g) => (
            <div key={g.date} className="mb-4">
              <div className="text-[10px] font-bold tracking-[.6px] text-[#B8B8B8] mb-2">{dayHeader(g.date, today)}</div>
              <div className="flex flex-col gap-2.5">
                {g.items.map((r) => {
                  const absent = r.status === 'absent'
                  return (
                    <div
                      key={r.id}
                      onClick={() => r.selfie_url && setSelfie(r.selfie_url)}
                      className={
                        'flex items-center gap-3 p-3.5 rounded-2xl bg-white text-ink border border-[#5087F1] shadow-[0_4px_12px_rgba(47,49,52,.48)] ' +
                        (r.selfie_url ? 'cursor-pointer' : '')
                      }
                    >
                      {absent ? (
                        <div className="w-11 h-11 rounded-full bg-red-tint border-2 border-[#97ACE0] flex items-center justify-center shrink-0">
                          <span className="w-3 h-3 rounded-full border-2 border-red" />
                        </div>
                      ) : r.selfie_url ? (
                        <img src={r.selfie_url} alt="" className="w-11 h-11 rounded-[10px] object-cover border-2 border-[#97ACE0] shrink-0" loading="lazy" />
                      ) : (
                        <div
                          className="w-11 h-11 rounded-[10px] border-2 border-[#97ACE0] relative shrink-0 overflow-hidden"
                          style={{ background: 'linear-gradient(135deg,#e0f2fe,#dbeafe)' }}
                        >
                          <span className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-brand -translate-x-1/2 -translate-y-1/2 shadow-[0_0_0_3px_rgba(37,99,235,.25)]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold">{absent ? 'No record' : (r.site?.name || 'Worksite')}</div>
                        <div className="text-[11px] text-muted mt-0.5">
                          {absent
                            ? 'Rest day'
                            : `${timePH(r.clock_in)} — ${r.clock_out ? timePH(r.clock_out) : 'ongoing'} • ${hoursLabel(r)}`}
                        </div>
                      </div>
                      <span className={'text-[11px] font-medium px-2.5 py-1 rounded-full border border-[#A3AFF1] ' + (BADGE[r.status] || BADGE.absent)}>
                        {LABEL[r.status] || 'Absent'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {selfie && (
        <button onClick={() => setSelfie('')} className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6">
          <img src={selfie} alt="Time-in selfie" className="max-w-full max-h-[70vh] rounded-2xl" />
        </button>
      )}
    </div>
  )
}
