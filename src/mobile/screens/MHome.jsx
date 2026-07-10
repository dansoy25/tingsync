import { useEffect, useState } from 'react'
import { Play, Megaphone } from 'lucide-react'
import { useMobile } from '../MobileShell'
import { Avatar } from '../../admin/ui'
import logoMark from '../../assets/logo-mark.png'
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
    <div className="pb-6">
      {/* Header */}
      <div
        className="px-5 pt-6 pb-24 rounded-b-3xl border-b border-teal-400/30"
        style={{ background: 'linear-gradient(180deg, #02857f, #0b3946 70%, #14161c)' }}
      >
        <div className="text-center mb-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 border border-white/20 backdrop-blur">
            <img src={logoMark} alt="" className="w-6 h-6" />
            <span className="text-xl font-extrabold tracking-tight">
              ting<span className="text-sky-300">sync</span>
            </span>
          </div>
          <div className="mt-2 text-[9px] font-semibold tracking-[2.4px] uppercase text-white/50">
            Attendance · Selfie + GPS Verified
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] text-white/85">{greeting()}</div>
            <div className="text-xl font-bold mt-0.5">{profile.full_name}</div>
            <div className="text-xs text-white/70 mt-0.5">{dateLabel}</div>
          </div>
          <button onClick={() => navigate('profile')} className="rounded-full ring-2 ring-white/30">
            <Avatar name={profile.full_name} src={profile.avatar_url} size={44} />
          </button>
        </div>
      </div>

      {/* Today card */}
      <div className="px-4 -mt-16 relative z-[2]">
        <div
          className="rounded-2xl p-4.5 shadow-[0_10px_30px_rgba(0,0,0,.45)] p-5"
          style={{ background: 'linear-gradient(200deg, #05437c, #12729c, #05437c)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold tracking-[.6px] text-sky-100/70">TODAY</span>
            {loading ? null : clockedIn ? (
              <span className="text-[11px] font-semibold text-emerald-300">● Clocked in</span>
            ) : doneToday ? (
              <span className="text-[11px] font-semibold text-sky-200">✓ Shift complete</span>
            ) : (
              <span className="text-[11px] font-medium text-white/50">Not clocked in</span>
            )}
          </div>

          {loading ? (
            <div className="py-6 text-center text-sm text-white/60">Loading…</div>
          ) : clockedIn ? (
            <>
              <div className="flex items-center gap-4">
                <div>
                  <div className="text-[32px] font-bold leading-none tnum tracking-tight">{hm(hoursSoFar)}</div>
                  <div className="text-[11px] text-sky-100/70 mt-1">hours so far</div>
                </div>
                <div className="w-px h-9 bg-white/20" />
                <div className="flex-1">
                  <div className="text-[13px] font-semibold">{today.site?.name || 'No site'}</div>
                  <div className="text-[11px] text-sky-100/70 mt-0.5">In at {timePH(today.clock_in)}</div>
                </div>
              </div>
              <button
                onClick={() => navigate('checkin', { mode: 'out', row: today })}
                className="mt-4 w-full h-[52px] rounded-xl font-semibold text-sm text-white shadow-[0_6px_16px_rgba(0,0,0,.4)] active:scale-[.98] transition-transform"
                style={{ background: 'linear-gradient(180deg, #7f1d1d, #b91c1c, #7f1d1d)' }}
              >
                Clock out
              </button>
            </>
          ) : doneToday ? (
            <div className="flex items-center gap-4">
              <div>
                <div className="text-[32px] font-bold leading-none tnum tracking-tight">{hm(today.hours)}</div>
                <div className="text-[11px] text-sky-100/70 mt-1">hours today</div>
              </div>
              <div className="w-px h-9 bg-white/20" />
              <div className="flex-1">
                <div className="text-[13px] font-semibold">{today.site?.name || 'No site'}</div>
                <div className="text-[11px] text-sky-100/70 mt-0.5">
                  {timePH(today.clock_in)} — {timePH(today.clock_out)}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="text-[15px] font-medium mb-1">Ready to start your shift?</div>
              <div className="text-xs text-sky-100/70">
                {profile.schedule ? `Scheduled: ${profile.schedule}` : 'Clock in with selfie + GPS verification.'}
              </div>
              <button
                onClick={() => navigate('checkin', { mode: 'in' })}
                className="mt-4 w-full h-[52px] rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 shadow-[0_6px_16px_rgba(0,0,0,.4)] active:scale-[.98] transition-transform"
                style={{ background: 'linear-gradient(180deg, #1e40af, #172554, #1e40af)' }}
              >
                <Play className="w-4 h-4" /> Clock in
              </button>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="flex gap-3 mt-3.5">
          <div className="flex-1 rounded-xl p-3 bg-white/[.04] border border-white/10">
            <div className="text-xl font-bold tnum tracking-tight">{Math.round(weekHours * 10) / 10}</div>
            <div className="text-[11px] text-white/45 mt-0.5">hours this week</div>
          </div>
          <div className="flex-1 rounded-xl p-3 bg-white/[.04] border border-white/10">
            <div className="text-xl font-bold tnum tracking-tight">{leaveDays}</div>
            <div className="text-[11px] text-white/45 mt-0.5">leave days left</div>
          </div>
        </div>

        {/* Announcements */}
        {announcements.length > 0 && (
          <>
            <div className="text-[13px] font-semibold mt-5 mb-2.5">Announcements</div>
            <div className="flex flex-col gap-2">
              {announcements.map((a) => (
                <div key={a.id} className="flex items-center gap-2.5 rounded-xl p-3 bg-white/[.04] border border-white/10">
                  <div className="w-9 h-9 rounded-lg bg-amber-400/15 text-amber-300 flex items-center justify-center shrink-0">
                    <Megaphone className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold truncate">{a.title}</div>
                    {a.body && <div className="text-[11px] text-white/45 mt-0.5 line-clamp-2">{a.body}</div>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
