import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { fetchSites, createSite } from '../../lib/api'
import { useAdmin } from '../AdminShell'
import { Card, Button, Input } from '../ui'
import Modal, { Field } from '../Modal'
import SiteQRPoster from '../SiteQRPoster'

export default function QRGenerate() {
  const { profile, flash } = useAdmin()
  const [sites, setSites] = useState([])
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)

  const load = () => {
    setLoading(true)
    fetchSites().then((s) => {
      setSites(s)
      setSelected((cur) => cur || s[0] || null)
    }).finally(() => setLoading(false))
  }
  useEffect(load, [])

  async function onCreate(payload) {
    const site = await createSite(profile.org_id, payload)
    flash('Site created')
    setShowNew(false)
    setSites((s) => [...s, site])
    setSelected(site)
  }

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-1">
        <div>
          <h1 className="text-xl font-bold">Generate QR codes</h1>
          <div className="text-sm text-muted mt-1">Print a gate poster so employees can clock in by scanning</div>
        </div>
        <Button variant="primary" onClick={() => setShowNew(true)}><Plus size={15} /> New site</Button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-muted">Loading…</div>
      ) : sites.length === 0 ? (
        <Card className="p-10 text-center text-sm text-muted mt-4">No sites yet — add one to generate its QR.</Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-4 mt-4">
          <Card className="p-2 h-fit">
            {sites.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className={
                  'w-full text-left px-3 py-2.5 rounded-md text-[13px] font-medium mb-0.5 ' +
                  (selected?.id === s.id ? 'bg-brand-tint text-brand' : 'text-ink-soft hover:bg-bg-soft')
                }
              >
                {s.name}
              </button>
            ))}
          </Card>
          <div className="print:col-span-2">
            <SiteQRPoster site={selected} />
          </div>
        </div>
      )}

      {showNew && <NewSiteModal onClose={() => setShowNew(false)} onCreate={onCreate} />}
    </div>
  )
}

function NewSiteModal({ onClose, onCreate }) {
  const [form, setForm] = useState({ name: '', address: '', radius_m: 120 })
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
      title="New site"
      onClose={onClose}
      footer={
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={busy || !form.name}>{busy ? 'Creating…' : 'Create site'}</Button>
        </div>
      }
    >
      <form onSubmit={submit} className="flex flex-col gap-3.5">
        {error && <div className="text-xs text-red bg-red-tint border border-red/20 rounded-md px-3 py-2">{error}</div>}
        <Field label="Site name"><Input required value={form.name} onChange={set('name')} /></Field>
        <Field label="Address"><Input value={form.address} onChange={set('address')} /></Field>
        <Field label="Geofence radius (m)"><Input type="number" value={form.radius_m} onChange={set('radius_m')} /></Field>
      </form>
    </Modal>
  )
}
