import { useEffect, useState } from 'react'

export default function BookingModal({ initial, onSave, onDelete, onClose, canModify = true }) {
  const [start, setStart] = useState(initial?.start_date || '')
  const [end, setEnd] = useState(initial?.end_date || '')
  const [kind, setKind] = useState(initial?.kind || 'internal')
  const [note, setNote] = useState(initial?.note || '')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  // Default end = start + 1 day if not yet set
  useEffect(() => {
    if (start && !end) {
      const d = new Date(start); d.setDate(d.getDate() + 1)
      setEnd(d.toISOString().slice(0, 10))
    }
  }, [start])

  async function submit(e) {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      await onSave({ start_date: start, end_date: end, kind, note })
    } catch (ex) {
      setErr(ex.message); setBusy(false)
    }
  }

  const isEdit = !!initial?.id
  const readOnly = isEdit && !canModify

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{isEdit ? 'Buchung bearbeiten' : 'Neue Buchung'}</h3>
          <button className="link-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="row">
            <div>
              <label>Anreise</label>
              <input type="date" value={start} onChange={e => setStart(e.target.value)} required disabled={readOnly} />
            </div>
            <div>
              <label>Abreise</label>
              <input type="date" value={end} onChange={e => setEnd(e.target.value)} required disabled={readOnly} />
            </div>
          </div>

          <label>Art der Buchung</label>
          <div className="kind-toggle">
            <label className={`pill ${kind === 'internal' ? 'active' : ''}`}>
              <input type="radio" name="kind" value="internal" checked={kind === 'internal'} onChange={() => setKind('internal')} disabled={readOnly} />
              <span className="dot kind-internal" /> Intern (eigene Buchung)
            </label>
            <label className={`pill ${kind === 'external' ? 'active' : ''}`}>
              <input type="radio" name="kind" value="external" checked={kind === 'external'} onChange={() => setKind('external')} disabled={readOnly} />
              <span className="dot kind-external" /> Extern (Gäste)
            </label>
          </div>

          <label>Notiz</label>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder={kind === 'external' ? 'z.B. Familie Müller' : 'z.B. Sommerurlaub'} disabled={readOnly} />

          {readOnly && <div className="muted" style={{ marginTop: 8 }}>Diese interne Buchung kann nur vom Ersteller bearbeitet werden.</div>}
          {err && <div className="error">{err}</div>}

          <div className="modal-actions">
            {isEdit && canModify && (
              <button type="button" className="danger" onClick={onDelete}>Löschen</button>
            )}
            <span style={{ flex: 1 }} />
            <button type="button" className="secondary" onClick={onClose}>Abbrechen</button>
            {!readOnly && <button type="submit" disabled={busy}>{busy ? 'Speichern…' : 'Speichern'}</button>}
          </div>
        </form>
      </div>
    </div>
  )
}
