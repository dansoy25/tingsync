import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { fetchExpenses, createExpense } from '../../lib/api'
import { useAdmin } from '../AdminShell'
import { Card, Button, Input, Select } from '../ui'
import Modal, { Field } from '../Modal'
import { money, shortDate } from '../../lib/format'

const CATEGORIES = ['materials', 'transport', 'meals', 'utilities', 'tools', 'other']

export default function Expenses() {
  const { profile, flash } = useAdmin()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)

  const load = () => {
    setLoading(true)
    fetchExpenses().then(setRows).finally(() => setLoading(false))
  }
  useEffect(load, [])

  const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0)

  async function onCreate(payload) {
    await createExpense(profile.org_id, payload, profile.id)
    flash('Expense recorded')
    setShowNew(false)
    load()
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-bold">Expenses</h1>
          <div className="text-sm text-muted mt-1">{rows.length} entries • {money(total)} total</div>
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}><Plus size={15} /> Add expense</Button>
      </div>

      <Card className="mt-4">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted">No expenses recorded.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-border">
                <th className="font-medium py-2.5 px-4">Date</th>
                <th className="font-medium py-2.5 px-4">Category</th>
                <th className="font-medium py-2.5 px-4">Description</th>
                <th className="font-medium py-2.5 px-4 text-right">Amount</th>
                <th className="font-medium py-2.5 px-4">Submitted by</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-bg-soft">
                  <td className="py-3 px-4 text-xs">{shortDate(r.spent_on)}</td>
                  <td className="py-3 px-4 text-xs capitalize">{r.category}</td>
                  <td className="py-3 px-4 text-xs">{r.description || r.vendor || '—'}</td>
                  <td className="py-3 px-4 text-xs text-right tnum font-medium">{money(r.amount)}</td>
                  <td className="py-3 px-4 text-xs">{r.creator?.full_name || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showNew && <NewExpenseModal onClose={() => setShowNew(false)} onCreate={onCreate} />}
    </div>
  )
}

function NewExpenseModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ category: 'materials', vendor: '', amount: '', spent_on: new Date().toISOString().slice(0, 10), description: '' })
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

  return (
    <Modal
      title="Add expense"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={busy || !form.amount}>{busy ? 'Saving…' : 'Add expense'}</Button>
        </div>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        {error && <div className="text-xs text-red bg-red-tint border border-red/20 rounded-md px-3 py-2">{error}</div>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Category">
            <Select value={form.category} onChange={set('category')}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Amount (₱)"><Input type="number" required value={form.amount} onChange={set('amount')} /></Field>
        </div>
        <Field label="Vendor"><Input value={form.vendor} onChange={set('vendor')} /></Field>
        <Field label="Date"><Input type="date" value={form.spent_on} onChange={set('spent_on')} /></Field>
        <Field label="Description"><Input value={form.description} onChange={set('description')} /></Field>
      </form>
    </Modal>
  )
}
