import { useEffect, useState } from 'react'
import { api } from '../api'
import { fmtDateTime } from '../format'

export default function Todos() {
  const [items, setItems] = useState([])
  const [text, setText] = useState('')
  const [description, setDescription] = useState('')
  const [err, setErr] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editDesc, setEditDesc] = useState('')

  async function load() {
    try { setItems(await api('/todos')) } catch (e) { setErr(e.message) }
  }
  useEffect(() => { load() }, [])

  async function add(e) {
    e.preventDefault()
    if (!text.trim()) return
    try {
      const t = await api('/todos', { method: 'POST', body: { text, description } })
      setItems([t, ...items])
      setText(''); setDescription('')
    } catch (e) { setErr(e.message) }
  }

  async function toggle(t) {
    const updated = await api(`/todos/${t.id}`, { method: 'PATCH', body: { done: !t.done } })
    setItems(items.map(x => x.id === t.id ? updated : x))
  }

  function startEdit(t) {
    setEditingId(t.id)
    setEditText(t.text)
    setEditDesc(t.description || '')
  }

  async function saveEdit(t) {
    const updated = await api(`/todos/${t.id}`, {
      method: 'PATCH',
      body: { text: editText, description: editDesc },
    })
    setItems(items.map(x => x.id === t.id ? updated : x))
    setEditingId(null)
  }

  async function remove(t) {
    if (!confirm('Eintrag löschen?')) return
    await api(`/todos/${t.id}`, { method: 'DELETE' })
    setItems(items.filter(x => x.id !== t.id))
  }

  const open = items.filter(t => !t.done)
  const done = items.filter(t => t.done)

  function renderItem(t) {
    const isEditing = editingId === t.id
    return (
      <li key={t.id} className={`todo-item ${t.done ? 'done' : ''}`}>
        <input type="checkbox" checked={t.done} onChange={() => toggle(t)} />
        {isEditing ? (
          <div className="todo-edit">
            <input
              autoFocus
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') setEditingId(null) }}
              placeholder="Titel"
            />
            <textarea
              value={editDesc}
              onChange={e => setEditDesc(e.target.value)}
              placeholder="Beschreibung (optional)"
              rows={2}
            />
            <div className="todo-edit-actions">
              <button onClick={() => saveEdit(t)}>Speichern</button>
              <button className="secondary" onClick={() => setEditingId(null)}>Abbrechen</button>
            </div>
          </div>
        ) : (
          <div className="todo-body">
            <div className="todo-row">
              <span className="todo-text" onClick={() => startEdit(t)}>{t.text}</span>
              <span className="muted todo-meta">
                {t.created_by?.name || '—'} · {fmtDateTime(t.created_at)}
              </span>
              <button className="secondary small" onClick={() => startEdit(t)}>✎</button>
              <button className="danger small" onClick={() => remove(t)}>×</button>
            </div>
            {t.description && (
              <div className="todo-desc" onClick={() => startEdit(t)}>{t.description}</div>
            )}
          </div>
        )}
      </li>
    )
  }

  return (
    <>
      <div className="card">
        <h2>TO-DO Liste</h2>
        <p className="muted">Gemeinsame Liste — jede:r kann hinzufügen, abhaken, bearbeiten oder löschen.</p>
        <form onSubmit={add} style={{ marginTop: 12 }}>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Neuer Eintrag…"
          />
          <textarea
            style={{ marginTop: 8 }}
            rows={2}
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Beschreibung (optional, z.B. nötig für den Pizzaofen, beim Praxis kaufen)"
          />
          <button type="submit" style={{ marginTop: 8 }}>Hinzufügen</button>
        </form>
        {err && <div className="error">{err}</div>}
      </div>

      <div className="card">
        <h3>Offen ({open.length})</h3>
        {open.length === 0 && <p className="muted">Alles erledigt 🎉</p>}
        <ul className="todo-list">{open.map(renderItem)}</ul>
      </div>

      {done.length > 0 && (
        <div className="card">
          <h3>Erledigt ({done.length})</h3>
          <ul className="todo-list">{done.map(renderItem)}</ul>
        </div>
      )}
    </>
  )
}
