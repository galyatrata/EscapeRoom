import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.success) { toast.success('Успішний вхід!'); navigate('/') }
    else toast.error(result.error)
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
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@escaperoom.ua" required />
            </div>
            <div className="form-group">
              <label>Пароль</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading} className="btn btn-primary auth-submit">
              {loading ? 'Вхід...' : 'Увійти'}
            </button>
          </form>
          <p className="auth-footer">
            Немає акаунту? <Link to="/register">Реєстрація</Link>
          </p>
          <div className="auth-hint">admin@escaperoom.ua / admin123</div>
        </div>
      </div>
    </div>
  )
}