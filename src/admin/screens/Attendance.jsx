import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, RefreshCw, Clock, Camera, ScanFace, MapPin } from 'lucide-react'
import { fetchAttendanceByDate, manilaToday, shiftDays } from '../../lib/api'
import { Card, Pill, Avatar, Button, EmptyState } from '../ui'
import { timePH, hm, longDate } from '../../lib/format'

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'present', label: 'Present' },
  { key: 'late', label: 'Late' },
  { key: 'ongoing', label: 'On shift' },
]

export default function Attendance() {
  const [date, setDate] = useState(manilaToday())
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selfie, setSelfie] = useState(null)

  const load = () => {
    setLoading(true)
    fetchAttendanceByDate(date)
      .then(setRows)
      .finally(() => setLoading(false))
  }

  useEffect(load, [date])

  const filtered = useMemo(
    () => (filter === 'all' ? rows : rows.filter((r) => r.status === filter)),
    [rows, filter]
  )
  const present = rows.filter((r) => r.status === 'present' || r.status === 'ongoing').length
  const late = rows.filter((r) => r.status === 'late').length
  const isToday = date === manilaToday()

  return (
    <div className="max-w-6xl">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold">Attendance</h1>
          <div className="text-sm text-muted mt-1">
            {rows.length} record{rows.length === 1 ? '' : 's'} • {present} in{late > 0 ? ` • ${late} late` : ''}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={() => setDate(shiftDays(date, -1))}>
            <ChevronLeft className="w-3.5 h-3.5" />
          </Button>
          <div className="text-[13px] font-semibold px-1 min-w-[190px] text-center">{longDate(date)}</div>
          <Button size="sm" disabled={isToday} onClick={() => setDate(shiftDays(date, 1))}>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
          {!isToday && (
            <Button size="sm" onClick={() => setDate(manilaToday())}>Today</Button>
          )}
          <Button size="sm" onClick={load} title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      <div className="flex gap-1.5 mb-3">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
              filter === f.key
                ? 'bg-brand text-white border-brand'
                : 'bg-white text-ink-soft border-border hover:bg-bg-soft'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted">Loading…</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Clock}
            title={rows.length === 0 ? 'No attendance recorded' : 'No records match this filter'}
            sub={rows.length === 0 ? `Nothing logged on ${longDate(date)}.` : 'Try a different status filter.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-muted border-b border-border">
                  <th className="font-medium py-2.5 px-4">Employee</th>
                  <th className="font-medium py-2.5 px-4">Proof</th>
                  <th className="font-medium py-2.5 px-4">Time In</th>
                  <th className="font-medium py-2.5 px-4">Time Out</th>
                  <th className="font-medium py-2.5 px-4">Hours</th>
                  <th className="font-medium py-2.5 px-4">Site</th>
                  <th className="font-medium py-2.5 px-4">Method</th>
                  <th className="font-medium py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
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
                    <td className="py-3 px-4">
                      {r.selfie_url ? (
                        <button
                          onClick={() => setSelfie(r)}
                          className="block w-8 h-8 rounded-md overflow-hidden border border-border hover:ring-2 hover:ring-brand/40"
                          title="View time-in selfie"
                        >
                          <img src={r.selfie_url} alt="" className="w-full h-full object-cover" loading="lazy" />
                        </button>
                      ) : (
                        <span className="text-xs text-faint">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs tnum">{timePH(r.clock_in)}</td>
                    <td className="py-3 px-4 text-xs tnum">{timePH(r.clock_out)}</td>
                    <td className="py-3 px-4 text-xs tnum">{r.clock_out ? hm(r.hours) : '—'}</td>
                    <td className="py-3 px-4 text-xs">{r.site?.name || '—'}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 text-[11px] text-ink-soft">
                        {r.method === 'face+gps' ? (
                          <><ScanFace className="w-3.5 h-3.5 text-brand" /> Selfie + GPS</>
                        ) : r.method === 'gps' ? (
                          <><MapPin className="w-3.5 h-3.5 text-brand" /> GPS</>
                        ) : (
                          r.method || 'Manual'
                        )}
                      </span>
                    </td>
                    <td className="py-3 px-4"><Pill kind={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selfie && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-8"
          onClick={() => setSelfie(null)}
        >
          <div className="bg-white rounded-xl overflow-hidden max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <img src={selfie.selfie_url} alt="Time-in selfie" className="w-full aspect-square object-cover" />
            <div className="p-4">
              <div className="font-semibold text-sm">{selfie.profile?.full_name}</div>
              <div className="text-xs text-muted mt-1 flex items-center gap-3">
                <span className="inline-flex items-center gap-1"><Camera className="w-3.5 h-3.5" /> {timePH(selfie.clock_in)}</span>
                {selfie.lat != null && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {selfie.lat.toFixed(4)}, {selfie.lng.toFixed(4)}
                  </span>
                )}
              </div>
              <Button className="mt-3 w-full justify-center" onClick={() => setSelfie(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
