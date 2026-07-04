import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { fetchInventory, createInventoryItem } from '../../lib/api'
import { useAdmin } from '../AdminShell'
import { Card, Pill, Button, Input } from '../ui'
import Modal, { Field } from '../Modal'

export default function Inventory() {
  const { profile, flash } = useAdmin()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)

  const load = () => {
    setLoading(true)
    fetchInventory().then(setRows).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function onCreate(payload) {
    await createInventoryItem(profile.org_id, payload)
    flash('Item added')
    setShowNew(false)
    load()
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-bold">Inventory</h1>
          <div className="text-sm text-muted mt-1">{rows.length} items tracked</div>
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}><Plus size={15} /> Add item</Button>
      </div>

      <Card className="mt-4">
        {loading ? (
          <div className="p-8 text-center text-sm text-muted">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-center text-sm text-muted">No inventory items yet.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-muted border-b border-border">
                <th className="font-medium py-2.5 px-4">Item</th>
                <th className="font-medium py-2.5 px-4">SKU</th>
                <th className="font-medium py-2.5 px-4 text-right">In Stock</th>
                <th className="font-medium py-2.5 px-4 text-right">Reorder Level</th>
                <th className="font-medium py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-bg-soft">
                  <td className="py-3 px-4 text-xs font-medium">{r.icon} {r.name}</td>
                  <td className="py-3 px-4 text-xs">{r.sku || '—'}</td>
                  <td className="py-3 px-4 text-xs text-right tnum">{r.stock} {r.unit}</td>
                  <td className="py-3 px-4 text-xs text-right tnum">{r.reorder_level}</td>
                  <td className="py-3 px-4"><Pill kind={r.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {showNew && <NewItemModal onClose={() => setShowNew(false)} onCreate={onCreate} />}
    </div>
  )
}

function NewItemModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', sku: '', stock: '', unit: 'pcs', reorder_level: '' })
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
      title="Add inventory item"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={busy || !form.name}>{busy ? 'Adding…' : 'Add item'}</Button>
        </div>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        {error && <div className="text-xs text-red bg-red-tint border border-red/20 rounded-md px-3 py-2">{error}</div>}
        <Field label="Item name"><Input required value={form.name} onChange={set('name')} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="SKU"><Input value={form.sku} onChange={set('sku')} /></Field>
          <Field label="Unit"><Input value={form.unit} onChange={set('unit')} /></Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Stock"><Input type="number" value={form.stock} onChange={set('stock')} /></Field>
          <Field label="Reorder level"><Input type="number" value={form.reorder_level} onChange={set('reorder_level')} /></Field>
        </div>
      </form>
    </Modal>
  )
}
