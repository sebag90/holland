import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { fmtDateTime } from '../format'

export default function Forum() {
  const [threads, setThreads] = useState([])
  useEffect(() => { api('/threads').then(setThreads) }, [])

  return (
    <div className="card">
      <div className="cal-header">
        <h2>Forum</h2>
        <Link to="/forum/new" className="btn">+ Neuer Thread</Link>
      </div>
      {threads.length === 0 && <p className="muted">Noch keine Threads.</p>}
      {threads.map(t => (
        <div key={t.id} className="thread-row">
          <div>
            <Link to={`/forum/${t.id}`} className="title">{t.title}</Link>
            {t.has_poll && <span style={{ marginLeft: 8, fontSize: '0.75rem', background: 'var(--accent)', padding: '2px 6px', borderRadius: 4 }}>poll</span>}
            <div className="meta">von {t.user.name} · {fmtDateTime(t.created_at)}</div>
          </div>
          <div className="muted">{t.reply_count} {t.reply_count === 1 ? 'Antwort' : 'Antworten'}</div>
        </div>
      ))}
    </div>
  )
}
