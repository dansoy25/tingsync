import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { fetchTasks, createTask, updateTask, deleteTask, fetchProfilesLite } from '../../lib/api'
import { useAdmin } from '../AdminShell'
import { Card, Pill, Avatar, Button, Input, Select } from '../ui'
import Modal, { Field } from '../Modal'
import { shortDate } from '../../lib/format'

const FILTERS = ['all', 'todo', 'in_progress', 'done']
const FILTER_LABEL = { all: 'All', todo: 'To do', in_progress: 'In progress', done: 'Done' }

export default function Tasks() {
  const { profile, flash } = useAdmin()
  const [tasks, setTasks] = useState([])
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [showNew, setShowNew] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([fetchTasks(), fetchProfilesLite()])
      .then(([t, p]) => {
        setTasks(t)
        setProfiles(p)
      })
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter)
  const openCount = tasks.filter((t) => t.status !== 'done').length
  const doneThisWeek = tasks.filter((t) => t.status === 'done').length

  async function onCreate(payload) {
    await createTask(profile.org_id, payload, profile.id)
    flash('Task created')
    setShowNew(false)
    load()
  }

  async function onStatusChange(task, status) {
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, status } : t)))
    try {
      await updateTask(task.id, { status })
      flash('Task updated')
    } catch (e) {
      flash(e.message)
      load()
    }
  }

  async function onDelete(task) {
    if (!confirm(`Delete "${task.title}"?`)) return
    await deleteTask(task.id)
    flash('Task deleted')
    load()
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-bold">Tasks</h1>
          <div className="text-sm text-muted mt-1">{openCount} open • {doneThisWeek} completed</div>
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}>
          <Plus size={15} /> New task
        </Button>
      </div>

      <div className="flex items-center gap-1 my-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              'px-3 py-1.5 rounded-md text-[13px] font-medium transition ' +
              (filter === f ? 'bg-brand text-white' : 'text-ink-soft hover:bg-bg-tint')
            }
          >
            {FILTER_LABEL[f]}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <div className="p-8 text-center text-sm text-muted">Loading tasks…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted">No tasks here yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-border">
                <th className="font-medium py-2.5 px-4">Title</th>
                <th className="font-medium py-2.5 px-4">Assignee</th>
                <th className="font-medium py-2.5 px-4">Due</th>
                <th className="font-medium py-2.5 px-4">Priority</th>
                <th className="font-medium py-2.5 px-4">Status</th>
                <th className="font-medium py-2.5 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0 hover:bg-bg-soft">
                  <td className="py-3 px-4">
                    <div className="font-medium">{t.title}</div>
                    {t.description && <div className="text-xs text-faint truncate max-w-xs">{t.description}</div>}
                  </td>
                  <td className="py-3 px-4">
                    {t.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={t.assignee.full_name} src={t.assignee.avatar_url} size={22} />
                        <span className="text-xs">{t.assignee.full_name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-faint">Unassigned</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-xs">{t.due_date ? shortDate(t.due_date) : '—'}</td>
                  <td className="py-3 px-4">
                    <Pill kind={t.priority === 'low' ? 'low_priority' : t.priority} />
                  </td>
                  <td className="py-3 px-4">
                    <select
                      value={t.status}
                      onChange={(e) => onStatusChange(t, e.target.value)}
                      className="text-[11px] font-medium border border-border rounded-full px-2 py-1 bg-white outline-none"
                    >
                      <option value="todo">To do</option>
                      <option value="in_progress">In progress</option>
                      <option value="done">Done</option>
                    </select>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => onDelete(t)} className="text-faint hover:text-red">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showNew && <NewTaskModal profiles={profiles} onClose={() => setShowNew(false)} onCreate={onCreate} />}
    </div>
  )
}

function NewTaskModal({ profiles, onClose, onCreate }) {
  const [form, setForm] = useState({ title: '', description: '', assignee_id: '', priority: 'medium', due_date: '' })
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
      setBusy(false)
    }
  }

  return (
    <Modal
      title="New task"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={busy || !form.title}>
            {busy ? 'Creating…' : 'Create task'}
          </Button>
        </div>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        {error && <div className="text-xs text-red bg-red-tint border border-red/20 rounded-md px-3 py-2">{error}</div>}
        <Field label="Title">
          <Input required value={form.title} onChange={set('title')} placeholder="Restock fridge unit B" />
        </Field>
        <Field label="Description">
          <Input value={form.description} onChange={set('description')} placeholder="Optional details" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Assignee">
            <Select value={form.assignee_id} onChange={set('assignee_id')}>
              <option value="">Unassigned</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>{p.full_name}</option>
              ))}
            </Select>
          </Field>
          <Field label="Due date">
            <Input type="date" value={form.due_date} onChange={set('due_date')} />
          </Field>
        </div>
        <Field label="Priority">
          <Select value={form.priority} onChange={set('priority')}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </Field>
      </form>
    </Modal>
  )
}
