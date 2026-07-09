import { useEffect, useRef, useState, useCallback } from 'react'
import {
  ChevronLeft, Check, MapPin, Clock as ClockIcon, Calendar, ScanFace,
  RefreshCw, Camera as CameraIcon, AlertTriangle,
} from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { useMobile } from '../MobileShell'
import { timePH, longDate } from '../../lib/format'
import {
  getPosition, haversineM, fetchMySite, uploadSelfie, clockIn, clockOut, manilaToday,
} from '../../lib/mobileApi'

async function ensureNativePermissions() {
  if (!Capacitor.isNativePlatform()) return
  try {
    const { Camera } = await import('@capacitor/camera')
    await Camera.requestPermissions({ permissions: ['camera'] })
  } catch (_) {}
  try {
    const { Geolocation } = await import('@capacitor/geolocation')
    await Geolocation.requestPermissions()
  } catch (_) {}
}

function StepBar({ step, total = 4 }) {
  return (
    <div className="flex gap-1.5 mb-5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={`flex-1 h-1 rounded-full ${i < step ? 'bg-brand-light' : 'bg-white/15'}`}
        />
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
      <div className="text-xl font-bold">Confirm your location</div>
      <div className="text-[13px] text-white/50 mt-1.5 mb-5">
        {geo?.hasFence === false
          ? 'Your GPS position will be recorded with your time entry.'
          : 'You must be inside the site boundary to clock in.'}
      </div>

      {/* Radar visual */}
      <div className="relative aspect-square max-h-[320px] mx-auto rounded-2xl overflow-hidden bg-[#0b2436] border border-white/10 flex items-center justify-center mb-4">
        <div className="absolute w-[75%] h-[75%] rounded-full border border-sky-500/25 bg-sky-500/[.06]" />
        <div className="absolute w-[48%] h-[48%] rounded-full border border-sky-500/30 bg-sky-500/[.08]" />
        <div className="absolute w-[22%] h-[22%] rounded-full border border-sky-400/40 bg-sky-500/[.12]" />
        {checking ? (
          <div className="relative z-10 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 text-sky-300 animate-spin" />
            <div className="text-xs text-white/60">Locating…</div>
          </div>
        ) : error ? (
          <div className="relative z-10 flex flex-col items-center gap-2 px-8 text-center">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <div className="text-xs text-white/70">{error}</div>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <div className={`w-4 h-4 rounded-full ${ok ? 'bg-emerald-400' : 'bg-red-400'} shadow-[0_0_0_6px_rgba(255,255,255,.12)]`} />
            {site && <div className="text-[11px] font-medium bg-black/60 px-2.5 py-1 rounded-md">{site.name}</div>}
          </div>
        )}
      </div>

      {/* Status card */}
      {!checking && !error && position && (
        <div className={`flex items-center gap-2.5 rounded-xl p-3 border ${
          ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
            ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
          }`}>
            {ok ? <Check className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-semibold">
              {!geo.hasFence
                ? 'Location captured'
                : ok
                  ? `You're inside ${site.name}`
                  : `You're outside ${site.name}`}
            </div>
            <div className="text-[11px] text-white/50 mt-0.5">
              Accuracy ±{Math.round(position.accuracy || 0)}m
              {geo.hasFence && ` • ${geo.dist} m from center`}
            </div>
          </div>
        </div>
      )}

      {error ? (
        <button onClick={locate} className="mt-5 w-full h-12 rounded-xl font-semibold text-sm bg-white/10 border border-white/15 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4" /> Try again
        </button>
      ) : (
        <button
          disabled={checking || !ok}
          onClick={onReady}
          className="mt-5 w-full h-12 rounded-xl font-semibold text-sm text-white disabled:opacity-40 shadow-[0_6px_16px_rgba(37,99,235,.3)]"
          style={{ background: 'linear-gradient(180deg, #1d4ed8, #172554, #1d4ed8)' }}
        >
          Continue
        </button>
      )}
      {!checking && !error && position && geo?.hasFence && !geo.inside && (
        <button onClick={locate} className="mt-2 w-full py-2.5 text-[13px] text-white/60 flex items-center justify-center gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh location
        </button>
      )}
    </>
  )
}

// ---- Step 2: Selfie ----
function SelfieStep({ onCapture }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        await ensureNativePermissions()
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setReady(true)
        }
      } catch (e) {
        setError(
          e.name === 'NotAllowedError'
            ? 'Camera permission denied. Enable it in your device settings.'
            : 'Could not open the camera on this device.'
        )
      }
    })()
    return () => {
      cancelled = true
      streamRef.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const capture = () => {
    const video = videoRef.current
    if (!video) return
    const size = Math.min(video.videoWidth, video.videoHeight)
    const canvas = document.createElement('canvas')
    canvas.width = 640
    canvas.height = 640
    const cx = (video.videoWidth - size) / 2
    const cy = (video.videoHeight - size) / 2
    const g = canvas.getContext('2d')
    // mirror so the saved photo matches what the user saw
    g.translate(canvas.width, 0)
    g.scale(-1, 1)
    g.drawImage(video, cx, cy, size, size, 0, 0, 640, 640)
    canvas.toBlob(
      (blob) => {
        streamRef.current?.getTracks().forEach((t) => t.stop())
        onCapture(blob, canvas.toDataURL('image/jpeg', 0.8))
      },
      'image/jpeg',
      0.82
    )
  }

  return (
    <>
      <div className="text-xl font-bold">Take a selfie</div>
      <div className="text-[13px] text-white/50 mt-1.5 mb-5">
        Keep your face inside the oval. This photo is attached to your time entry.
      </div>

      <div className="relative mx-auto w-[260px] h-[300px] mb-6">
        <div className="absolute inset-0 rounded-[50%] overflow-hidden border-4 border-brand-light bg-black">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full h-full object-cover scale-x-[-1]"
          />
        </div>
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-white/50">
            Opening camera…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-8 text-center">
            <AlertTriangle className="w-6 h-6 text-amber-400" />
            <div className="text-xs text-white/70">{error}</div>
          </div>
        )}
      </div>

      <button
        disabled={!ready}
        onClick={capture}
        className="w-full h-[52px] rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-40 shadow-[0_6px_16px_rgba(37,99,235,.3)]"
        style={{ background: 'linear-gradient(180deg, #1d4ed8, #172554, #1d4ed8)' }}
      >
        <CameraIcon className="w-4 h-4" /> Capture
      </button>
    </>
  )
}

// ---- Step 3: Confirm ----
function ConfirmStep({ mode, profile, site, position, selfiePreview, hoursLabel, onConfirm, saving, error }) {
  return (
    <>
      <div className="text-xl font-bold mb-5">
        {mode === 'in' ? 'Confirm clock-in' : 'Confirm clock-out'}
      </div>

      <div className="rounded-2xl overflow-hidden border border-white/10 mb-4">
        <div
          className="flex items-center gap-3 p-4"
          style={{ background: 'linear-gradient(180deg, #0a3a78, #0857c9, #0a3a78)' }}
        >
          {selfiePreview ? (
            <img src={selfiePreview} alt="Selfie" className="w-12 h-12 rounded-full object-cover ring-2 ring-white/40" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center font-bold">
              {(profile.full_name || '?').split(' ').map((s) => s[0]).slice(0, 2).join('')}
            </div>
          )}
          <div>
            <div className="font-semibold">{profile.full_name}</div>
            <div className="text-xs text-white/70">
              {profile.position || 'Employee'}{profile.employee_code ? ` • ${profile.employee_code}` : ''}
            </div>
          </div>
        </div>
        <div className="p-4 flex flex-col gap-3 bg-white/[.04]">
          <div className="flex items-center gap-2.5">
            <ClockIcon className="w-4 h-4 text-white/40" />
            <span className="text-xs text-white/50 flex-1">Time</span>
            <span className="text-[13px] font-semibold tnum">{timePH(new Date().toISOString())}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Calendar className="w-4 h-4 text-white/40" />
            <span className="text-xs text-white/50 flex-1">Date</span>
            <span className="text-[13px] font-semibold">{longDate(manilaToday())}</span>
          </div>
          <div className="flex items-center gap-2.5">
            <MapPin className="w-4 h-4 text-white/40" />
            <span className="text-xs text-white/50 flex-1">Location</span>
            <span className="text-[13px] font-semibold">
              {site?.name || (position ? `${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` : '—')}
            </span>
          </div>
          {mode === 'in' ? (
            <div className="flex items-center gap-2.5">
              <ScanFace className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-white/50 flex-1">Verification</span>
              <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Selfie + GPS
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <ClockIcon className="w-4 h-4 text-white/40" />
              <span className="text-xs text-white/50 flex-1">Hours worked</span>
              <span className="text-[13px] font-semibold tnum">{hoursLabel}</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg p-3">{error}</div>
      )}

      <button
        disabled={saving}
        onClick={onConfirm}
        className="w-full h-[52px] rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 shadow-[0_6px_16px_rgba(37,99,235,.35)]"
        style={{ background: 'linear-gradient(180deg, #2563eb, #14224e, #2563eb)' }}
      >
        {saving ? 'Saving…' : (<><Check className="w-[18px] h-[18px]" /> {mode === 'in' ? 'Confirm clock-in' : 'Confirm clock-out'}</>)}
      </button>
    </>
  )
}

// ---- Step 4: Success ----
function SuccessStep({ mode, row, site, onDone }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-emerald-500 text-white max-w-[520px] mx-auto">
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="w-28 h-28 rounded-full bg-white/20 flex items-center justify-center mb-7">
          <div className="w-20 h-20 rounded-full bg-white text-emerald-500 flex items-center justify-center shadow-xl">
            <Check className="w-10 h-10" strokeWidth={3} />
          </div>
        </div>
        <div className="text-[26px] font-bold">{mode === 'in' ? 'Clocked in' : 'Clocked out'}</div>
        <div className="text-[15px] mt-1 text-white/85">
          at {timePH(mode === 'in' ? row.clock_in : row.clock_out)}
        </div>
        <div className="mt-7 w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-left">
          <div className="flex items-center justify-between py-1.5 border-b border-white/15">
            <span className="text-[13px] text-white/80">Site</span>
            <span className="font-semibold text-sm">{site?.name || row.site?.name || '—'}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-white/15">
            <span className="text-[13px] text-white/80">Status</span>
            <span className="font-semibold text-sm capitalize">{row.status === 'ongoing' ? 'On shift' : row.status}</span>
          </div>
          <div className="flex items-center justify-between py-1.5">
            <span className="text-[13px] text-white/80">Verified by</span>
            <span className="font-semibold text-sm">{row.method === 'face+gps' ? 'Selfie + GPS' : 'GPS'}</span>
          </div>
        </div>
      </div>
      <div className="px-5 pb-8">
        <button
          onClick={onDone}
          className="w-full h-[52px] rounded-xl font-bold text-emerald-600 bg-white shadow-lg active:scale-[.98] transition-transform"
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

  const [step, setStep] = useState(1) // 1 location, 2 selfie, 3 confirm, 4 success
  const [site, setSite] = useState(null)
  const [position, setPosition] = useState(null)
  const [geo, setGeo] = useState(null)
  const [selfieBlob, setSelfieBlob] = useState(null)
  const [selfiePreview, setSelfiePreview] = useState('')
  const [savedRow, setSavedRow] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchMySite(profile.site_id).then(setSite).catch(() => setSite(null))
  }, [profile.site_id])

  const totalSteps = mode === 'in' ? 4 : 3
  const confirmStepNum = mode === 'in' ? 3 : 2

  const back = () => {
    if (step <= 1) return navigate('home')
    // from confirm, go back to selfie (in) or location (out)
    setStep(step - 1)
  }

  const doConfirm = async () => {
    setSaving(true)
    setError('')
    try {
      if (mode === 'in') {
        let selfieUrl = null
        if (selfieBlob) {
          try {
            selfieUrl = await uploadSelfie(profile.id, selfieBlob)
          } catch (_) {
            // selfie upload failing shouldn't block the time entry
          }
        }
        const row = await clockIn({ profile, site, lat: position?.lat, lng: position?.lng, selfieUrl })
        setSavedRow(row)
      } else {
        const row = await clockOut(existingRow, { lat: position?.lat, lng: position?.lng })
        setSavedRow(row)
      }
      refreshHome()
      setStep(totalSteps)
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

  if (step === totalSteps && savedRow) {
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
    <div className="p-4 pb-8 min-h-full bg-[#14161c]">
      <button onClick={back} className="flex items-center gap-1.5 text-sm font-semibold mb-4 text-white/90">
        <ChevronLeft className="w-[18px] h-[18px]" />
        {mode === 'in' ? 'Check in' : 'Clock out'}
      </button>
      <StepBar step={step} total={totalSteps} />

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
      {mode === 'in' && step === 2 && (
        <SelfieStep
          onCapture={(blob, preview) => {
            setSelfieBlob(blob)
            setSelfiePreview(preview)
            setStep(3)
          }}
        />
      )}
      {step === confirmStepNum && (
        <ConfirmStep
          mode={mode}
          profile={profile}
          site={site}
          position={position}
          selfiePreview={selfiePreview}
          hoursLabel={hoursLabel}
          onConfirm={doConfirm}
          saving={saving}
          error={error}
        />
      )}
    </div>
  )
}
