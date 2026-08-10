export default function CategoryHeader({ icon, label, complete, total, optional }) {
  return (
    <div className="category-header">
      <span className="cat-icon" aria-hidden="true">{icon}</span>
      <h3>{label}</h3>
      <span className="cat-count">
        {complete} / {total}
      </span>
      {optional && <span className="cat-optional-tag">OPTIONAL</span>}
      <span className="cat-rule" aria-hidden="true" />
    </div>
  )
}
