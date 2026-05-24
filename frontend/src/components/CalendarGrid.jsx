import { DOW_DE } from '../format'

export default function CalendarGrid({ month, bookings, userId, onDayClick, onBookingClick }) {
  const year = month.getFullYear()
  const m = month.getMonth()
  const first = new Date(year, m, 1)
  const lastDay = new Date(year, m + 1, 0).getDate()
  // Monday-first
  const startOffset = (first.getDay() + 6) % 7
  const cells = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= lastDay; d++) cells.push(new Date(year, m, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const todayStr = toISO(new Date())

  function toISO(d) {
    const y = d.getFullYear(), mm = String(d.getMonth() + 1).padStart(2, '0'), dd = String(d.getDate()).padStart(2, '0')
    return `${y}-${mm}-${dd}`
  }

  function bookingsForDay(date) {
    const s = toISO(date)
    return bookings.filter(b => b.start_date <= s && b.end_date > s)
  }

  return (
    <div>
      <div className="cal-grid" style={{ marginBottom: 4 }}>
        {DOW_DE.map(d => <div key={d} className="cal-dow">{d}</div>)}
      </div>
      <div className="cal-grid">
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="cal-cell empty" />
          const ds = toISO(d)
          const dayBookings = bookingsForDay(d)
          return (
            <div
              key={i}
              className={`cal-cell ${ds === todayStr ? 'today' : ''} ${onDayClick ? 'clickable' : ''}`}
              onClick={() => onDayClick && onDayClick(ds)}
            >
              <div className="day-num">{d.getDate()}</div>
              {dayBookings.map(b => {
                const cls = `booking-chip kind-${b.kind || 'internal'} ${b.user_id === userId ? 'mine' : ''}`
                return (
                  <span
                    key={b.id}
                    className={cls}
                    title={`${b.kind === 'external' ? 'Extern' : b.user.name}${b.note ? ' · ' + b.note : ''}`}
                    onClick={(e) => { e.stopPropagation(); onBookingClick && onBookingClick(b) }}
                  >
                    {b.kind === 'external' ? `🛏 ${b.note || 'Extern'}` : b.user.name}
                  </span>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
