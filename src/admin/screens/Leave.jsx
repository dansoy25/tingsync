import { useEffect, useState } from 'react'
import { fetchLeaveQueue, fetchTeamBalances, decideLeave } from '../../lib/api'
import { useAdmin } from '../AdminShell'
import { Card, Pill, Avatar, Button } from '../ui'
import { shortDate } from '../../lib/format'

export default function Leave() {
  const { profile, flash } = useAdmin()
  const [rows, setRows] = useState([])
  const [balances, setBalances] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    Promise.all([fetchLeaveQueue(), fetchTeamBalances()])
      .then(([r, b]) => { setRows(r); setBalances(b) })
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  const pending = rows.filter((r) => r.status === 'pending')

  async function decide(id, decision) {
    await decideLeave(id, decision, profile.full_name, null)
    flash(decision === 'approved' ? 'Leave approved' : 'Leave rejected')
    load()
  }

  return (
    <div className="max-w-6xl">
      <div className="mb-4 flex items-center gap-2">
        <h1 className="text-xl font-bold">Leave Management</h1>
        {pending.length > 0 && <Pill kind="pending">{pending.length} pending</Pill>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted">Loading…</div>
          ) : rows.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted">No leave requests.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-border">
                  <th className="font-medium py-2.5 px-4">Employee</th>
                  <th className="font-medium py-2.5 px-4">Type</th>
                  <th className="font-medium py-2.5 px-4">Dates</th>
                  <th className="font-medium py-2.5 px-4">Days</th>
                  <th className="font-medium py-2.5 px-4">Status</th>
                  <th className="font-medium py-2.5 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border last:border-0 hover:bg-bg-soft">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.profile?.full_name} src={r.profile?.avatar_url} size={26} />
                        <span className="text-xs font-medium">{r.profile?.full_name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-xs">{r.leave_type?.name}</td>
                    <td className="py-3 px-4 text-xs">{shortDate(r.date_from)} – {shortDate(r.date_to)}</td>
                    <td className="py-3 px-4 text-xs">{r.days}</td>
                    <td className="py-3 px-4"><Pill kind={r.status} /></td>
                    <td className="py-3 px-4 text-right">
                      {r.status === 'pending' && (
                        <div className="flex gap-1.5 justify-end">
                          <Button size="sm" onClick={() => decide(r.id, 'approved')}>Approve</Button>
                          <Button size="sm" variant="danger" onClick={() => decide(r.id, 'rejected')}>Reject</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>

        <Card className="p-5">
          <div className="text-sm font-semibold mb-3">Balances by team</div>
          {balances.length === 0 ? (
            <div className="text-xs text-faint">No data yet.</div>
          ) : (
            <div className="flex flex-col gap-3">
              {balances.map((b) => (
                <div key={b.name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{b.name}</span>
                    <span className="text-faint">{b.avg} days avg</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-bg-tint overflow-hidden">
                    <div className="h-full bg-brand rounded-full" style={{ width: `${Math.min(100, b.avg * 6)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
