import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { fetchEmployees, createEmployee } from '../../lib/api'
import { useAdmin } from '../AdminShell'
import { Card, Pill, Avatar, Button, Input } from '../ui'
import Modal, { Field } from '../Modal'

export default function Employees() {
  const { flash } = useAdmin()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [created, setCreated] = useState(null)

  const load = () => {
    setLoading(true)
    fetchEmployees().then(setRows).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const active = rows.filter((r) => r.status === 'active').length
  const onLeave = rows.filter((r) => r.today === 'on_leave').length

  async function onCreate(payload) {
    const result = await createEmployee(payload)
    setCreated(result)
    flash('Employee added')
    load()
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-bold">Employees</h1>
          <div className="text-sm text-muted mt-1">{active} active • {onLeave} on leave</div>
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}>
          <Plus size={15} /> Add employee
        </Button>
      </div>

      <Card className="mt-4">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-border">
                <th className="font-medium py-2.5 px-4">Employee</th>
                <th className="font-medium py-2.5 px-4">Position</th>
                <th className="font-medium py-2.5 px-4">Department</th>
                <th className="font-medium py-2.5 px-4">Status</th>
                <th className="font-medium py-2.5 px-4">Contact</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-bg-soft">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.full_name} src={r.avatar_url} size={28} />
                      <div>
                        <div className="font-medium text-xs">{r.full_name}</div>
                        <div className="text-[11px] text-faint">{r.employee_code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-xs">{r.position || '—'}</td>
                  <td className="py-3 px-4 text-xs">{r.site?.name || '—'}</td>
                  <td className="py-3 px-4"><Pill kind={r.status} /></td>
                  <td className="py-3 px-4 text-xs">{r.phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showNew && (
        <NewEmployeeModal
          onClose={() => { setShowNew(false); setCreated(null) }}
          onCreate={onCreate}
          created={created}
        />
      )}
    </div>
  )
}

function NewEmployeeModal({ onClose, onCreate, created }) {
  const [form, setForm] = useState({ full_name: '', email: '', position: '', phone: '', daily_rate: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  async function submit(e) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await onCreate(form)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  if (created) {
    return (
      <Modal title="Employee added" onClose={onClose} footer={<Button variant="primary" onClick={onClose} className="w-full justify-center">Done</Button>}>
        <div className="text-sm mb-3">Share these sign-in details — the employee cannot reset the PIN themselves.</div>
        <div className="bg-bg-tint rounded-lg p-4 flex flex-col gap-2 text-sm">
          <div><span className="text-faint">Email:</span> <span className="font-mono">{created.email}</span></div>
          <div><span className="text-faint">PIN:</span> <span className="font-mono font-bold">{created.pin}</span></div>
          <div><span className="text-faint">Employee code:</span> <span className="font-mono">{created.employee_code}</span></div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      title="Add employee"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={busy || !form.full_name || !form.email}>
            {busy ? 'Adding…' : 'Add employee'}
          </Button>
        </div>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        {error && <div className="text-xs text-red bg-red-tint border border-red/20 rounded-md px-3 py-2">{error}</div>}
        <Field label="Full name"><Input required value={form.full_name} onChange={set('full_name')} /></Field>
        <Field label="Email"><Input type="email" required value={form.email} onChange={set('email')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Position"><Input value={form.position} onChange={set('position')} /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={set('phone')} /></Field>
        </div>
        <Field label="Daily rate (₱)"><Input type="number" value={form.daily_rate} onChange={set('daily_rate')} /></Field>
      </form>
    </Modal>
  )
}
