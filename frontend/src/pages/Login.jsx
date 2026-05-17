import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const DEMO_USERS = [
  { label: 'Адмін', email: 'admin@escaperoom.ua', password: 'AdminPass2026!' },
  { label: 'Клієнт', email: 'olena.koval@example.com', password: 'ClientPass2026!' },
  { label: 'Гейм-майстер', email: 'ihor.melnyk@example.com', password: 'GameMaster2026!' },
  { label: 'Технік', email: 'tetiana.boiko@example.com', password: 'TechPass2026!' }
]

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const submitLogin = async (loginEmail = email, loginPassword = password) => {
    setLoading(true)
    const result = await login(loginEmail, loginPassword)
    setLoading(false)

    if (result.success) {
      toast.success('Успішний вхід!')
      navigate('/')
      return
    }

    toast.error(result.error)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    submitLogin()
  }

  const fillDemo = (demoUser) => {
    setEmail(demoUser.email)
    setPassword(demoUser.password)
  }

  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <div className="auth-logo">
          <div className="auth-logo-icon">🔐</div>
          <div className="auth-logo-title">EscapeRoom</div>
          <div className="auth-logo-sub">Система управління</div>
        </div>
        <div className="auth-card">
          <div className="auth-title">Вхід</div>
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@escaperoom.ua"
                autoComplete="username"
                required
              />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="AdminPass2026!"
                autoComplete="current-password"
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary auth-submit">
              {loading ? 'Вхід...' : 'Увійти'}
            </button>
          </form>

          <div className="demo-login">
            {DEMO_USERS.map(user => (
              <button key={user.email} type="button" className="btn btn-outline btn-sm" onClick={() => fillDemo(user)}>
                {user.label}
              </button>
            ))}
          </div>

          <p className="auth-footer">
            Немає акаунту? <Link to="/register">Реєстрація</Link>
          </p>
          <div className="auth-hint">Адмін: admin@escaperoom.ua / AdminPass2026!</div>
        </div>
      </div>
    </div>
  )
}
