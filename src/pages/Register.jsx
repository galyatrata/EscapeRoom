import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await register(form.name, form.email, form.password, form.phone)
    setLoading(false)
    if (result.success) { toast.success('Реєстрацію завершено!'); navigate('/login') }
    else toast.error(result.error)
  }

  const fields = [
    { name: 'name',     label: "Ім'я",   placeholder: 'Олена Коваль',   type: 'text' },
    { name: 'email',    label: 'Email',  placeholder: 'email@example.com', type: 'email' },
    { name: 'phone',    label: 'Телефон',placeholder: '+380671234567',  type: 'tel' },
    { name: 'password', label: 'Пароль', placeholder: '••••••••',       type: 'password' },
  ]

  return (
    <div className="auth-page">
      <div className="auth-wrap">
        <div className="auth-logo">
          <div className="auth-logo-icon">🔐</div>
          <div className="auth-logo-title">EscapeRoom</div>
        </div>
        <div className="auth-card">
          <div className="auth-title">Реєстрація</div>
          <form onSubmit={handleSubmit} className="auth-form">
            {fields.map(f => (
              <div key={f.name} className="form-group">
                <label>{f.label}</label>
                <input type={f.type} name={f.name} value={form[f.name]} onChange={handleChange} placeholder={f.placeholder} required />
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn btn-primary auth-submit">
              {loading ? 'Реєстрація...' : 'Зареєструватись'}
            </button>
          </form>
          <p className="auth-footer">
            Вже є акаунт? <Link to="/login">Увійти</Link>
          </p>
        </div>
      </div>
    </div>
  )
}