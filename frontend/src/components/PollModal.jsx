import { useState } from 'react'

export default function PollModal({ initial, onSave, onClose }) {
  const [question, setQuestion] = useState(initial?.question || '')
  const [multiple, setMultiple] = useState(initial?.multiple || false)
  const [options, setOptions] = useState(initial?.options?.length ? [...initial.options] : ['', ''])
  const [err, setErr] = useState('')

  function submit(e) {
    e.preventDefault()
    const cleaned = options.map(o => o.trim()).filter(Boolean)
    if (!question.trim()) { setErr('Frage fehlt'); return }
    if (cleaned.length < 2) { setErr('Mindestens 2 Optionen erforderlich'); return }
    onSave({ question: question.trim(), multiple, options: cleaned })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{initial ? 'Umfrage bearbeiten' : 'Umfrage hinzufügen'}</h3>
          <button className="link-btn" onClick={onClose} aria-label="Schließen">✕</button>
        </div>
        <form onSubmit={submit}>
          <label>Frage</label>
          <input value={question} onChange={e => setQuestion(e.target.value)} autoFocus required />

          <label style={{ marginTop: 10 }}>
            <input
              type="checkbox"
              checked={multiple}
              onChange={e => setMultiple(e.target.checked)}
              style={{ width: 'auto', marginRight: 6 }}
            />
            Mehrfachauswahl erlauben
          </label>

          <label>Optionen</label>
          {options.map((o, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <input
                value={o}
                onChange={e => { const c = [...options]; c[i] = e.target.value; setOptions(c) }}
                placeholder={`Option ${i + 1}`}
              />
              {options.length > 2 && (
                <button type="button" className="danger" onClick={() => setOptions(options.filter((_, j) => j !== i))}>×</button>
              )}
            </div>
          ))}
          <button type="button" className="secondary" onClick={() => setOptions([...options, ''])}>
            + Option hinzufügen
          </button>

          {err && <div className="error">{err}</div>}

          <div className="modal-actions">
            <span style={{ flex: 1 }} />
            <button type="button" className="secondary" onClick={onClose}>Abbrechen</button>
            <button type="submit">Speichern</button>
          </div>
        </form>
      </div>
    </div>
  )
}
