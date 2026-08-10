export default function PixelPanel({ title, icon, children, className = '', bodyClassName = '' }) {
  return (
    <section className={`pixel-panel ${className}`}>
      {title && (
        <h2 className="pixel-panel-title">
          {icon && <span aria-hidden="true">{icon}</span>}
          {title}
        </h2>
      )}
      <div className={`pixel-panel-body ${bodyClassName}`}>{children}</div>
    </section>
  )
}
