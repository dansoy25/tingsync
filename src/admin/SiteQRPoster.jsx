import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import BrandLogo from '../components/BrandLogo'

export default function SiteQRPoster({ site }) {
  const canvasRef = useRef(null)
  const [dataUrl, setDataUrl] = useState('')

  useEffect(() => {
    if (!site?.qr_payload) return
    QRCode.toCanvas(canvasRef.current, site.qr_payload, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 300,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).catch(console.error)
    QRCode.toDataURL(site.qr_payload, {
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 800,
      color: { dark: '#0f172a', light: '#ffffff' },
    }).then(setDataUrl)
  }, [site?.qr_payload])

  if (!site) return null

  function download() {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${site.name.replace(/\s+/g, '-').toLowerCase()}-gate-qr.png`
    a.click()
  }

  return (
    <div id="qr-poster-printable" className="bg-white rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.08)] p-8 print:shadow-none print:p-12 max-w-[680px] mx-auto">
      <div className="flex justify-end gap-2 mb-4 print:hidden">
        <button onClick={download} className="border border-border bg-white text-ink-soft text-sm font-semibold px-4 py-2 rounded-lg">
          ⤓ Download PNG
        </button>
        <button onClick={() => window.print()} className="border-none brand-btn text-white text-sm font-semibold px-4 py-2 rounded-lg">
          🖨 Print poster
        </button>
      </div>

      <div className="flex items-center justify-between border-b-2 border-ink pb-5 mb-7">
        <BrandLogo size={22} dark={false} />
        <div className="text-right text-[11px] font-bold tracking-wide uppercase text-brand">Site QR</div>
      </div>

      <div className="flex flex-col md:flex-row gap-7 items-center md:items-start">
        <div className="rounded-2xl border-[3px] border-ink p-3 bg-white shrink-0">
          <canvas ref={canvasRef} />
        </div>
        <div className="flex-1 text-center md:text-left">
          <div className="text-[11px] uppercase font-bold text-muted tracking-wide">Site</div>
          <div className="text-2xl font-extrabold leading-tight">{site.name}</div>
          {site.address && <div className="text-sm text-ink-soft mt-1">{site.address}</div>}
          <div className="mt-6 inline-block border border-border rounded-xl px-4 py-3 text-left">
            <div className="text-[11px] uppercase font-bold text-muted tracking-wide mb-1">How to check in</div>
            <ol className="text-sm leading-relaxed list-decimal pl-5">
              <li>Open the TingSync app on your phone.</li>
              <li>Tap <span className="font-semibold">Clock in</span>.</li>
              <li>Point your camera at this QR code.</li>
              <li>Confirm your location & verify your face.</li>
            </ol>
          </div>
        </div>
      </div>

      <div className="mt-8 pt-5 border-t border-border text-[11px] text-faint flex justify-between">
        <div>Geofence radius: <span className="tnum">{site.radius_m} m</span></div>
        <div className="tnum">{site.qr_payload}</div>
      </div>
    </div>
  )
}
