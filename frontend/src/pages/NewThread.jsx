import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, uploadFile } from '../api'
import PollModal from '../components/PollModal.jsx'

export default function NewThread() {
  const nav = useNavigate()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [poll, setPoll] = useState(null)
  const [showPollModal, setShowPollModal] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const fileInputRef = useRef(null)

  async function onFiles(e) {
    setErr('')
    try {
      for (const f of e.target.files) {
        const a = await uploadFile(f)
        setAttachments(prev => [...prev, a])
      }
    } catch (ex) { setErr(ex.message) }
    e.target.value = ''
  }

  function removeAttachment(id) {
    setAttachments(attachments.filter(a => a.id !== id))
  }

  async function submit(e) {
    e.preventDefault()
    setErr(''); setBusy(true)
    try {
      const payload = {
        title, body,
        attachment_ids: attachments.map(a => a.id),
        poll,
      }
      const t = await api('/threads', { method: 'POST', body: payload })
      nav(`/forum/${t.id}`)
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  return (
    <div className="card">
      <h2>Neuer Thread</h2>
      <form onSubmit={submit}>
        <label>Titel</label>
        <input value={title} onChange={e => setTitle(e.target.value)} required />
        <label>Text</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} rows={5} />

        <hr className="thread-sep" />

        <div className="thread-extras">
          <div className="thread-extra">
            <h4>📎 Anhänge</h4>
            <p className="muted">Bilder oder Dokumente (max. 25 MB)</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={onFiles}
              style={{ display: 'none' }}
            />
            <button type="button" className="secondary" onClick={() => fileInputRef.current?.click()}>
              Datei auswählen
            </button>
            {attachments.length > 0 && (
              <div className="attachments" style={{ marginTop: 10 }}>
                {attachments.map(a => (
                  <span key={a.id} className="attachment-chip">
                    📎 {a.filename}
                    <button type="button" className="link-btn" onClick={() => removeAttachment(a.id)} title="Entfernen">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="thread-extra">
            <h4>📊 Umfrage</h4>
            {poll ? (
              <div className="poll-summary">
                <div><strong>{poll.question}</strong></div>
                <div className="muted" style={{ fontSize: '0.85rem', margin: '4px 0' }}>
                  {poll.options.length} Optionen · {poll.multiple ? 'Mehrfachauswahl' : 'Einfachauswahl'}
                </div>
                <ul style={{ margin: '4px 0 8px 18px', padding: 0 }}>
                  {poll.options.map((o, i) => <li key={i} style={{ fontSize: '0.85rem' }}>{o}</li>)}
                </ul>
                <button type="button" className="secondary" onClick={() => setShowPollModal(true)}>Bearbeiten</button>
                {' '}
                <button type="button" className="danger" onClick={() => setPoll(null)}>Entfernen</button>
              </div>
            ) : (
              <>
                <p className="muted">Erstelle eine Abstimmung mit mehreren Optionen.</p>
                <button type="button" className="secondary" onClick={() => setShowPollModal(true)}>
                  + Umfrage hinzufügen
                </button>
              </>
            )}
          </div>
        </div>

        {err && <div className="error">{err}</div>}
        <button type="submit" disabled={busy} style={{ marginTop: 20 }}>
          {busy ? 'Wird erstellt…' : 'Thread erstellen'}
        </button>
      </form>

      {showPollModal && (
        <PollModal
          initial={poll}
          onSave={(p) => { setPoll(p); setShowPollModal(false) }}
          onClose={() => setShowPollModal(false)}
        />
      )}
    </div>
  )
}
