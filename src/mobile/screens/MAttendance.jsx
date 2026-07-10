import { useEffect, useState } from 'react'
import { useMobile } from '../MobileShell'
import { timePH, hm } from '../../lib/format'
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

function greeting() {
  const h = Number(new Intl.DateTimeFormat('en-PH', { hour: 'numeric', hour12: false, timeZone: 'Asia/Manila' }).format(new Date()))
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function dayHeader(workDate, today) {
  const d = new Date(workDate + 'T00:00:00+08:00')
  const wd = workDate === today ? 'TODAY' : new Intl.DateTimeFormat('en-PH', { weekday: 'long', timeZone: 'Asia/Manila' }).format(d).toUpperCase()
  const md = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' }).format(d).toUpperCase()
  return `${wd} • ${md}`
}

function hoursLabel(r) {
  if (r.clock_out) return `${Number(r.hours || 0).toFixed(1)} h`
  const elapsed = (Date.now() - new Date(r.clock_in)) / 3600000
  return `${elapsed.toFixed(1)} h`
}

export default function MAttendance() {
  const { profile, navigate } = useMobile()
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
  const todayRow = rows.find((r) => r.work_date === today && r.clock_in)

  const groups = []
  const seen = {}
  for (const r of rows) {
    if (!seen[r.work_date]) { seen[r.work_date] = { date: r.work_date, items: [] }; groups.push(seen[r.work_date]) }
    seen[r.work_date].items.push(r)
  }

  return (
    <div className="bg-[#F6F7FF] min-h-full pb-6">
      {/* Teal header */}
      <div
        className="text-white px-5 pt-7 pb-16 rounded-b-[20px] border border-[#2AC1BC] shadow-[0_4px_12px_rgba(0,0,0,.62)]"
        style={{ background: 'linear-gradient(180deg, #02B2AC, #28211a)' }}
      >
        <div className="text-center">
          <div className="inline-block px-[18px] py-1.5 rounded-full bg-white/15 border border-white/20 backdrop-blur shadow-[0_4px_12px_rgba(0,0,0,.35)]">
            <span className="text-[22px] font-extrabold tracking-tight leading-none text-white">
              ting<span className="text-[#003F7C]" style={{ textShadow: '0 0 12px rgba(0,130,255,.9)' }}>sync</span>
            </span>
          </div>
          <div className="mt-2 text-[9px] font-semibold tracking-[2.4px] uppercase text-white/60">Attendance · GPS Verified</div>
        </div>
        <div className="text-center text-[13px] font-bold italic mt-4 text-[#F9F9F9] leading-snug">
          {greeting()} {profile.full_name?.split(' ')[0]}. Welcome back — safety is our priority, please follow all protocols today.
        </div>
      </div>

      <div className="px-4 -mt-10 relative z-[2]">
        {/* TODAY card */}
        {todayRow && (
          <div className="rounded-xl p-[18px] mb-5 shadow-[0_10px_30px_rgba(0,0,0,.35)]" style={{ background: 'linear-gradient(200deg, #034A88, #1685B2, #034A88)' }}>
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[10px] font-bold tracking-[.6px] text-white/70">TODAY</span>
              {todayRow.clock_out
                ? <span className="text-[11px] font-semibold text-sky-100">✓ Shift complete</span>
                : <span className="text-[11px] font-semibold text-emerald-300">● Clocked in</span>}
            </div>
            <div className="flex items-center gap-4">
              <div>
                <div className="text-[32px] font-bold leading-none tnum tracking-tight text-white">
                  {todayRow.clock_out ? hm(todayRow.hours) : hoursLabel(todayRow).replace(' h', '')}
                </div>
                <div className="text-[11px] text-white/70 mt-1">hours{todayRow.clock_out ? ' today' : ' so far'}</div>
              </div>
              <div className="w-px h-9 bg-white/25" />
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-white">{todayRow.site?.name || 'Worksite'}</div>
                <div className="text-[11px] text-white/70 mt-0.5">In at {timePH(todayRow.clock_in)}</div>
              </div>
            </div>
            {!todayRow.clock_out && (
              <button
                onClick={() => navigate('checkin', { mode: 'out', row: todayRow })}
                className="mt-4 mx-auto block w-[236px] h-[52px] rounded-[10px] font-semibold text-sm text-white shadow-[0_4px_12px_rgba(0,0,0,.48)]"
                style={{ background: 'linear-gradient(180deg, #1A0000, #6F0000, #1A0000)' }}
              >
                Clock out
              </button>
            )}
          </div>
        )}

        {/* Segmented control */}
        <div className="flex w-full rounded-[10px] border border-[#84A6EB] p-[3px] mb-4 shadow-[0_4px_12px_rgba(0,0,0,.48)] bg-white">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={'flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ' + (range === r.key ? 'text-white' : 'text-muted')}
              style={range === r.key ? { background: 'linear-gradient(180deg, #0A3DB6, #002E62, #0A3DB6)' } : undefined}
            >
              {r.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-16 text-center text-sm text-muted">Loading…</div>
        ) : groups.length === 0 ? (
          <div className="py-16 text-center text-sm text-muted">No attendance records yet.</div>
        ) : (
          groups.map((g) => (
            <div key={g.date} className="mb-4">
              <div className="text-[10px] font-bold tracking-[.6px] text-[#202020] mb-2">{dayHeader(g.date, today)}</div>
              <div className="flex flex-col gap-2.5">
                {g.items.map((r) => {
                  const absent = r.status === 'absent'
                  return (
                    <div
                      key={r.id}
                      onClick={() => r.selfie_url && setSelfie(r.selfie_url)}
                      className={'flex items-center gap-3 p-3.5 rounded-2xl bg-white text-ink border border-[#5087F1] shadow-[0_4px_12px_rgba(47,49,52,.48)] ' + (r.selfie_url ? 'cursor-pointer' : '')}
                    >
                      {absent ? (
                        <div className="w-11 h-11 rounded-full bg-red-tint border-2 border-[#97ACE0] flex items-center justify-center shrink-0">
                          <span className="w-3 h-3 rounded-full border-2 border-red" />
                        </div>
                      ) : r.selfie_url ? (
                        <img src={r.selfie_url} alt="" className="w-11 h-11 rounded-[10px] object-cover border-2 border-[#97ACE0] shrink-0" loading="lazy" />
                      ) : (
                        <div className="w-11 h-11 rounded-[10px] border-2 border-[#97ACE0] relative shrink-0 overflow-hidden" style={{ background: 'linear-gradient(135deg,#e0f2fe,#dbeafe)' }}>
                          <span className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-brand -translate-x-1/2 -translate-y-1/2 shadow-[0_0_0_3px_rgba(37,99,235,.25)]" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-semibold">{absent ? 'No record' : (r.site?.name || 'Worksite')}</div>
                        <div className="text-[11px] text-muted mt-0.5">
                          {absent ? 'Rest day' : `${timePH(r.clock_in)} — ${r.clock_out ? timePH(r.clock_out) : 'ongoing'} • ${hoursLabel(r)}`}
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
