import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { useMobile } from '../MobileShell'
import { shortDate } from '../../lib/format'

const TABS = [
  { key: 'new', label: 'New request' },
  { key: 'requests', label: 'My requests' },
  { key: 'balance', label: 'Balance' },
]

const STATUS_COLORS = {
  pending: 'text-amber-300 bg-amber-500/15',
  approved: 'text-emerald-300 bg-emerald-500/15',
  rejected: 'text-red-300 bg-red-500/15',
}

function daysBetween(from, to) {
  if (!from || !to) return 0
  const a = new Date(from + 'T00:00:00')
  const b = new Date(to + 'T00:00:00')
  return Math.max(0, Math.round((b - a) / 86400000) + 1)
}

export default function MLeave() {
  const { profile, flash } = useMobile()
  const [tab, setTab] = useState('new')
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
    if (!form.leave_type_id || !form.date_from || !form.date_to) {
      return setError('Pick a leave type and both dates.')
    }
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
      setTab('requests')
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const inputCls =
    'w-full rounded-xl bg-white/[.06] border border-white/15 px-3 py-2.5 text-sm outline-none focus:border-brand-light placeholder:text-white/30 [color-scheme:dark]'

  return (
    <div className="p-4 pb-8">
      <h1 className="text-lg font-bold mb-4">Leave</h1>

      <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-white/[.06] border border-white/10 mb-5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`py-1.5 rounded-lg text-xs font-medium transition-colors ${
              tab === t.key ? 'bg-brand text-white' : 'text-white/50'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'new' && (
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Leave type</label>
            <select
              className={inputCls}
              value={form.leave_type_id}
              onChange={(e) => setForm({ ...form, leave_type_id: e.target.value })}
            >
              {types.map((t) => (
                <option key={t.id} value={t.id} className="bg-[#14161c]">{t.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">From</label>
              <input type="date" className={inputCls} value={form.date_from}
                onChange={(e) => setForm({ ...form, date_from: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/60 mb-1.5">To</label>
              <input type="date" className={inputCls} value={form.date_to}
                onChange={(e) => setForm({ ...form, date_to: e.target.value })} />
            </div>
          </div>
          {days > 0 && <div className="text-xs text-white/50">{days} day{days > 1 ? 's' : ''} requested</div>}
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">Reason (optional)</label>
            <textarea rows={3} className={inputCls} value={form.reason}
              placeholder="Add a short note for your approver…"
              onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          </div>
          {error && <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">{error}</div>}
          <button
            disabled={saving}
            onClick={submit}
            className="h-12 rounded-xl font-semibold text-sm text-white disabled:opacity-50"
            style={{ background: 'linear-gradient(180deg, #1d4ed8, #172554, #1d4ed8)' }}
          >
            {saving ? 'Submitting…' : 'Submit request'}
          </button>
        </div>
      )}

      {tab === 'requests' && (
        requests.length === 0 ? (
          <div className="py-16 text-center text-sm text-white/45">No leave requests yet.</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {requests.map((r) => (
              <div key={r.id} className="rounded-xl p-3.5 bg-white/[.04] border border-white/10">
                <div className="flex items-center justify-between">
                  <div className="text-[13px] font-semibold">{r.leave_type?.name || 'Leave'}</div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_COLORS[r.status] || 'text-white/50 bg-white/10'}`}>
                    {r.status}
                  </span>
                </div>
                <div className="text-[11px] text-white/45 mt-1">
                  {shortDate(r.date_from)} — {shortDate(r.date_to)} • {Number(r.days)} day{Number(r.days) > 1 ? 's' : ''}
                </div>
                {r.reason && <div className="text-xs text-white/60 mt-1.5">{r.reason}</div>}
                {r.decision_note && (
                  <div className="text-[11px] text-white/45 mt-1.5 border-t border-white/10 pt-1.5">
                    {r.reviewer_name}: {r.decision_note}
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'balance' && (
        balances.length === 0 ? (
          <div className="py-16 text-center text-sm text-white/45">No leave balances set up yet.</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {balances.map((b) => (
              <div key={b.id} className="flex items-center justify-between rounded-xl p-3.5 bg-white/[.04] border border-white/10">
                <div className="text-[13px] font-semibold">{b.leave_type?.name || 'Leave'}</div>
                <div className="text-sm font-bold tnum">{Number(b.balance)} <span className="text-[11px] font-normal text-white/45">days</span></div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
