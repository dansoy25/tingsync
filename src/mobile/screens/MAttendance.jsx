import { useEffect, useState } from 'react'
import { MapPin, Camera } from 'lucide-react'
import { useMobile } from '../MobileShell'
import { timePH, hm, shortDate } from '../../lib/format'
import { fetchMyHistory, manilaToday, shiftDays } from '../../lib/mobileApi'

const RANGES = [
  { key: 'week', label: 'This week', days: 7 },
  { key: 'month', label: 'Month', days: 31 },
  { key: 'all', label: 'All', days: null },
]

const STATUS_COLORS = {
  present: 'text-emerald-300 bg-emerald-500/15',
  ongoing: 'text-emerald-300 bg-emerald-500/15',
  late: 'text-amber-300 bg-amber-500/15',
  absent: 'text-white/40 bg-white/10',
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

  const totalHours = rows.reduce((t, r) => t + Number(r.hours || 0), 0)

  return (
    <div className="p-4 pb-8">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold">Attendance</h1>
        <div className="text-xs text-white/45">{hm(totalHours)} hrs total</div>
      </div>

      <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-white/[.06] border border-white/10 mb-5">
        {RANGES.map((r) => (
          <button
            key={r.key}
            onClick={() => setRange(r.key)}
            className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
              range === r.key ? 'bg-brand text-white' : 'text-white/50'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 text-center text-sm text-white/45">Loading…</div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-sm text-white/45">No attendance records yet.</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center gap-3 rounded-xl p-3.5 bg-white/[.04] border border-white/10">
              {r.selfie_url ? (
                <button onClick={() => setSelfie(r.selfie_url)} className="relative shrink-0">
                  <img src={r.selfie_url} alt="" className="w-11 h-11 rounded-lg object-cover" loading="lazy" />
                  <Camera className="absolute -bottom-1 -right-1 w-3.5 h-3.5 text-white bg-brand rounded-full p-0.5" />
                </button>
              ) : (
                <div className="w-11 h-11 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-sky-300" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold">{shortDate(r.work_date)}</div>
                <div className="text-[11px] text-white/45 mt-0.5">
                  {timePH(r.clock_in)} — {r.clock_out ? timePH(r.clock_out) : 'on shift'}
                  {r.site?.name ? ` • ${r.site.name}` : ''}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[13px] font-bold tnum">{r.clock_out ? hm(r.hours) : '—'}</div>
                <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mt-0.5 capitalize ${STATUS_COLORS[r.status] || STATUS_COLORS.absent}`}>
                  {r.status === 'ongoing' ? 'on shift' : r.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selfie && (
        <button
          onClick={() => setSelfie('')}
          className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-6"
        >
          <img src={selfie} alt="Time-in selfie" className="max-w-full max-h-[70vh] rounded-2xl" />
        </button>
      )}
    </div>
  )
}
