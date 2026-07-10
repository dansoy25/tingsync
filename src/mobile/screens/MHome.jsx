import { useEffect, useState } from 'react'
import { Play, Megaphone, HardHat } from 'lucide-react'
import { useMobile } from '../MobileShell'
import { Avatar } from '../../admin/ui'
import { timePH, hm } from '../../lib/format'
import {
  fetchMyToday, fetchMyWeekHours, fetchMyLeaveBalance, fetchAnnouncements,
} from '../../lib/mobileApi'

function greeting() {
  const h = Number(
    new Intl.DateTimeFormat('en-PH', { hour: 'numeric', hour12: false, timeZone: 'Asia/Manila' }).format(new Date())
  )
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(t)
  }, [intervalMs])
  return now
}

const ANN_ICONS = [
  { icon: Megaphone, bg: '#fef3c7', fg: '#a16207' },
  { icon: HardHat, bg: '#dbeafe', fg: '#2563eb' },
]

export default function MHome() {
  const { profile, navigate, homeVersion } = useMobile()
  const [today, setToday] = useState(null)
  const [weekHours, setWeekHours] = useState(0)
  const [leaveDays, setLeaveDays] = useState(0)
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const now = useNow()

  useEffect(() => {
    let active = true
    Promise.all([
      fetchMyToday(profile.id),
      fetchMyWeekHours(profile.id),
      fetchMyLeaveBalance(profile.id),
      fetchAnnouncements(profile.org_id),
    ])
      .then(([t, w, l, a]) => {
        if (!active) return
        setToday(t)
        setWeekHours(w)
        setLeaveDays(l)
        setAnnouncements(a)
      })
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [profile.id, profile.org_id, homeVersion])

  const clockedIn = today && today.clock_in && !today.clock_out
  const doneToday = today && today.clock_out
  const hoursSoFar = clockedIn ? (now - new Date(today.clock_in)) / 3600000 : 0
  const dateLabel = now.toLocaleDateString('en-PH', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila',
  })

  return (
    <div className="bg-white min-h-full pb-6">
      {/* Teal header */}
      <div
        className="text-white px-5 pt-7 pb-16 rounded-b-[20px] border-b border-[#2AC1BC]"
        style={{ background: 'linear-gradient(180deg, #02B2AC, #28211a)' }}
      >
        <div className="text-center mb-5">
          <div className="inline-block px-[18px] py-1.5 rounded-full bg-white/15 border border-white/20 backdrop-blur shadow-[0_4px_12px_rgba(0,0,0,.35)]">
            <span className="text-[22px] font-extrabold tracking-tight leading-none text-white">
              ting<span className="text-[#003F7C]" style={{ textShadow: '0 0 12px rgba(0,130,255,.9)' }}>sync</span>
            </span>
          </div>
          <div className="mt-2 text-[9px] font-semibold tracking-[2.4px] uppercase text-white/60">Attendance · GPS Verified</div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] text-white/85">{greeting()}</div>
            <div className="text-xl font-bold mt-0.5">{profile.full_name}</div>
            <div className="text-xs text-white/75 mt-0.5">{dateLabel}</div>
          </div>
          <button onClick={() => navigate('profile')} className="rounded-full ring-2 ring-white/35">
            <Avatar name={profile.full_name} src={profile.avatar_url} size={42} />
          </button>
        </div>
      </div>

      {/* TODAY card */}
      <div className="px-4 -mt-10 relative z-[2]">
        <div
          className="rounded-xl p-[18px] shadow-[0_10px_30px_rgba(0,0,0,.35)]"
          style={{ background: 'linear-gradient(200deg, #034A88, #1685B2, #034A88)' }}
        >
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[10px] font-bold tracking-[.6px] text-white/70">TODAY</span>
            {loading ? null : clockedIn ? (
              <span className="text-[11px] font-semibold text-emerald-300">● Clocked in</span>
            ) : doneToday ? (
              <span className="text-[11px] font-semibold text-sky-100">✓ Shift complete</span>
            ) : (
              <span className="text-[11px] font-medium text-white/60">Not clocked in</span>
            )}
          </div>

          {loading ? (
            <div className="py-6 text-center text-sm text-white/70">Loading…</div>
          ) : clockedIn ? (
            <>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[32px] font-bold leading-none tnum tracking-tight text-white">{hm(hoursSoFar)}</div>
                  <div className="text-[11px] text-white/70 mt-1">hours so far</div>
                </div>
                <div className="w-px h-9 bg-white/25" />
                <div className="flex-1">
                  <div className="text-[13px] font-semibold text-white">{today.site?.name || 'No site'}</div>
                  <div className="text-[11px] text-white/70 mt-0.5">In at {timePH(today.clock_in)}</div>
                </div>
              </div>
              <button
                onClick={() => navigate('checkin', { mode: 'out', row: today })}
                className="mt-4 mx-auto block w-[236px] h-[52px] rounded-[10px] font-semibold text-sm text-white shadow-[0_4px_12px_rgba(0,0,0,.48)] active:scale-[.98] transition-transform"
                style={{ background: 'linear-gradient(180deg, #1A0000, #6F0000, #1A0000)' }}
              >
                Clock out
              </button>
            </>
          ) : doneToday ? (
            <div className="flex items-center gap-4">
              <div>
                <div className="text-[32px] font-bold leading-none tnum tracking-tight text-white">{hm(today.hours)}</div>
                <div className="text-[11px] text-white/70 mt-1">hours today</div>
              </div>
              <div className="w-px h-9 bg-white/25" />
              <div className="flex-1">
                <div className="text-[13px] font-semibold text-white">{today.site?.name || 'No site'}</div>
                <div className="text-[11px] text-white/70 mt-0.5">{timePH(today.clock_in)} — {timePH(today.clock_out)}</div>
              </div>
            </div>
          ) : (
            <>
              <div className="text-[15px] font-medium mb-1 text-white">Ready to start your shift?</div>
              <div className="text-xs text-white/75">
                {profile.schedule ? `Scheduled: ${profile.schedule}` : 'Clock in with GPS verification.'}
              </div>
              <button
                onClick={() => navigate('checkin', { mode: 'in' })}
                className="mt-4 mx-auto w-[238px] h-[56px] rounded-[10px] font-semibold text-sm text-white flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,0,0,.48)] active:scale-[.98] transition-transform"
                style={{ background: 'linear-gradient(180deg, #00051A, #000D6F, #00051A)' }}
              >
                <Play className="w-4 h-4" /> Clock in
              </button>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-4 mt-3.5">
          <div className="flex-1 rounded-xl p-3 bg-white border-[0.5px] border-double border-[#9DBBF8] shadow-[0_7px_12px_rgba(0,0,0,.15)]">
            <div className="text-xl font-bold tnum tracking-tight">{Math.round(weekHours * 10) / 10}</div>
            <div className="text-[11px] text-muted mt-0.5">hours this week</div>
          </div>
          <div className="flex-1 rounded-xl p-3 bg-white border-[0.5px] border-double border-[#9DBBF8] shadow-[0_7px_12px_rgba(0,0,0,.15)]">
            <div className="text-xl font-bold tnum tracking-tight">{leaveDays}</div>
            <div className="text-[11px] text-muted mt-0.5">leave days left</div>
          </div>
        </div>

        {/* Announcements */}
        {announcements.length > 0 && (
          <>
            <div className="text-[13px] font-semibold mt-5 mb-2.5 text-[#252424]">Announcements</div>
            <div className="flex flex-col gap-2">
              {announcements.map((a, i) => {
                const ic = ANN_ICONS[i % ANN_ICONS.length]
                const Icon = ic.icon
                return (
                  <div key={a.id} className="flex items-center gap-2.5 rounded-xl p-3 bg-[#CBD9FB] border-[1.8px] border-dotted border-[#6DA2F2]">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border border-[#869FE4]" style={{ background: ic.bg, color: ic.fg }}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold truncate">{a.title}</div>
                      {a.body && <div className="text-[11px] text-muted mt-0.5 line-clamp-2">{a.body}</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
