import { useEffect, useState } from 'react'
import { api } from '../api'
import { useAuth } from '../App.jsx'
import CalendarGrid from '../components/CalendarGrid.jsx'
import BookingModal from '../components/BookingModal.jsx'
import { fmtDate, fmtMonth } from '../format'

export default function Calendar() {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [bookings, setBookings] = useState([])
  const [modal, setModal] = useState(null) // {initial} or null
  const { user } = useAuth()

  async function load() { setBookings(await api('/bookings')) }
  useEffect(() => { load() }, [])

  function openNew(dateISO) {
    setModal({ initial: { start_date: dateISO, end_date: '', kind: 'internal', note: '' } })
  }
  function openEdit(b) { setModal({ initial: b }) }

  async function save(data) {
    if (modal.initial.id) {
      await api(`/bookings/${modal.initial.id}`, { method: 'PATCH', body: data })
    } else {
      await api('/bookings', { method: 'POST', body: data })
    }
    setModal(null); await load()
  }
  async function remove() {
    if (!confirm('Buchung löschen?')) return
    await api(`/bookings/${modal.initial.id}`, { method: 'DELETE' })
    setModal(null); await load()
  }

  const upcoming = bookings
    .filter(b => new Date(b.end_date) >= new Date())
    .sort((a, b) => a.start_date.localeCompare(b.start_date))

  return (
    <>
      <div className="card">
        <div className="cal-header">
          <button className="secondary" onClick={() => { const d = new Date(cursor); d.setMonth(d.getMonth() - 1); setCursor(d) }}>‹ Zurück</button>
          <h2>{fmtMonth(cursor)}</h2>
          <button className="secondary" onClick={() => { const d = new Date(cursor); d.setMonth(d.getMonth() + 1); setCursor(d) }}>Weiter ›</button>
        </div>
        <CalendarGrid
          month={cursor}
          bookings={bookings}
          userId={user.id}
          onDayClick={openNew}
          onBookingClick={openEdit}
        />
        <div className="legend">
          <span><span className="dot kind-internal" /> Intern</span>
          <span><span className="dot kind-external" /> Extern</span>
          <span className="muted">Tipp: Tag anklicken für neue Buchung — Buchung anklicken zum Bearbeiten</span>
        </div>
      </div>

      <div className="card">
        <h3>Kommende Buchungen</h3>
        {upcoming.length === 0 && <p className="muted">Keine kommenden Buchungen.</p>}
        {upcoming.map(b => {
          const canModify = b.kind === 'external' || b.user_id === user.id
          return (
            <div key={b.id} className="thread-row">
              <div>
                <div className="title">
                  <span className={`dot kind-${b.kind}`} />{' '}
                  {b.kind === 'external' ? `Extern: ${b.note || '—'}` : `${b.user.name}${b.user_id === user.id ? ' (du)' : ''}`}
                </div>
                <div className="meta">
                  {fmtDate(b.start_date)} → {fmtDate(b.end_date)}
                  {b.kind === 'internal' && b.note && ` · ${b.note}`}
                </div>
              </div>
              {canModify && <button className="secondary" onClick={() => openEdit(b)}>Bearbeiten</button>}
            </div>
          )
        })}
      </div>

      {modal && (
        <BookingModal
          initial={modal.initial}
          canModify={!modal.initial.id || modal.initial.kind === 'external' || modal.initial.user_id === user.id}
          onSave={save}
          onDelete={remove}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
