import { useEffect, useState } from 'react'
import { Download, ChevronLeft, ChevronDown, Paperclip, Umbrella, Thermometer, Zap, CalendarDays } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useMobile } from '../MobileShell'
import { shortDate } from '../../lib/format'

const MCARD = 'bg-white text-ink rounded-2xl border border-[#95B3EF] shadow-[0_4px_12px_rgba(0,0,0,.27)]'

const TYPE_STYLE = [
  { match: /vacation|annual/i, icon: Umbrella, bg: '#dbeafe', fg: '#2563eb', label: 'Vacation' },
  { match: /sick|medical/i, icon: Thermometer, bg: '#fee2e2', fg: '#dc2626', label: 'Sick' },
  { match: /emergency|urgent/i, icon: Zap, bg: '#fef3c7', fg: '#d97706', label: 'Emergency' },
]
const styleFor = (name = '') =>
  TYPE_STYLE.find((s) => s.match.test(name)) || { icon: CalendarDays, bg: '#e0e7ff', fg: '#4338ca', label: name || 'Leave' }

function daysBetween(from, to) {
  if (!from || !to) return 0
  const a = new Date(from + 'T00:00:00')
  const b = new Date(to + 'T00:00:00')
  return Math.max(0, Math.round((b - a) / 86400000) + 1)
}

function stamp(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila',
  })
}

export default function MLeave() {
  const { profile, flash } = useMobile()
  const [view, setView] = useState('form') // 'form' | 'requests'
  const [types, setTypes] = useState([])
  const [requests, setRequests] = useState([])
  const [balances, setBalances] = useState([])
  const [form, setForm] = useState({ leave_type_id: '', date_from: '', date_to: '', reason: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = () => {
    supabase.from('leave_types').select('*').order('name').then(({ data }) => {
      setTypes(data || [])
      setForm((f) => (f.leave_type_id || !data?.length ? f : { ...f, leave_type_id: data[0].id }))
    })
    supabase
      .from('leave_requests')
      .select('*, leave_type:leave_types(name, color)')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setRequests(data || []))
    supabase
      .from('leave_balances')
      .select('*, leave_type:leave_types(name, color)')
      .eq('profile_id', profile.id)
      .then(({ data }) => setBalances(data || []))
  }

  useEffect(load, [profile.id])

  const days = daysBetween(form.date_from, form.date_to)

  const submit = async () => {
    setError('')
    if (!form.leave_type_id || !form.date_from || !form.date_to) return setError('Pick a leave type and both dates.')
    if (form.date_to < form.date_from) return setError('End date must be after the start date.')
    setSaving(true)
    try {
      const { error: err } = await supabase.from('leave_requests').insert({
        profile_id: profile.id,
        org_id: profile.org_id,
        leave_type_id: form.leave_type_id,
        date_from: form.date_from,
        date_to: form.date_to,
        days,
        reason: form.reason || null,
        status: 'pending',
      })
      if (err) throw err
      flash('Leave request submitted')
      setForm({ leave_type_id: types[0]?.id || '', date_from: '', date_to: '', reason: '' })
      load()
      setView('requests')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full rounded-lg bg-white text-ink border border-[#789EEA] px-3 py-2.5 text-sm outline-none focus:border-brand placeholder:text-faint'

  // Top three balance cards
  const statCards = balances.length
    ? balances.slice(0, 3)
    : types.slice(0, 3).map((t) => ({ id: t.id, balance: null, leave_type: { name: t.name } }))

  if (view === 'requests') {
    return (
      <div className="pb-6">
        <div className="flex items-center gap-2 px-4 pt-4 pb-2">
          <button onClick={() => setView('form')} className="w-8 h-8 flex items-center justify-center text-white">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-white">My requests</h1>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {requests.length === 0 ? (
            <div className="py-16 text-center text-sm text-white/45">No leave requests yet.</div>
          ) : (
            requests.map((r) => <RequestCard key={r.id} r={r} />)
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shadow-[0_4px_12px_rgba(0,0,0,.48)]">
        <h1 className="text-xl font-bold text-white">Leave</h1>
        <button onClick={() => setView('requests')} className="w-9 h-9 flex items-center justify-center">
          <Download className="w-[18px] h-[18px] text-white" />
        </button>
      </div>

      <div className="p-4">
        {/* Balance stat cards */}
        <div className="flex gap-2 mb-4">
          {statCards.map((b) => {
            const st = styleFor(b.leave_type?.name)
            const Icon = st.icon
            return (
              <div key={b.id} className={MCARD + ' flex-1 text-center p-3'}>
                <div
                  className="w-[34px] h-[34px] rounded-[10px] inline-flex items-center justify-center mb-2 shadow-[0_4px_12px_rgba(0,0,0,.48)]"
                  style={{ background: st.bg, color: st.fg }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-xl font-bold tnum">{b.balance != null ? Number(b.balance) : '—'}</div>
                <div className="text-[11px] text-muted">{st.label}</div>
              </div>
            )
          })}
        </div>

        {/* Request form */}
        <div className={MCARD + ' p-[18px]'}>
          <div className="flex items-center justify-between mb-3.5">
            <div className="text-sm font-semibold">Request leave</div>
            <button onClick={() => setView('requests')} className="text-xs font-medium text-brand">My requests →</button>
          </div>
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-xs font-medium mb-1.5">Type</div>
              <div className="relative">
                <select
                  className={inputCls + ' appearance-none pr-9'}
                  value={form.leave_type_id}
                  onChange={(e) => setForm({ ...form, leave_type_id: e.target.value })}
                >
                  {types.length === 0 && <option value="">No leave types</option>}
                  {types.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-faint absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
            <div className="flex gap-2.5">
              <div className="flex-1">
                <div className="text-xs font-medium mb-1.5">From</div>
                <input type="date" className={inputCls} value={form.date_from}
                  onChange={(e) => setForm({ ...form, date_from: e.target.value })} />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium mb-1.5">To</div>
                <input type="date" className={inputCls} value={form.date_to}
                  onChange={(e) => setForm({ ...form, date_to: e.target.value })} />
              </div>
            </div>
            {days > 0 && <div className="text-xs text-muted -mt-1">{days} day{days > 1 ? 's' : ''} requested</div>}
            <div>
              <div className="text-xs font-medium mb-1.5">Reason</div>
              <textarea rows={3} className={inputCls} value={form.reason}
                placeholder="Family matter in the province…"
                onChange={(e) => setForm({ ...form, reason: e.target.value })} />
            </div>
            <button className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-dashed border-[#4287EF] text-muted text-sm">
              <Paperclip className="w-3.5 h-3.5" /> Attach document (optional)
            </button>
            {error && <div className="text-xs text-red bg-red-tint border border-red/30 rounded-lg p-3">{error}</div>}
            <button
              disabled={saving}
              onClick={submit}
              className="h-[52px] rounded-[10px] font-semibold text-sm text-white disabled:opacity-50 shadow-[0_7px_12px_rgba(5,5,5,.62)]"
              style={{ background: 'linear-gradient(180deg, #1F58D5, #000E79, #144DC3)' }}
            >
              {saving ? 'Submitting…' : 'Submit request'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function RequestCard({ r }) {
  const st = styleFor(r.leave_type?.name)
  const rng = `${shortDate(r.date_from)} – ${shortDate(r.date_to)} • ${Number(r.days)} day${Number(r.days) > 1 ? 's' : ''}`

  const conf = {
    approved: { bg: '#47F40833', badge: 'bg-green-tint text-green', line: 'var(--color-green)' },
    pending: { bg: '#FF770066', badge: 'bg-amber-tint text-amber', line: 'var(--color-amber)' },
    rejected: { bg: '#E02B2B4D', badge: 'bg-red-tint text-red', line: 'var(--color-red)' },
  }[r.status] || { bg: 'rgba(255,255,255,.06)', badge: 'bg-bg-tint text-muted', line: 'var(--color-border)' }

  return (
    <div className="rounded-2xl p-3.5 text-white shadow-[0_4px_12px_rgba(16,16,17,.48)]" style={{ background: conf.bg }}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold">{r.leave_type?.name || 'Leave'}</div>
        <span className={'inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full border border-[#4996F6] capitalize ' + conf.badge}>
          <span className="w-1.5 h-1.5 rounded-full bg-current" /> {r.status}
        </span>
      </div>
      <div className="text-xs text-white/80 mb-3">{rng}</div>

      {r.status === 'rejected' && r.decision_note ? (
        <div className="text-xs p-2.5 rounded-md" style={{ background: '#fef2f2', color: '#991b1b' }}>
          "{r.decision_note}"{r.reviewer_name ? ` — ${r.reviewer_name}` : ''}
        </div>
      ) : (
        <div className="pl-3.5 relative" style={{ borderLeft: `2px solid ${conf.line}` }}>
          <span className="absolute -left-[6px] top-0 w-2.5 h-2.5 rounded-full bg-green border-2 border-white" />
          <div className="text-xs font-semibold">Submitted</div>
          <div className="text-[11px] text-white/70">{stamp(r.created_at)}</div>

          <span
            className="absolute -left-[6px] top-9 w-2.5 h-2.5 rounded-full border-2"
            style={r.status === 'approved'
              ? { background: 'var(--color-green)', borderColor: '#fff' }
              : { background: '#fff', borderColor: 'var(--color-amber)' }}
          />
          {r.status === 'approved' ? (
            <>
              <div className="text-xs font-semibold mt-2.5 text-green">Approved{r.reviewer_name ? ` by ${r.reviewer_name}` : ''}</div>
              <div className="text-[11px] text-white/70">{stamp(r.decided_at) || 'Confirmed'}</div>
            </>
          ) : (
            <>
              <div className="text-xs font-semibold mt-2.5 text-amber">Awaiting manager review</div>
              <div className="text-[11px] text-white/70">Usually within 24 hrs</div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
