export default function Toast({ message }) {
  if (!message) return null
  return (
    <div className="fixed bottom-[30px] left-1/2 -translate-x-1/2 z-100 flex items-center gap-3 bg-ink text-white rounded-xl px-4 py-3.5 shadow-[0_18px_44px_rgba(15,23,42,.28)] animate-fadeIn">
      <div className="w-[26px] h-[26px] rounded-full bg-green flex items-center justify-center text-sm text-white shrink-0">✓</div>
      <span className="text-sm font-medium">{message}</span>
    </div>
  )
}
