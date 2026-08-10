import { useEffect, useState } from 'react'

export default function QuantityControl({ value, max, onChange, label }) {
  const [bump, setBump] = useState(false)

  useEffect(() => {
    if (!bump) return
    const t = setTimeout(() => setBump(false), 180)
    return () => clearTimeout(t)
  }, [bump])

  const step = (delta) => {
    const next = Math.max(0, Math.min(max, value + delta))
    if (next !== value) {
      onChange(next)
      setBump(true)
    }
  }

  return (
    <div className="qty-control" role="group" aria-label={label ?? 'Quantity'}>
      <button
        type="button"
        onClick={() => step(-1)}
        disabled={value <= 0}
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className={`qty-value ${bump ? 'bump' : ''}`}>
        {value} / {max}
      </span>
      <button
        type="button"
        onClick={() => step(1)}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  )
}
