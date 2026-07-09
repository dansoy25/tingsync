import { useEffect, useState } from 'react'
import { Camera, FileText, Download, ChevronDown, Check } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useMobile } from '../MobileShell'
import { supabase } from '../../lib/supabase'
import { fetchMySite } from '../../lib/mobileApi'
import { money, shortDate, initials, avatarColor } from '../../lib/format'

const MCARD = 'bg-white text-ink rounded-2xl border border-[#558DFF]/70 shadow-[0_4px_12px_rgba(0,0,0,.27)]'

export default function MProfile() {
  const { signOut } = useAuth()
  const { profile, navigate } = useMobile()
  const [site, setSite] = useState(null)
  const [slips, setSlips] = useState([])
  const [notif, setNotif] = useState(profile.notifications_enabled ?? true)

  useEffect(() => {
    fetchMySite(profile.site_id).then(setSite).catch(() => {})
    supabase
      .from('payslips')
      .select('*')
      .eq('profile_id', profile.id)
      .order('period_start', { ascending: false })
      .limit(2)
      .then(({ data }) => setSlips(data || []))
  }, [profile.site_id, profile.id])

  const toggleNotif = async () => {
    const next = !notif
    setNotif(next)
    await supabase.from('profiles').update({ notifications_enabled: next }).eq('id', profile.id)
  }

  const c = avatarColor(profile.full_name || '')

  return (
    <div className="pb-6">
      {/* Blue gradient header */}
      <div
        className="text-center px-4 pt-5 pb-3 rounded-b-[25px] shadow-[0_4px_12px_rgba(0,0,0,.15)]"
        style={{ background: 'linear-gradient(200deg, #013064, #2C73C3, #01254E)' }}
      >
        <div className="inline-block relative">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-24 h-24 rounded-full object-cover shadow-[0_7px_12px_rgba(0,0,0,.62)]" />
          ) : (
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-[32px] font-bold shadow-[0_7px_12px_rgba(0,0,0,.62)]"
              style={{ background: '#2563eb', color: '#fff' }}
            >
              {initials(profile.full_name) || 'ME'}
            </div>
          )}
          <button className="absolute bottom-0 right-0 w-[30px] h-[30px] rounded-full bg-white border border-border flex items-center justify-center shadow">
            <Camera className="w-3.5 h-3.5 text-muted" />
          </button>
        </div>
        <div className="text-xl font-bold mt-3.5 text-white">{profile.full_name}</div>
        <div className="text-[13px] text-white/85 mt-0.5">
          {(profile.position || 'Employee')}{profile.employee_code ? ` • ${profile.employee_code}` : ''}
        </div>
        <div className="flex items-center justify-center gap-2 mt-2.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-green-tint text-green border border-[#4793F3]">
            <span className="w-1.5 h-1.5 rounded-full bg-green" />
            {profile.status === 'active' || !profile.status ? 'Active' : profile.status}
          </span>
          {profile.daily_rate != null && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-brand-tint text-brand border border-[#4793F3]">
              <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              {money(profile.daily_rate)}/day
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {/* Info card */}
        <div className={MCARD + ' px-4'}>
          <Row label="Phone" value={profile.phone || '—'} />
          <Row label="Site" value={site?.name || 'Unassigned'} border />
          <Row label="Schedule" value={profile.schedule || 'Not set'} border />
        </div>

        {/* Settings card */}
        <div className={MCARD + ' px-4'}>
          <div className="flex items-center justify-between py-3">
            <span className="text-[13px]">Face enrolled</span>
            {profile.face_enrolled ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full bg-green-tint text-green border border-[#7DE855]">
                <Check className="w-3 h-3" /> Done
              </span>
            ) : (
              <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-bg-tint text-muted">Not yet</span>
            )}
          </div>
          <button onClick={toggleNotif} className="w-full flex items-center justify-between py-3 border-t border-border">
            <span className="text-[13px]">Notifications</span>
            <span
              className={'w-8 h-[18px] rounded-full relative transition-colors ' + (notif ? '' : 'bg-border')}
              style={notif ? { background: 'linear-gradient(180deg, #2563EB, #002BB4, #2563EB)' } : undefined}
            >
              <span className={'absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-all ' + (notif ? 'left-[16px]' : 'left-0.5')} />
            </span>
          </button>
          <div className="flex items-center justify-between py-3 border-t border-border">
            <span className="text-[13px]">Language</span>
            <span className="flex items-center gap-1 text-[13px] font-semibold">English <ChevronDown className="w-3 h-3 text-faint" /></span>
          </div>
        </div>

        {/* Payslips preview */}
        <div className="text-[13px] font-semibold text-white mt-1">Payslips</div>
        {slips.length === 0 ? (
          <div className={MCARD + ' px-4 py-4 text-[13px] text-muted text-center'}>No payslips yet.</div>
        ) : (
          <div className={MCARD + ' px-4'}>
            {slips.map((s, i) => (
              <button
                key={s.id}
                onClick={() => navigate('payslips')}
                className={'flex items-center gap-2.5 w-full py-3 text-left ' + (i > 0 ? 'border-t border-border' : '')}
              >
                <FileText className="w-4 h-4 text-brand shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold">{shortDate(s.period_start)} – {shortDate(s.period_end)}</div>
                  <div className="text-[11px] text-muted mt-0.5">{money(s.net)} • {s.status === 'paid' ? 'Paid' : (s.status || 'Ready')}</div>
                </div>
                <Download className="w-3.5 h-3.5 text-faint" />
              </button>
            ))}
          </div>
        )}

        {/* Log out */}
        <button
          onClick={signOut}
          className="h-12 rounded-xl font-semibold text-sm text-[#F9F9F9] mt-1 shadow-[3px_4px_12px_rgba(0,0,0,.62)]"
          style={{ background: 'linear-gradient(180deg, #3B0000, #680303, #1F0000)' }}
        >
          Log out
        </button>
      </div>
    </div>
  )
}

function Row({ label, value, border }) {
  return (
    <div className={'flex items-center justify-between py-3 ' + (border ? 'border-t border-border' : '')}>
      <span className="text-[13px] text-muted">{label}</span>
      <span className="text-[13px] font-semibold">{value}</span>
    </div>
  )
}
