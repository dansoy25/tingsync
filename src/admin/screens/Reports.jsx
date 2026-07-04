import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { fetchDepartmentReport } from '../../lib/api'
import { Card, Button, Select } from '../ui'

export default function Reports() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDepartmentReport().then(setRows).finally(() => setLoading(false))
  }, [])

  function exportCsv() {
    const header = 'Department,Headcount,Hours,Attendance %\n'
    const body = rows.map((r) => `${r.department},${r.headcount},${r.hours},${r.attendanceRate}`).join('\n')
    const blob = new Blob([header + body], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tingsync-report-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-bold">Reports</h1>
          <div className="text-sm text-muted mt-1">Generate or schedule operational reports</div>
        </div>
        <Button variant="primary" onClick={exportCsv} disabled={rows.length === 0}><Download size={14} /> Export CSV</Button>
      </div>

      <Card className="p-5 mt-4">
        <div className="grid grid-cols-3 gap-3 mb-5">
          <div>
            <div className="text-xs font-medium text-ink-soft mb-1.5">Employees</div>
            <Select defaultValue="all"><option value="all">All employees</option><option value="dept">By department</option></Select>
          </div>
          <div>
            <div className="text-xs font-medium text-ink-soft mb-1.5">Period</div>
            <Select defaultValue="30"><option value="30">Last 30 days</option><option value="7">Last 7 days</option></Select>
          </div>
          <div>
            <div className="text-xs font-medium text-ink-soft mb-1.5">Format</div>
            <Select defaultValue="csv"><option value="csv">CSV</option><option value="pdf">PDF (soon)</option></Select>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-muted">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted">No data for this period yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-border">
                <th className="font-medium py-2.5">Department</th>
                <th className="font-medium py-2.5 text-right">Headcount</th>
                <th className="font-medium py-2.5 text-right">Hours</th>
                <th className="font-medium py-2.5 text-right">Attendance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.department} className="border-b border-border last:border-0">
                  <td className="py-2.5 font-medium">{r.department}</td>
                  <td className="py-2.5 text-right tnum">{r.headcount}</td>
                  <td className="py-2.5 text-right tnum">{r.hours}h</td>
                  <td className="py-2.5 text-right tnum">{r.attendanceRate}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
