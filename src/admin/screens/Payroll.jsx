import { useEffect, useState } from 'react'
import { Lock } from 'lucide-react'
import { fetchPayrollRun, lockPayrollRun } from '../../lib/api'
import { useAdmin } from '../AdminShell'
import { Card, Pill, Avatar, Button } from '../ui'
import { money, shortDate } from '../../lib/format'

export default function Payroll() {
  const { flash } = useAdmin()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    fetchPayrollRun().then(setData).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function lock() {
    if (!data.run?.id) return
    if (!confirm('Lock this payroll run? This cannot be undone easily.')) return
    await lockPayrollRun(data.run.id)
    flash('Payroll run locked')
    load()
  }

  if (loading || !data) return <div className="p-8 text-center text-sm text-muted">Loading…</div>

  const { run, rows, totals, count } = data

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold">Payroll</h1>
          <div className="text-sm text-muted mt-1">
            {run ? `${shortDate(run.period_start)} – ${shortDate(run.period_end)}` : 'No period set'} • {count} employees
          </div>
        </div>
        {run?.status !== 'locked' && (
          <Button variant="primary" onClick={lock}><Lock size={14} /> Lock payroll run</Button>
        )}
        {run?.status === 'locked' && <Pill kind="locked" />}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card className="p-4"><div className="text-xs text-muted mb-1">Gross</div><div className="text-xl font-bold tnum">{money(totals.gross)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted mb-1">Deductions</div><div className="text-xl font-bold tnum">{money(totals.statutory)}</div></Card>
        <Card className="p-4"><div className="text-xs text-muted mb-1">Net pay</div><div className="text-xl font-bold tnum">{money(totals.net)}</div></Card>
      </div>

      <Card>
        {rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted">No employees with a daily rate set.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-border">
                <th className="font-medium py-2.5 px-4">Employee</th>
                <th className="font-medium py-2.5 px-4">Position</th>
                <th className="font-medium py-2.5 px-4 text-right">Gross</th>
                <th className="font-medium py-2.5 px-4 text-right">Deductions</th>
                <th className="font-medium py-2.5 px-4 text-right">Net Pay</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-bg-soft">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.full_name} src={r.avatar_url} size={26} />
                      <span className="text-xs font-medium">{r.full_name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs">{r.position || '—'}</td>
                  <td className="py-3 px-4 text-xs text-right tnum">{money(r.gross)}</td>
                  <td className="py-3 px-4 text-xs text-right tnum">{money(r.statutory)}</td>
                  <td className="py-3 px-4 text-xs text-right tnum font-semibold">{money(r.net)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
