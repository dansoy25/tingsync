import { supabase } from './supabase'

export const manilaToday = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })

export function shiftDays(isoDate, delta) {
  const d = new Date(isoDate + 'T00:00:00+08:00')
  d.setDate(d.getDate() + delta)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}

// Manila clock time as fractional hours (e.g. 8.25 = 8:15 AM)
function manilaHourNow() {
  const parts = new Intl.DateTimeFormat('en-PH', {
    hour: 'numeric', minute: 'numeric', hour12: false, timeZone: 'Asia/Manila',
  }).formatToParts(new Date())
  const h = Number(parts.find((p) => p.type === 'hour')?.value || 0)
  const m = Number(parts.find((p) => p.type === 'minute')?.value || 0)
  return h + m / 60
}

const LATE_AFTER = 8 + 10 / 60 // 8:10 AM grace period

export function haversineM(lat1, lng1, lat2, lng2) {
  const R = 6371000
  const toRad = (d) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return Math.round(2 * R * Math.asin(Math.sqrt(a)))
}

export function getPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('GPS is not available on this device.'))
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) =>
        reject(
          new Error(
            err.code === 1
              ? 'Location permission denied. Enable it in your device settings to clock in.'
              : 'Could not get your location. Move to an open area and try again.'
          )
        ),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    )
  })
}

export async function fetchMyToday(profileId) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, site:sites(name)')
    .eq('profile_id', profileId)
    .eq('work_date', manilaToday())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function fetchMyWeekHours(profileId) {
  const today = manilaToday()
  const monday = (() => {
    const d = new Date(today + 'T00:00:00+08:00')
    const day = d.getDay() || 7
    return shiftDays(today, -(day - 1))
  })()
  const { data, error } = await supabase
    .from('attendance')
    .select('work_date, hours')
    .eq('profile_id', profileId)
    .gte('work_date', monday)
  if (error) throw error
  return (data || []).reduce((t, r) => t + Number(r.hours || 0), 0)
}

export async function fetchMyLeaveBalance(profileId) {
  const { data } = await supabase
    .from('leave_balances')
    .select('balance')
    .eq('profile_id', profileId)
  return (data || []).reduce((t, r) => t + Number(r.balance || 0), 0)
}

export async function fetchMySite(siteId) {
  if (!siteId) return null
  const { data, error } = await supabase.from('sites').select('*').eq('id', siteId).maybeSingle()
  if (error) throw error
  return data
}

export async function fetchMyHistory(profileId, fromDate) {
  let q = supabase
    .from('attendance')
    .select('*, site:sites(name)')
    .eq('profile_id', profileId)
    .order('work_date', { ascending: false })
    .limit(60)
  if (fromDate) q = q.gte('work_date', fromDate)
  const { data, error } = await q
  if (error) throw error
  return data
}

export async function fetchAnnouncements(orgId) {
  const { data } = await supabase
    .from('announcements')
    .select('*')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false })
    .limit(5)
  return data || []
}

export async function uploadSelfie(profileId, blob) {
  const path = `${profileId}/${manilaToday()}-${Date.now()}.jpg`
  const { error } = await supabase.storage.from('selfies').upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (error) throw error
  const { data } = supabase.storage.from('selfies').getPublicUrl(path)
  return data.publicUrl
}

// Upload a profile picture to the public `avatars` bucket and save it on the profile.
export async function uploadAvatar(profileId, blob) {
  const path = `${profileId}/avatar.jpg`
  const { error } = await supabase.storage.from('avatars').upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: true,
  })
  if (error) throw error
  const { data } = supabase.storage.from('avatars').getPublicUrl(path)
  const url = `${data.publicUrl}?v=${Date.now()}` // cache-bust so the new photo shows immediately
  const { error: pErr } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', profileId)
  if (pErr) throw pErr
  return url
}

// Downscale an image File to a centered square JPEG blob (keeps uploads small).
export function squareImageBlob(file, size = 512) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const side = Math.min(img.width, img.height)
      const sx = (img.width - side) / 2
      const sy = (img.height - side) / 2
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const g = canvas.getContext('2d')
      g.drawImage(img, sx, sy, side, side, 0, 0, size, size)
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process image'))), 'image/jpeg', 0.85)
    }
    img.onerror = () => reject(new Error('Could not read that image'))
    img.src = URL.createObjectURL(file)
  })
}

export async function clockIn({ profile, site, lat, lng, selfieUrl }) {
  const status = manilaHourNow() > LATE_AFTER ? 'late' : 'ongoing'
  const { data, error } = await supabase
    .from('attendance')
    .insert({
      profile_id: profile.id,
      org_id: profile.org_id,
      site_id: site?.id || null,
      work_date: manilaToday(),
      clock_in: new Date().toISOString(),
      status,
      method: selfieUrl ? 'face+gps' : 'gps',
      lat,
      lng,
      selfie_url: selfieUrl || null,
    })
    .select('*, site:sites(name)')
    .single()
  if (error) throw error
  return data
}

export async function clockOut(row, { lat, lng } = {}) {
  const out = new Date()
  const hours = Math.max(0, (out - new Date(row.clock_in)) / 3600000)
  const { data, error } = await supabase
    .from('attendance')
    .update({
      clock_out: out.toISOString(),
      hours: Math.round(hours * 100) / 100,
      status: row.status === 'late' ? 'late' : 'present',
      clock_out_lat: lat ?? null,
      clock_out_lng: lng ?? null,
    })
    .eq('id', row.id)
    .select('*, site:sites(name)')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('Could not save your clock-out. Try again.')
  return data[0]
}
