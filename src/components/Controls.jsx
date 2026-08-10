export default function Controls({ search, onSearch, filters, activeFilter, onFilterChange }) {
  return (
    <div className="controls-row">
      <div className="search-box">
        <span className="search-icon" aria-hidden="true">🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search requirements..."
          aria-label="Search requirements"
        />
        {search && (
          <button type="button" className="clear-btn" onClick={() => onSearch('')} aria-label="Clear search">
            ✕
          </button>
        )}
      </div>

      <div className="filter-row" role="group" aria-label="Filter requirements">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            className={`filter-btn ${activeFilter === f.key ? 'is-active' : ''}`}
            onClick={() => onFilterChange(f.key)}
            aria-pressed={activeFilter === f.key}
          >
            {f.label} <span className="count">{f.count}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
