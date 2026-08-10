export default function Dashboard({ buildName, buildTags = [], progress }) {
  const {
    percent,
    fullPercent,
    mandatoryComplete,
    mandatoryTotal,
    mandatoryRemaining,
    optionalComplete,
    optionalTotal,
    isFullyComplete,
  } = progress

  return (
    <section className="pixel-panel dashboard">
      <div className="dashboard-top">
        <div className="dashboard-heading">
          <span className="dashboard-title">{buildName} &mdash; Build Progress</span>
          {buildTags.length > 0 && (
            <span className="dashboard-tags">
              {buildTags.map((tag) => <span key={tag} className="build-tag-chip">{tag}</span>)}
            </span>
          )}
        </div>
        <span className="dashboard-percent">{percent}%</span>
      </div>

      <div
        className="progress-bar-track"
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Build completion"
      >
        <div
          className={`progress-bar-fill ${isFullyComplete ? 'is-complete' : ''}`}
          style={{ width: `${percent}%` }}
        />
        <div className="progress-bar-label">
          {isFullyComplete ? 'BUILD COMPLETE' : `${mandatoryComplete} / ${mandatoryTotal} REQUIREMENTS`}
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-box">
          <div className="stat-box-value">{mandatoryTotal}</div>
          <div className="stat-box-label">Requirements</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-value stat-success">{mandatoryComplete}</div>
          <div className="stat-box-label">Completed</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-value stat-danger">{mandatoryRemaining}</div>
          <div className="stat-box-label">Remaining</div>
        </div>
        <div className="stat-box">
          <div className="stat-box-value stat-muted">
            {optionalComplete} / {optionalTotal}
          </div>
          <div className="stat-box-label">Optional</div>
        </div>
      </div>

      {optionalTotal > 0 && (
        <>
          <div className="optional-strip">
            <span>
              <strong>Optional items</strong> ({optionalComplete} / {optionalTotal}) do not affect main progress.
            </span>
            <span className={`optional-pill ${optionalComplete >= optionalTotal ? 'is-complete' : ''}`}>
              {optionalComplete >= optionalTotal ? 'OBTAINED' : 'NOT OBTAINED'}
            </span>
          </div>

          <div className="optional-strip" style={{ marginTop: -10 }}>
            <span>
              <strong>100% Completion</strong> (includes optional items)
            </span>
            <span className={`optional-pill ${fullPercent >= 100 ? 'is-complete' : ''}`}>{fullPercent}%</span>
          </div>
        </>
      )}
    </section>
  )
}
