import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { api, uploadFile, attachmentUrl } from '../api'
import { useAuth } from '../App.jsx'
import { fmtDateTime } from '../format'

function Attachments({ items }) {
  if (!items?.length) return null
  return (
    <div className="attachments">
      {items.map(a => {
        const isImg = (a.content_type || '').startsWith('image/')
        if (isImg) {
          return (
            <a key={a.id} href={attachmentUrl(a.id)} target="_blank" rel="noreferrer" title={a.filename}>
              <img src={attachmentUrl(a.id)} alt={a.filename} style={{ maxWidth: 200, maxHeight: 160, borderRadius: 4, display: 'block' }} />
            </a>
          )
        }
        return <a key={a.id} href={attachmentUrl(a.id)} target="_blank" rel="noreferrer">📎 {a.filename}</a>
      })}
    </div>
  )
}

function Poll({ poll, onVote }) {
  const { user } = useAuth()
  const total = poll.options.reduce((s, o) => s + o.votes, 0)
  const mySelected = poll.options.filter(o => o.voters.includes(user.id)).map(o => o.id)
  const [sel, setSel] = useState(mySelected)

  function toggle(id) {
    if (poll.multiple) setSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
    else setSel([id])
  }

  return (
    <div className="poll">
      <strong>📊 {poll.question}</strong> <span className="muted">({poll.multiple ? 'multiple choice' : 'single choice'})</span>
      {poll.options.map(o => {
        const pct = total ? Math.round((o.votes / total) * 100) : 0
        const checked = sel.includes(o.id)
        return (
          <div key={o.id} className="poll-option">
            <input type={poll.multiple ? 'checkbox' : 'radio'} checked={checked} onChange={() => toggle(o.id)} style={{ width: 'auto' }} />
            <div className="poll-bar">
              <div className="fill" style={{ width: `${pct}%` }} />
              <div className="label">{o.text} — {o.votes} ({pct}%)</div>
            </div>
          </div>
        )
      })}
      <button onClick={() => onVote(sel)} disabled={sel.length === 0} style={{ marginTop: 8 }}>
        {mySelected.length ? 'Update vote' : 'Vote'}
      </button>
    </div>
  )
}

export default function ThreadView() {
  const { id } = useParams()
  const nav = useNavigate()
  const { user } = useAuth()
  const [t, setT] = useState(null)
  const [reply, setReply] = useState('')
  const [attachments, setAttachments] = useState([])
  const [err, setErr] = useState('')

  async function load() {
    try { setT(await api(`/threads/${id}`)) }
    catch (e) { setErr(e.message) }
  }
  useEffect(() => { load() }, [id])

  async function onFiles(e) {
    for (const f of e.target.files) {
      try { const a = await uploadFile(f); setAttachments(prev => [...prev, a]) }
      catch (ex) { setErr(ex.message) }
    }
    e.target.value = ''
  }

  async function submitReply(e) {
    e.preventDefault()
    if (!reply.trim() && attachments.length === 0) return
    try {
      await api(`/threads/${id}/posts`, {
        method: 'POST',
        body: { body: reply, attachment_ids: attachments.map(a => a.id) },
      })
      setReply(''); setAttachments([])
      await load()
    } catch (e) { setErr(e.message) }
  }

  async function vote(optionIds) {
    try {
      const poll = await api(`/threads/${id}/poll/vote`, { method: 'POST', body: { option_ids: optionIds } })
      setT({ ...t, poll })
    } catch (e) { setErr(e.message) }
  }

  async function del() {
    if (!confirm('Delete this thread?')) return
    await api(`/threads/${id}`, { method: 'DELETE' })
    nav('/forum')
  }

  if (!t) return <div className="card">{err || 'Loading…'}</div>

  return (
    <>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <Link to="/forum" className="muted">← Back</Link>
            <h2 style={{ margin: '8px 0' }}>{t.title}</h2>
            <div className="meta muted">von {t.user.name} · {fmtDateTime(t.created_at)}</div>
          </div>
          {t.user.id === user.id && <button className="danger" onClick={del}>Delete</button>}
        </div>
        {t.body && <div className="body" style={{ whiteSpace: 'pre-wrap', marginTop: 12 }}>{t.body}</div>}
        <Attachments items={t.attachments} />
        {t.poll && <Poll poll={t.poll} onVote={vote} />}
      </div>

      <div className="card">
        <h3>Replies ({t.posts.length})</h3>
        {t.posts.map(p => (
          <div key={p.id} className="post">
            <div className="post-head">
              <strong>{p.user.name}</strong>
              <span>{fmtDateTime(p.created_at)}</span>
            </div>
            <div className="body">{p.body}</div>
            <Attachments items={p.attachments} />
          </div>
        ))}

        <form onSubmit={submitReply} style={{ marginTop: 16 }}>
          <label>Reply</label>
          <textarea value={reply} onChange={e => setReply(e.target.value)} rows={3} />
          <label>Attach files</label>
          <input type="file" multiple onChange={onFiles} />
          {attachments.length > 0 && (
            <div className="attachments">
              {attachments.map(a => <span key={a.id}>📎 {a.filename}</span>)}
            </div>
          )}
          {err && <div className="error">{err}</div>}
          <button type="submit" style={{ marginTop: 8 }}>Post reply</button>
        </form>
      </div>
    </>
  )
}
