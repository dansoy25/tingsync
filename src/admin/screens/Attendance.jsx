import { useEffect, useState } from 'react'
import { fetchTodayAttendance } from '../../lib/api'
import { Card, Pill, Avatar } from '../ui'
import { timePH, hm } from '../../lib/format'

export default function Attendance() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTodayAttendance().then(setRows).finally(() => setLoading(false))
  }, [])

  const present = rows.filter((r) => r.status === 'present' || r.status === 'ongoing').length

  return (
    <div className="max-w-6xl">
      <div className="mb-4">
        <h1 className="text-xl font-bold">Attendance</h1>
        <div className="text-sm text-muted mt-1">{rows.length} employees • {present} clocked in today</div>
      </div>
      <Card>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted">No attendance recorded today.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-border">
                <th className="font-medium py-2.5 px-4">Employee</th>
                <th className="font-medium py-2.5 px-4">Date</th>
                <th className="font-medium py-2.5 px-4">Time In</th>
                <th className="font-medium py-2.5 px-4">Time Out</th>
                <th className="font-medium py-2.5 px-4">Hours</th>
                <th className="font-medium py-2.5 px-4">Status</th>
                <th className="font-medium py-2.5 px-4">GPS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-bg-soft">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.profile?.full_name} src={r.profile?.avatar_url} size={26} />
                      <div>
                        <div className="font-medium text-xs">{r.profile?.full_name}</div>
                        <div className="text-[11px] text-faint">{r.profile?.position}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs">{r.work_date}</td>
                  <td className="py-3 px-4 text-xs">{timePH(r.clock_in)}</td>
                  <td className="py-3 px-4 text-xs">{timePH(r.clock_out)}</td>
                  <td className="py-3 px-4 text-xs tnum">{hm(r.hours)}</td>
                  <td className="py-3 px-4"><Pill kind={r.status} /></td>
                  <td className="py-3 px-4 text-xs">{r.lat ? `${r.lat.toFixed(4)}, ${r.lng.toFixed(4)}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
