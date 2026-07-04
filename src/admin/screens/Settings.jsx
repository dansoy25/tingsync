import { useEffect, useState } from 'react'
import { fetchOrganization, updateCompanyCode, fetchOrgSettings, updateOrgSettings, fetchRoles, fetchLeaveTypes } from '../../lib/api'
import { useAdmin } from '../AdminShell'
import { Card, Button, Input } from '../ui'

const TABS = ['Company', 'Payroll', 'Roles', 'Leave types']

export default function Settings() {
  const [tab, setTab] = useState('Company')
  return (
    <div className="max-w-4xl">
      <div className="mb-4">
        <h1 className="text-xl font-bold">Settings</h1>
        <div className="text-sm text-muted mt-1">Configure your workspace</div>
      </div>
      <div className="flex items-center gap-1 mb-4 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={
              'px-3 py-2 text-[13px] font-medium border-b-2 -mb-px transition ' +
              (tab === t ? 'border-brand text-brand' : 'border-transparent text-ink-soft hover:text-ink')
            }
          >
            {t}
          </button>
        ))}
      </div>
      {tab === 'Company' && <CompanyTab />}
      {tab === 'Payroll' && <PayrollTab />}
      {tab === 'Roles' && <RolesTab />}
      {tab === 'Leave types' && <LeaveTypesTab />}
    </div>
  )
}

function CompanyTab() {
  const { flash } = useAdmin()
  const [org, setOrg] = useState(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    fetchOrganization().then((o) => { setOrg(o); setCode(o?.code || '') })
  }, [])

  async function save() {
    setBusy(true)
    try {
      const updated = await updateCompanyCode(org.id, code)
      setOrg((o) => ({ ...o, ...updated }))
      flash('Company code updated')
    } catch (e) {
      flash(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!org) return <div className="text-sm text-muted p-8 text-center">Loading…</div>

  return (
    <Card className="p-5 max-w-lg">
      <div className="text-sm font-semibold mb-4">Company info</div>
      <div className="flex flex-col gap-3.5">
        <div>
          <div className="text-xs font-medium text-ink-soft mb-1.5">Company name</div>
          <Input value={org.name} readOnly className="bg-bg-soft" />
        </div>
        <div>
          <div className="text-xs font-medium text-ink-soft mb-1.5">Company code</div>
          <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          <div className="text-[11px] text-faint mt-1">Employees use this code to sign in on the mobile app.</div>
        </div>
        <Button variant="primary" onClick={save} disabled={busy} className="self-start">
          {busy ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </Card>
  )
}

function PayrollTab() {
  const { flash } = useAdmin()
  const [org, setOrg] = useState(null)
  const [settings, setSettings] = useState(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    Promise.all([fetchOrganization(), fetchOrgSettings()]).then(([o, s]) => { setOrg(o); setSettings(s) })
  }, [])

  async function save() {
    setBusy(true)
    try {
      await updateOrgSettings(org.id, settings)
      flash('Payroll settings saved')
    } catch (e) {
      flash(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (!settings) return <div className="text-sm text-muted p-8 text-center">Loading…</div>

  const set = (k) => (e) => setSettings((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

  return (
    <Card className="p-5 max-w-lg">
      <div className="text-sm font-semibold mb-4">Deduction rates</div>
      <div className="flex flex-col gap-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs font-medium text-ink-soft mb-1.5">Base daily rate (₱)</div>
            <Input type="number" value={settings.base_rate} onChange={set('base_rate')} />
          </div>
          <div>
            <div className="text-xs font-medium text-ink-soft mb-1.5">OT multiplier</div>
            <Input type="number" step="0.01" value={settings.ot_multiplier} onChange={set('ot_multiplier')} />
          </div>
        </div>
        <div>
          <div className="text-xs font-medium text-ink-soft mb-1.5">Meal allowance (₱/day)</div>
          <Input type="number" value={settings.meal_allowance} onChange={set('meal_allowance')} />
        </div>
        <div className="flex flex-col gap-2 mt-1">
          {['sss', 'philhealth', 'pagibig', 'withholding'].map((k) => (
            <label key={k} className="flex items-center gap-2 text-sm capitalize">
              <input type="checkbox" checked={!!settings[k]} onChange={set(k)} className="accent-brand w-3.5 h-3.5" />
              {k === 'sss' ? 'SSS' : k === 'philhealth' ? 'PhilHealth' : k === 'pagibig' ? 'Pag-IBIG' : 'Withholding tax'}
            </label>
          ))}
        </div>
        <Button variant="primary" onClick={save} disabled={busy} className="self-start">
          {busy ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </Card>
  )
}

function RolesTab() {
  const [roles, setRoles] = useState(null)
  useEffect(() => { fetchRoles().then(setRoles) }, [])
  if (!roles) return <div className="text-sm text-muted p-8 text-center">Loading…</div>
  return (
    <Card>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted border-b border-border">
            <th className="font-medium py-2.5 px-4">Role</th>
            <th className="font-medium py-2.5 px-4">Permissions</th>
            <th className="font-medium py-2.5 px-4 text-right">Members</th>
          </tr>
        </thead>
        <tbody>
          {roles.map((r) => (
            <tr key={r.id} className="border-b border-border last:border-0">
              <td className="py-3 px-4 font-medium">{r.name}</td>
              <td className="py-3 px-4 text-xs text-muted">{r.permissions}</td>
              <td className="py-3 px-4 text-right tnum">{r.member_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}

function LeaveTypesTab() {
  const [types, setTypes] = useState(null)
  useEffect(() => { fetchLeaveTypes().then(setTypes) }, [])
  if (!types) return <div className="text-sm text-muted p-8 text-center">Loading…</div>
  return (
    <Card>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-muted border-b border-border">
            <th className="font-medium py-2.5 px-4">Leave type</th>
            <th className="font-medium py-2.5 px-4">Code</th>
          </tr>
        </thead>
        <tbody>
          {types.map((t) => (
            <tr key={t.id} className="border-b border-border last:border-0">
              <td className="py-3 px-4 font-medium">{t.icon} {t.name}</td>
              <td className="py-3 px-4 text-xs text-muted">{t.code}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  )
}
