import { useEffect, useRef, useState } from 'react'
import { getPlayerId } from '../utils/buildTransfer'

export default function SettingsMenu({ onReset, build, onExportBuild, onImportBuild }) {
  const [open, setOpen] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const rootRef = useRef(null)
  const fileInputRef = useRef(null)
  const [playerId, setPlayerId] = useState('')

  useEffect(() => {
    setPlayerId(getPlayerId())
  }, [])

  useEffect(() => {
    const onClick = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false)
        setConfirming(false)
      }
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setOpen(false)
        setConfirming(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  const copyPlayerId = async () => {
    try {
      await navigator.clipboard.writeText(playerId)
    } catch {
      // Clipboard permissions may be unavailable; the ID remains visible.
    }
  }

  const handleImport = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      const text = await file.text()
      onImportBuild(text)
    } catch {
      onImportBuild(null, 'Could not read that build file.')
    }
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }}>
      <button
        type="button"
        className="icon-btn"
        aria-label="Settings"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        ⚙
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".voxlbuild.json,application/json,.json"
        onChange={handleImport}
        style={{ display: 'none' }}
      />

      {open && (
        <div
          className="pixel-panel"
          style={{
            position: 'absolute',
            right: 0,
            top: 48,
            width: 280,
            zIndex: 50,
          }}
        >
          <div className="pixel-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <div style={{ fontFamily: 'var(--font-pixel)', fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1 }}>PLAYER ID</div>
              <button
                type="button"
                className="pixel-btn pixel-btn-block"
                title="Copy your private browser ID"
                onClick={copyPlayerId}
                style={{ marginTop: 6, fontFamily: 'monospace', letterSpacing: 1 }}
              >
                {playerId || 'GENERATING...'}
              </button>
              <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 5, lineHeight: 1.35 }}>
                Your builds are stored only in this browser. No account is required.
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border-iron)' }} />

            {build && (
              <button
                type="button"
                className="pixel-btn pixel-btn-gold pixel-btn-block"
                onClick={() => {
                  onExportBuild(build)
                  setOpen(false)
                }}
              >
                Export Build
              </button>
            )}

            <button
              type="button"
              className="pixel-btn pixel-btn-block"
              onClick={() => {
                fileInputRef.current?.click()
                setOpen(false)
              }}
            >
              Import Build
            </button>

            <div style={{ fontSize: 12, color: 'var(--text-faint)', lineHeight: 1.35 }}>
              Export one build as a <strong>.voxlbuild.json</strong> file and send it to a friend. Importing creates a separate copy in their browser.
            </div>

            <div style={{ height: 1, background: 'var(--border-iron)' }} />

            {onReset && !confirming ? (
              <button type="button" className="pixel-btn pixel-btn-danger pixel-btn-block" onClick={() => setConfirming(true)}>
                Reset Build Progress
              </button>
            ) : confirming ? (
              <>
                <p style={{ fontSize: 16, color: 'var(--text-mid)', margin: 0 }}>
                  Reset all progress for this build?
                </p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    className="pixel-btn pixel-btn-block"
                    onClick={() => setConfirming(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="pixel-btn pixel-btn-danger pixel-btn-block"
                    onClick={() => {
                      onReset()
                      setConfirming(false)
                      setOpen(false)
                    }}
                  >
                    Reset
                  </button>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}
