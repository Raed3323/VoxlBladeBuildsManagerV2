export default function ToastStack({ toasts }) {
  if (toasts.length === 0) return null

  return (
    <div className="toast-stack" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type === 'incomplete' ? 'toast-incomplete' : ''} ${t.leaving ? 'leaving' : ''}`}>
          <div className="toast-title">
            {t.type === 'incomplete' ? '✕ ITEM REMOVED' : '✓ ITEM OBTAINED'}
          </div>
          <div className="toast-body">{t.message}</div>
        </div>
      ))}
    </div>
  )
}
