import { useEffect, useMemo, useState } from 'react'
import {
  Users, Banknote, Package, CalendarDays, TrendingUp, AlertTriangle, ArrowRight,
  UserPlus, QrCode, PlusSquare, Receipt, Download, Calendar, Megaphone,
} from 'lucide-react'
import { fetchDashboard } from '../../lib/api'
import { useAdmin } from '../AdminShell'
import { Card, Avatar } from '../ui'
import { longDate, moneyShort, money, shortDate } from '../../lib/format'

function greeting() {
  const h = Number(
    new Intl.DateTimeFormat('en-PH', { hour: 'numeric', hour12: false, timeZone: 'Asia/Manila' }).format(new Date())
  )
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function timeAgo(iso) {
  if (!iso) return ''
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso)) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

const ACTIVITY_BADGE = {
  clock_in: { label: 'Verified', cls: 'bg-green-tint text-green' },
  clock_out: { label: 'Verified', cls: 'bg-green-tint text-green' },
  leave: { label: 'Pending', cls: 'bg-amber-tint text-amber' },
  task: { label: 'Tasks', cls: 'bg-brand-tint text-brand' },
  expense: { label: 'Pending', cls: 'bg-amber-tint text-amber' },
  manual: { label: 'Manual', cls: 'bg-purple-tint text-purple' },
}

const DONUT_COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#94a3b8']

function LineChart({ points }) {
  const W = 400
  const H = 160
  const max = Math.max(1, ...points.map((p) => p.count))
  const step = points.length > 1 ? W / (points.length - 1) : W
  const xy = points.map((p, i) => [i * step, H - 20 - (p.count / max) * (H - 48)])
  const line = xy.map(([x, y], i) => `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  return (
    <div className="h-40 rounded-md overflow-hidden">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="w-full h-full" style={{ background: '#81b89b' }}>
        <defs>
          <linearGradient id="dashTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2563eb" stopOpacity=".18" />
            <stop offset="1" stopColor="#2563eb" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g stroke="#e5e7eb" strokeWidth="1" opacity=".7">
          <line x1="0" y1="40" x2={W} y2="40" />
          <line x1="0" y1="80" x2={W} y2="80" />
          <line x1="0" y1="120" x2={W} y2="120" />
        </g>
        <path d={`${line} L ${W} ${H} L 0 ${H} Z`} fill="url(#dashTrendFill)" />
        <path d={line} stroke="#2563eb" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <g fill="#2563eb">
          {xy.map(([x, y], i) => (points.length <= 8 || i % 4 === 0) && <circle key={i} cx={x} cy={y} r="3" />)}
        </g>
      </svg>
    </div>
  )
}

function Donut({ slices, centerLabel }) {
  let offset = 25
  return (
    <svg viewBox="0 0 42 42" className="w-40 h-40 shrink-0">
      <circle cx="21" cy="21" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="6" />
      {slices.map((s, i) => {
        const el = (
          <circle
            key={s.category}
            cx="21" cy="21" r="15.9" fill="none"
            stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
            strokeWidth="6"
            strokeDasharray={`${s.pct} ${100 - s.pct}`}
            strokeDashoffset={offset}
          />
        )
        offset -= s.pct
        return el
      })}
      <text x="21" y="20" textAnchor="middle" fontSize="4.5" fontWeight="700" fill="#0f172a">{centerLabel}</text>
      <text x="21" y="25" textAnchor="middle" fontSize="2.5" fill="#94a3b8">spent</text>
    </svg>
  )
}

export default function Dashboard() {
  const { profile, navigate, currency } = useAdmin()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('7D')

  useEffect(() => {
    let active = true
    fetchDashboard()
      .then((d) => active && setData(d))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [])

  const trend = useMemo(() => (data ? (range === '7D' ? data.trend7 : data.trend30) : []), [data, range])

  if (loading || !data) return <div className="text-sm text-muted p-8 text-center">Loading dashboard…</div>

  const todayCount = data.present + data.late
  const yesterday = data.trend7[data.trend7.length - 2]?.count ?? 0
  const diff = todayCount - yesterday
  const pct = data.employeeCount ? Math.round((todayCount / data.employeeCount) * 1000) / 10 : 0

  const exportSummary = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Date', data.today],
      ['Attendance today', `${todayCount}/${data.employeeCount}`],
      ['Expenses this month', data.expenseTotal],
      ['Inventory items', data.inventoryCount],
      ['Low stock', data.lowStock],
      ['Pending leave', data.pendingCount],
      ['Open tasks', data.tasksOpenCount],
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `tingsync-dashboard-${data.today}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const quickActions = [
    { icon: UserPlus, label: 'Add employee', to: 'employees' },
    { icon: QrCode, label: 'Generate QR code', to: 'qr' },
    { icon: Banknote, label: 'Run payroll', to: 'payroll' },
    { icon: PlusSquare, label: 'Create task', to: 'tasks' },
    { icon: Receipt, label: 'Add expense', to: 'expenses' },
  ]

  return (
    <div className="max-w-6xl">
      {/* Page head */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{greeting()}, {profile.full_name?.split(' ')[0]}</h1>
          <div className="text-xs text-ink mt-0.5">{longDate(data.today)} • here's what's happening today.</div>
        </div>
        <button
          onClick={exportSummary}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-[13px] font-medium bg-white border border-border rounded-md shadow-pop hover:bg-bg-soft"
        >
          <Download size={14} /> Export
        </button>
      </div>

      {/* Gradient metric cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
        <div className="metric-grad-green border rounded-lg p-4 text-white shadow-pop">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[.4px]">
            <Users size={13} /> Today's Attendance
          </div>
          <div className="text-2xl font-bold mt-1.5 tnum">
            {todayCount}<span className="text-[13px] font-medium text-black/70">/{data.employeeCount}</span>
          </div>
          <div className="text-[11px] text-black/70 mt-1 inline-flex items-center gap-1">
            <TrendingUp size={11} /> {pct}% • {diff >= 0 ? '+' : ''}{diff} vs yesterday
          </div>
        </div>

        <div className="metric-grad-olive border rounded-lg p-4 text-white shadow-pop">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[.4px]">
            <Banknote size={13} /> Monthly Expenses
          </div>
          <div className="text-2xl font-bold mt-1.5 tnum">{moneyShort(data.expenseTotal)}</div>
          <div className="text-[11px] text-black/70 mt-1 inline-flex items-center gap-1">
            <TrendingUp size={11} /> {money(data.expenseToday)} today
          </div>
        </div>

        <div className="metric-grad-teal border rounded-lg p-4 text-white shadow-pop">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[.4px]">
            <Package size={13} /> Inventory Items
          </div>
          <div className="text-2xl font-bold mt-1.5 tnum">{data.inventoryCount.toLocaleString()}</div>
          <div className="mt-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-tint text-[#1A3C03]">
              <AlertTriangle size={10} /> {data.lowStock} low-stock
            </span>
          </div>
        </div>

        <button onClick={() => navigate('leave')} className="metric-grad-red border rounded-lg p-4 text-white shadow-pop text-left">
          <div className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[.4px]">
            <CalendarDays size={13} /> Pending Leave
          </div>
          <div className="text-2xl font-bold mt-1.5 tnum">{data.pendingCount}</div>
          <div className="text-[11px] mt-1 inline-flex items-center gap-1 font-medium">
            Review now <ArrowRight size={11} className="text-[#c0a9a9]" />
          </div>
        </button>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
        <Card className="p-4 shadow-pop">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-[13px] font-semibold">Attendance trend</div>
              <div className="text-xs text-muted">Last {range === '7D' ? '7' : '30'} days</div>
            </div>
            <div className="inline-flex bg-bg-soft p-[3px] rounded-md border border-border shadow-soft-pop">
              {['7D', '30D'].map((r) => (
                <button
                  key={r}
                  onClick={() => setRange(r)}
                  className={
                    'px-2.5 py-1 rounded text-xs font-medium ' +
                    (range === r ? 'seg-active-grad' : 'text-ink-soft')
                  }
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <LineChart points={trend} />
          <div className="flex justify-between mt-2 text-[10px] text-muted px-1">
            {(range === '7D' ? trend : trend.filter((_, i) => i % 5 === 0)).map((t) => (
              <span key={t.date}>{shortDate(t.date)}</span>
            ))}
          </div>
        </Card>

        <Card className="p-4 shadow-pop">
          <div className="mb-3">
            <div className="text-[13px] font-semibold">Expense breakdown</div>
            <div className="text-xs text-muted">
              {new Date().toLocaleDateString('en-PH', { month: 'long', year: 'numeric', timeZone: 'Asia/Manila' })}
            </div>
          </div>
          {data.expenseBreakdown.length === 0 ? (
            <div className="text-xs text-faint py-10 text-center">No expenses recorded this month.</div>
          ) : (
            <div className="flex items-center gap-5">
              <Donut slices={data.expenseBreakdown} centerLabel={moneyShort(data.expenseTotal)} key={currency} />
              <div className="flex flex-col gap-2.5 flex-1 min-w-0">
                {data.expenseBreakdown.map((s, i) => (
                  <div key={s.category} className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-[2px] shrink-0" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <div className="flex-1 text-xs capitalize truncate">{s.category}</div>
                    <div className="text-xs font-semibold tnum">{s.pct}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Activity + quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 overflow-hidden shadow-pop">
          <div className="card-head-teal flex items-center justify-between px-4 py-4 shadow-pop">
            <div className="text-[13px] font-semibold capitalize">Recent activity</div>
            <button onClick={() => navigate('attendance')} className="text-xs font-medium text-white/90 hover:text-white">View all</button>
          </div>
          {data.activity.length === 0 ? (
            <div className="text-xs text-faint py-10 text-center">No activity yet today.</div>
          ) : (
            <div>
              {data.activity.map((a) => {
                const badge = ACTIVITY_BADGE[a.type] || { label: a.type, cls: 'bg-bg-tint text-ink-soft' }
                return (
                  <div key={a.id} className="flex items-center gap-3 px-3 py-2.5 border-b border-border last:border-b-0 hover:bg-bg-soft">
                    <Avatar name={a.actor_name || '??'} size={28} />
                    <div className="flex-1 min-w-0 text-[13px] truncate">
                      <span className="font-semibold">{a.actor_name || 'System'}</span>{' '}
                      <span className="text-muted">{a.message}</span>
                    </div>
                    <span className={'text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ' + badge.cls}>{badge.label}</span>
                    <span className="text-[11px] text-muted whitespace-nowrap">{timeAgo(a.created_at)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card className="overflow-hidden shadow-pop">
          <div className="card-head-teal px-4 py-4 shadow-pop">
            <div className="text-[13px] font-semibold">Quick actions</div>
          </div>
          <div className="flex flex-col gap-1 p-2.5">
            {quickActions.map((q) => (
              <button
                key={q.label}
                onClick={() => navigate(q.to)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium text-ink-soft hover:bg-bg-soft hover:text-ink"
              >
                <q.icon size={16} className="text-faint" /> {q.label}
              </button>
            ))}
          </div>
          <div className="p-3.5 border-t border-border bg-bg-tint">
            <div className="text-[11px] font-semibold text-muted uppercase tracking-[.4px] mb-2">Upcoming</div>
            {data.run && (
              <div className="flex items-center gap-2.5 mb-2">
                <Calendar size={14} className="text-brand shrink-0" />
                <div className="flex-1 text-xs">
                  <div className="font-medium">Payroll period ends</div>
                  <div className="text-muted text-[11px]">{shortDate(data.run.period_end)}</div>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2.5 mb-2">
              <Users size={14} className="text-amber shrink-0" />
              <div className="flex-1 text-xs">
                <div className="font-medium">{data.onLeave} employee{data.onLeave === 1 ? '' : 's'} on leave</div>
                <div className="text-muted text-[11px]">today</div>
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <Megaphone size={14} className="text-purple shrink-0" />
              <div className="flex-1 text-xs">
                <div className="font-medium">{data.tasksOpenCount} open task{data.tasksOpenCount === 1 ? '' : 's'}</div>
                <div className="text-muted text-[11px]">{data.tasksDoneWeekCount} done this week</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
