import { useEffect, useState } from 'react'
import { HardDrive } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useAdmin } from '../AdminShell'
import { Card, Pill, Button } from '../ui'

const STORAGE_KEY = 'tingsync_backup_log'
const TABLES = ['profiles', 'attendance', 'tasks', 'leave_requests', 'payslips', 'expenses', 'inventory_items', 'projects']

function loadLog() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}
function saveLog(log) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(log.slice(0, 20)))
}

export default function Backup() {
  const { flash } = useAdmin()
  const [log, setLog] = useState([])
  const [busy, setBusy] = useState(false)

  useEffect(() => setLog(loadLog()), [])

  async function runBackup() {
    setBusy(true)
    try {
      const snapshot = {}
      for (const t of TABLES) {
        const { data, error } = await supabase.from(t).select('*')
        if (error) throw error
        snapshot[t] = data
      }
      const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const stamp = new Date().toISOString()
      a.href = url
      a.download = `tingsync-backup-${stamp.slice(0, 19).replace(/[:T]/g, '-')}.json`
      a.click()
      URL.revokeObjectURL(url)

      const size = new Blob([JSON.stringify(snapshot)]).size
      const entry = { date: stamp, size, type: 'Manual', status: 'complete' }
      const next = [entry, ...log]
      setLog(next)
      saveLog(next)
      flash('Backup downloaded')
    } catch (e) {
      flash(e.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-bold">Backup</h1>
          <div className="text-sm text-muted mt-1">Export a full snapshot of your workspace data</div>
        </div>
        <Button variant="primary" onClick={runBackup} disabled={busy}>
          <HardDrive size={14} /> {busy ? 'Backing up…' : 'Run backup now'}
        </Button>
      </div>

      <Card className="mt-4">
        {log.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted">No backups yet — run one above.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-border">
                <th className="font-medium py-2.5 px-4">Date</th>
                <th className="font-medium py-2.5 px-4">Time</th>
                <th className="font-medium py-2.5 px-4 text-right">Size</th>
                <th className="font-medium py-2.5 px-4">Type</th>
                <th className="font-medium py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {log.map((b) => (
                <tr key={b.date} className="border-b border-border last:border-0">
                  <td className="py-2.5 px-4 text-xs">{new Date(b.date).toLocaleDateString()}</td>
                  <td className="py-2.5 px-4 text-xs">{new Date(b.date).toLocaleTimeString()}</td>
                  <td className="py-2.5 px-4 text-xs text-right tnum">{(b.size / 1024).toFixed(1)} KB</td>
                  <td className="py-2.5 px-4 text-xs">{b.type}</td>
                  <td className="py-2.5 px-4"><Pill kind="approved">{b.status}</Pill></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
