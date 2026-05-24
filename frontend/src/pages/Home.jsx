import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../App.jsx'
import CalendarGrid from '../components/CalendarGrid.jsx'
import { fmtDateTime, fmtMonth } from '../format'

export default function Home() {
  const [bookings, setBookings] = useState([])
  const [threads, setThreads] = useState([])
  const { user } = useAuth()
  const month = (() => { const d = new Date(); d.setDate(1); return d })()

  useEffect(() => {
    api('/bookings').then(setBookings)
    api('/threads?limit=5').then(setThreads)
  }, [])

  return (
    <>
      <div className="card">
        <div className="cal-header">
          <h2>{fmtMonth(month)}</h2>
          <Link to="/calendar" className="btn">Kalender öffnen</Link>
        </div>
        <CalendarGrid month={month} bookings={bookings} userId={user.id} />
      </div>

      <div className="card">
        <div className="cal-header">
          <h2>Neueste Threads</h2>
          <Link to="/forum" className="btn">Alle Threads</Link>
        </div>
        {threads.length === 0 && <p className="muted">Noch keine Threads. <Link to="/forum/new">Erstellen →</Link></p>}
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
    </>
  )
}
