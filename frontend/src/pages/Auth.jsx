import { useState } from 'react'
import { api } from '../api'
import { useAuth } from '../App.jsx'
import { useNavigate } from 'react-router-dom'

export default function Auth() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const { login } = useAuth()
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault()
    setErr('')
    try {
      const res = await api('/auth/login', { method: 'POST', body: { username, password } })
      login(res.access_token, res.user)
      nav('/')
    } catch (e) { setErr(e.message) }
  }

  return (
    <div className="auth-wrap">
      <div className="card">
        <h2 className="center">🏡 Holland</h2>
        <p className="center muted">Vacation home management</p>
        <form onSubmit={submit}>
          <label>Username</label>
          <input value={username} onChange={e => setUsername(e.target.value)} required autoFocus />
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          {err && <div className="error">{err}</div>}
          <button type="submit" style={{ width: '100%', marginTop: 16 }}>Login</button>
        </form>
        <p className="center muted" style={{ marginTop: 16, fontSize: '0.8rem' }}>
          Accounts are managed by the administrator.
        </p>
      </div>
    </div>
  )
}
