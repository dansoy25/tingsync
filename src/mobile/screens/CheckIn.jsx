import { useEffect, useState, useCallback } from 'react'
import {
  ChevronLeft, Check, MapPin, Clock as ClockIcon, Calendar,
  RefreshCw, AlertTriangle,
} from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { useMobile } from '../MobileShell'
import { timePH, longDate, initials } from '../../lib/format'
import {
  getPosition, haversineM, fetchMySite, clockIn, clockOut, manilaToday,
} from '../../lib/mobileApi'

async function ensureNativePermissions() {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { Geolocation } = await import('@capacitor/geolocation')
    await Geolocation.requestPermissions()
  } catch (_) {}
}

function StepBar({ step, total = 3 }) {
  return (
    <div className="flex gap-1.5 mb-5">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`flex-1 h-1 rounded-full ${i < step ? 'bg-brand' : 'bg-border'}`} />
      ))}
    </div>
  )
}

// ---- Step 1: Location ----
function LocationStep({ site, onReady, position, setPosition, geo, setGeo }) {
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)

  const locate = useCallback(async () => {
    setChecking(true)
    setError('')
    try {
      await ensureNativePermissions()
      const pos = await getPosition()
      setPosition(pos)
      if (site && (site.lat || site.lng)) {
        const dist = haversineM(pos.lat, pos.lng, site.lat, site.lng)
        const inside = dist <= (site.radius_m || 120) + Math.min(pos.accuracy || 0, 30)
        setGeo({ dist, inside, hasFence: true })
      } else {
        setGeo({ dist: 0, inside: true, hasFence: false })
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setChecking(false)
    }
  }, [site, setPosition, setGeo])

  useEffect(() => { locate() }, [locate])

  const ok = position && geo?.inside

  return (
    <>
      <div className="text-xl font-bold text-[#030303]">Confirm your location</div>
      <div className="text-[13px] text-[#29292A] mt-1.5 mb-5">
        {geo?.hasFence === false
          ? 'Your GPS position will be recorded with your time entry.'
          : 'You must be inside the site boundary to clock in.'}
      </div>

      {/* Map placeholder with geofence */}
      <div
        className="relative aspect-square rounded-2xl overflow-hidden mb-4 shadow-[0_7px_12px_rgba(10,10,10,.62)] border border-border"
        style={{ background: 'linear-gradient(135deg,#e0f2fe,#dbeafe,#ede9fe)' }}
      >
        <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(rgba(15,23,42,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(15,23,42,.06) 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
        {checking ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-brand animate-spin" />
            <div className="text-xs text-muted">Locating…</div>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center">
            <AlertTriangle className="w-6 h-6 text-amber" />
            <div className="text-xs text-ink-soft">{error}</div>
          </div>
        ) : (
          <>
            <div
              className="absolute top-1/2 left-1/2 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{ width: 200, height: 200, border: '2px solid var(--color-brand)', background: 'rgba(37,99,235,.10)' }}
            />
            <div
              className="absolute top-1/2 left-1/2 rounded-full -translate-x-1/2 -translate-y-1/2"
              style={{ width: 14, height: 14, background: ok ? '#10b981' : '#ef4444', boxShadow: `0 0 0 5px ${ok ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)'}` }}
            />
            {site && (
              <div className="absolute top-[38%] left-1/2 -translate-x-1/2 bg-[#0f172a] text-white text-[11px] px-2 py-1 rounded-md font-medium whitespace-nowrap">
                {site.name}
              </div>
            )}
          </>
        )}
      </div>

      {/* Status card */}
      {!checking && !error && position && (
        <div className="flex items-center gap-2.5 rounded-xl p-3 bg-white border border-dashed border-[#2A68E4] shadow-[0_4px_12px_rgba(0,0,0,.5)]">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${ok ? 'bg-green-tint text-green' : 'bg-red-tint text-red'}`}>
            {ok ? <Check className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold">
              {!geo.hasFence ? 'Location captured' : ok ? `You're inside ${site.name}` : `You're outside ${site.name}`}
            </div>
            <div className="text-[11px] text-muted mt-0.5">
              Accuracy ±{Math.round(position.accuracy || 0)}m{geo.hasFence && ` • ${geo.dist} m from center`}
            </div>
          </div>
        </div>
      )}

      {error ? (
        <button onClick={locate} className="mt-5 w-full h-12 rounded-[10px] font-semibold text-sm bg-white border border-border flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      ) : (
        <button
          disabled={checking || !ok}
          onClick={onReady}
          className="mt-5 mx-auto block w-[224px] h-[46px] rounded-[10px] font-semibold text-sm text-white disabled:opacity-40 shadow-[0_5px_12px_rgba(0,0,0,.62)]"
          style={{ background: 'linear-gradient(180deg, #0039B5, #031143, #063399)' }}
        >
          Continue
        </button>
      )}
      {!checking && !error && position && geo?.hasFence && !geo.inside && (
        <button onClick={locate} className="mt-2 w-full py-2.5 text-[13px] text-muted flex items-center justify-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh location
        </button>
      )}
    </>
  )
}

// ---- Step 2: Confirm ----
function ConfirmStep({ mode, profile, site, position, hoursLabel, onConfirm, onCancel, saving, error }) {
  return (
    <>
      <div className="text-xl font-bold mb-5 text-[#171717]">
        {mode === 'in' ? 'Confirm clock-in' : 'Confirm clock-out'}
      </div>

      <div className="rounded-2xl overflow-hidden mb-4 shadow-[0_4px_12px_rgba(0,0,0,.62)]">
        <div className="flex items-center gap-3 p-4" style={{ background: 'linear-gradient(180deg, #003978F4, #0058F9, #003876)' }}>
          <div className="w-12 h-12 rounded-full bg-[#2563eb] text-white flex items-center justify-center font-bold text-base shadow-[0_7px_12px_rgba(0,0,0,.62)]">
            {initials(profile.full_name) || '?'}
          </div>
          <div>
            <div className="font-semibold text-white">{profile.full_name}</div>
            <div className="text-xs text-white/85">
              {profile.position || 'Employee'}{profile.employee_code ? ` • ${profile.employee_code}` : ''}
            </div>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-2.5 bg-[#BFE2DA]">
          <Row icon={ClockIcon} label="Time" value={timePH(new Date().toISOString())} mono />
          <Row icon={Calendar} label="Date" value={longDate(manilaToday())} />
          <Row icon={MapPin} label="Location" value={site?.name || (position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : '—')} />
          {mode === 'out' && <Row icon={ClockIcon} label="Hours worked" value={hoursLabel} mono />}
        </div>
      </div>

      {error && <div className="mb-3 text-xs text-red bg-red-tint border border-red/30 rounded-lg p-3">{error}</div>}

      <button
        disabled={saving}
        onClick={onConfirm}
        className="w-full h-[52px] rounded-[10px] font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_6px_12px_rgba(0,0,0,.62)]"
        style={{ background: 'linear-gradient(180deg, #2563EB, #0239AD, #2563EB)' }}
      >
        {saving ? 'Saving…' : (<><Check className="w-[18px] h-[18px]" /> {mode === 'in' ? 'Confirm clock-in' : 'Confirm clock-out'}</>)}
      </button>
      <button onClick={onCancel} className="w-full text-center text-[13px] text-[#171717] py-2.5 mt-2">Cancel</button>
    </>
  )
}

function Row({ icon: Icon, label, value, mono }) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="w-4 h-4 text-[#262424]" />
      <span className="text-xs text-[#262424] flex-1">{label}</span>
      <span className={'text-[13px] font-semibold text-[#373333]' + (mono ? ' font-mono tnum' : '')}>{value}</span>
    </div>
  )
}

// ---- Step 3: Success ----
function SuccessStep({ mode, row, site, onDone }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#10b981] text-white max-w-[520px] mx-auto">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-[120px] h-[120px] rounded-full bg-white/20 flex items-center justify-center mb-8 shadow-[0_8px_12px_rgba(0,0,0,.62)]">
          <div className="w-[84px] h-[84px] rounded-full bg-white text-[#10b981] flex items-center justify-center shadow-xl">
            <Check className="w-11 h-11" strokeWidth={3} />
          </div>
        </div>
        <div className="text-[28px] font-bold">{mode === 'in' ? 'Clocked in' : 'Clocked out'}</div>
        <div className="text-[15px] mt-1.5 text-white/85">at {timePH(mode === 'in' ? row.clock_in : row.clock_out)}</div>
        <div className="mt-8 w-full bg-white/12 border border-white/15 rounded-2xl p-4 text-left">
          <div className="flex items-center justify-between py-1.5 border-b border-white/15">
            <span className="text-[13px] text-white/85">Site</span>
            <span className="font-semibold text-sm">{site?.name || row.site?.name || '—'}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-white/15">
            <span className="text-[13px] text-white/85">Status</span>
            <span className="font-semibold text-sm capitalize">{row.status === 'ongoing' ? 'On shift' : row.status}</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[13px] text-white/85">Verified by</span>
            <span className="font-semibold text-sm">GPS</span>
          </div>
        </div>
      </div>
      <div className="px-5 pb-8">
        <button
          onClick={onDone}
          className="w-full h-[52px] rounded-xl font-bold text-[#004530] shadow-[2px_4px_12px_rgba(0,0,0,.62)] active:scale-[.98] transition-transform"
          style={{ background: 'linear-gradient(180deg, #FFFFFF, #B6F8BFEC, #FFFFFF)' }}
        >
          Done
        </button>
      </div>
    </div>
  )
}

export default function CheckIn() {
  const { profile, params, navigate, flash, refreshHome } = useMobile()
  const mode = params.mode || 'in'
  const existingRow = params.row || null

  const [step, setStep] = useState(1) // 1 location, 2 confirm, 3 success
  const [site, setSite] = useState(null)
  const [position, setPosition] = useState(null)
  const [geo, setGeo] = useState(null)
  const [savedRow, setSavedRow] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMySite(profile.site_id).then(setSite).catch(() => setSite(null))
  }, [profile.site_id])

  const back = () => {
    if (step <= 1) return navigate('home')
    setStep(step - 1)
  }

  const doConfirm = async () => {
    setSaving(true)
    setError('')
    try {
      if (mode === 'in') {
        const row = await clockIn({ profile, site, lat: position?.lat, lng: position?.lng, selfieUrl: null })
        setSavedRow(row)
      } else {
        const row = await clockOut(existingRow, { lat: position?.lat, lng: position?.lng })
        setSavedRow(row)
      }
      refreshHome()
      setStep(3)
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const hoursLabel = existingRow
    ? (() => {
        const h = (Date.now() - new Date(existingRow.clock_in)) / 3600000
        const hh = Math.floor(h)
        const mm = Math.round((h - hh) * 60)
        return `${hh}:${String(mm).padStart(2, '0')}`
      })()
    : ''

  if (step === 3 && savedRow) {
    return (
      <SuccessStep
        mode={mode}
        row={savedRow}
        site={site}
        onDone={() => { flash(mode === 'in' ? 'Clocked in — have a great shift!' : 'Clocked out. See you tomorrow!'); navigate('home') }}
      />
    )
  }

  return (
    <div className="p-4 pb-8 min-h-full bg-white">
      <button onClick={back} className="flex items-center gap-1.5 text-sm font-semibold mb-4 text-[#030303]">
        <ChevronLeft className="w-[18px] h-[18px]" />
        {mode === 'in' ? 'Check in' : 'Clock out'}
      </button>
      <StepBar step={step} total={3} />

      {step === 1 && (
        <LocationStep
          site={site}
          position={position}
          setPosition={setPosition}
          geo={geo}
          setGeo={setGeo}
          onReady={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <ConfirmStep
          mode={mode}
          profile={profile}
          site={site}
          position={position}
          hoursLabel={hoursLabel}
          onConfirm={doConfirm}
          onCancel={() => navigate('home')}
          saving={saving}
          error={error}
        />
      )}
    </div>
  )
}
