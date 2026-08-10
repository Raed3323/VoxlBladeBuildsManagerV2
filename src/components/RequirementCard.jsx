import { CATEGORIES } from '../data/builds'
import QuantityControl from './QuantityControl'

export default function RequirementCard({ requirement, qty, isComplete, onSetQty, onOpen }) {
  const cat = CATEGORIES[requirement.category]
  const isMulti = requirement.qty > 1

  const toggleComplete = () => {
    onSetQty(isComplete ? 0 : requirement.qty)
  }

  return (
    <article className={`req-card ${isComplete ? 'is-complete' : ''} ${requirement.optional ? 'is-optional' : ''}`}>
      <div className="req-card-top">
        <span className="req-card-tag">
          <span aria-hidden="true">{cat.icon}</span>
          {cat.label.toUpperCase()}
        </span>
        {requirement.optional && <span className="req-card-optional-badge">OPTIONAL</span>}
      </div>

      <button type="button" className="req-card-name" onClick={() => onOpen(requirement)}>
        {isMulti ? `${requirement.qty}x ${requirement.name}` : requirement.name}
      </button>

      {requirement.note && <div className="req-card-note">{requirement.note}</div>}

      <span className={`req-card-status ${isComplete ? 'is-complete' : ''}`}>
        {isComplete ? (
          <>
            <span className="check-icon" aria-hidden="true">✓</span> OBTAINED
          </>
        ) : (
          'INCOMPLETE'
        )}
      </span>

      <div className="req-card-actions">
        {isMulti ? (
          <QuantityControl
            value={qty}
            max={requirement.qty}
            onChange={onSetQty}
            label={requirement.name}
          />
        ) : (
          <button
            type="button"
            className={`pixel-btn pixel-btn-block ${isComplete ? 'pixel-btn-complete' : ''}`}
            onClick={toggleComplete}
          >
            {isComplete ? 'Mark Incomplete' : 'Mark Complete'}
          </button>
        )}
      </div>
    </article>
  )
}
