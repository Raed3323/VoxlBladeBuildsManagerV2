import { useMemo } from 'react'

// A handful of slow-drifting embers for atmosphere. Purely decorative,
// aria-hidden, and respects prefers-reduced-motion via CSS.
export default function AmbientBackground() {
  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: Math.round(Math.random() * 100),
        delay: Math.round(Math.random() * 12),
        duration: 14 + Math.round(Math.random() * 10),
        color: i % 3 === 0 ? 'var(--accent-blood-bright)' : i % 3 === 1 ? 'var(--accent-gold-bright)' : 'var(--accent-violet-bright)',
      })),
    []
  )

  return (
    <div className="app-bg" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="particle"
          style={{
            left: `${p.left}%`,
            bottom: '-10px',
            color: p.color,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  )
}
