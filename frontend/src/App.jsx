import { useEffect, useState, createContext, useContext } from 'react'
import { Routes, Route, Link, NavLink, useNavigate, Navigate } from 'react-router-dom'
import { api, getToken, setToken } from './api'
import Home from './pages/Home.jsx'
import Calendar from './pages/Calendar.jsx'
import Forum from './pages/Forum.jsx'
import ThreadView from './pages/ThreadView.jsx'
import NewThread from './pages/NewThread.jsx'
import Todos from './pages/Todos.jsx'
import Auth from './pages/Auth.jsx'

export const AuthCtx = createContext(null)
export const useAuth = () => useContext(AuthCtx)

export default function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const nav = useNavigate()

  useEffect(() => {
    if (!getToken()) { setLoading(false); return }
    api('/auth/me')
      .then(setUser)
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  const login = (token, u) => { setToken(token); setUser(u) }
  const logout = () => { setToken(null); setUser(null); nav('/login') }

  if (loading) return <div className="center" style={{ marginTop: 80 }}>Loading…</div>
  if (!user) {
    return (
      <AuthCtx.Provider value={{ user, login, logout }}>
        <Routes>
          <Route path="/login" element={<Auth />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthCtx.Provider>
    )
  }

  return (
    <AuthCtx.Provider value={{ user, login, logout }}>
      <header className="topbar">
        <h1>🏡 Holland</h1>
        <nav>
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/calendar">Calendar</NavLink>
          <NavLink to="/forum">Forum</NavLink>
          <NavLink to="/todos">To-Do</NavLink>
        </nav>
        <span className="user">Hi, {user.name}</span>
        <button className="link" onClick={logout}>Logout</button>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/new" element={<NewThread />} />
          <Route path="/forum/:id" element={<ThreadView />} />
          <Route path="/todos" element={<Todos />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </AuthCtx.Provider>
  )
}
