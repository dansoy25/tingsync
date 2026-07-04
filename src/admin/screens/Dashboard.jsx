import { useEffect, useState } from 'react'
import { Users, Clock, AlertCircle, Calendar, CheckSquare, TrendingUp } from 'lucide-react'
import { fetchDashboard } from '../../lib/api'
import { useAdmin } from '../AdminShell'
import { Card, Pill, Avatar } from '../ui'
import { longDate, shortDate } from '../../lib/format'

export default function Dashboard() {
  const { profile, navigate } = useAdmin()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetchDashboard()
      .then((d) => active && setData(d))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  if (loading || !data) return <div className="text-sm text-muted p-8 text-center">Loading dashboard…</div>

  const stats = [
    { label: 'Employees', value: data.employeeCount, icon: Users, bg: '#dde2fb', fg: '#312e81' },
    { label: 'Present today', value: data.present, icon: Clock, bg: '#dcf2e6', fg: '#166534' },
    { label: 'Absent today', value: data.absent, icon: AlertCircle, bg: '#fbd5db', fg: '#9f1239' },
    { label: 'On leave', value: data.onLeave, icon: Calendar, bg: '#fde8c1', fg: '#92400e' },
    { label: 'Open tasks', value: data.tasksOpenCount, icon: CheckSquare, bg: '#e0e7ff', fg: '#3730a3' },
  ]

  const maxTrend = Math.max(1, ...data.trend.map((t) => t.count))

  return (
    <div className="max-w-6xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Good morning, {profile.full_name?.split(' ')[0]}</h1>
        <div className="text-sm text-muted mt-1">{longDate(data.today)}</div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: s.bg, color: s.fg }}>
              <s.icon size={17} />
            </div>
            <div className="text-2xl font-bold tnum">{s.value}</div>
            <div className="text-xs text-muted mt-0.5">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">Attendance — last 7 days</div>
            <TrendingUp size={16} className="text-faint" />
          </div>
          <div className="flex items-end gap-3 h-32">
            {data.trend.map((t) => (
              <div key={t.date} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-brand-tint rounded-md relative"
                  style={{ height: `${Math.max(6, (t.count / maxTrend) * 100)}%` }}
                >
                  <div className="absolute inset-0 bg-brand rounded-md opacity-80" />
                </div>
                <div className="text-[10px] text-faint">{shortDate(t.date)}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm font-semibold">Pending approvals</div>
            <Pill>{data.pendingCount}</Pill>
          </div>
          {data.pending.length === 0 ? (
            <div className="text-xs text-faint py-6 text-center">Nothing pending. 🎉</div>
          ) : (
            <div className="flex flex-col gap-3 max-h-56 overflow-y-auto">
              {data.pending.slice(0, 6).map((p) => (
                <div key={p.id} className="flex items-center gap-2.5">
                  <Avatar name={p.profile?.full_name} src={p.profile?.avatar_url} size={28} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate">{p.profile?.full_name}</div>
                    <div className="text-[11px] text-faint truncate">{p.reason || 'Leave request'}</div>
                  </div>
                </div>
              ))}
              <button onClick={() => navigate('leave')} className="text-xs font-medium text-brand text-left mt-1">
                Review all →
              </button>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
