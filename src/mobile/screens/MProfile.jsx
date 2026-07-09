import { useEffect, useState } from 'react'
import { LogOut, MapPin, BadgeCheck, Phone, CalendarClock } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useMobile } from '../MobileShell'
import { Avatar } from '../../admin/ui'
import { fetchMySite } from '../../lib/mobileApi'

export default function MProfile() {
  const { signOut, session } = useAuth()
  const { profile } = useMobile()
  const [site, setSite] = useState(null)

  useEffect(() => {
    fetchMySite(profile.site_id).then(setSite).catch(() => {})
  }, [profile.site_id])

  const rows = [
    { icon: BadgeCheck, label: 'Employee code', value: profile.employee_code || '—' },
    { icon: MapPin, label: 'Assigned site', value: site?.name || 'Unassigned' },
    { icon: CalendarClock, label: 'Schedule', value: profile.schedule || 'Not set' },
    { icon: Phone, label: 'Phone', value: profile.phone || '—' },
  ]

  return (
    <div className="p-4 pb-8">
      <h1 className="text-lg font-bold mb-5">Profile</h1>

      <div className="flex flex-col items-center py-6 rounded-2xl bg-white/[.04] border border-white/10 mb-4">
        <Avatar name={profile.full_name} src={profile.avatar_url} size={72} />
        <div className="text-base font-bold mt-3">{profile.full_name}</div>
        <div className="text-xs text-white/50 mt-0.5">{profile.position || 'Employee'}</div>
        <div className="text-[11px] text-white/35 mt-0.5">{session?.user?.email}</div>
      </div>

      <div className="rounded-xl bg-white/[.04] border border-white/10 divide-y divide-white/10 mb-6">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3 p-3.5">
            <r.icon className="w-4 h-4 text-white/40" />
            <span className="text-xs text-white/50 flex-1">{r.label}</span>
            <span className="text-[13px] font-semibold">{r.value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={signOut}
        className="w-full h-12 rounded-xl font-semibold text-sm text-red-300 bg-red-500/10 border border-red-500/30 flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" /> Sign out
      </button>

      <div className="text-center text-[10px] text-white/25 mt-6">
        TingSync · Workforce Management, Synced
      </div>
    </div>
  )
}
