import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { FiPlus, FiTool } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

const EMPTY = { room_id: '', reported_by: '', description: '' }

const statusBadge = {
  new:          <span className="badge badge-blue">Нова</span>,
  'in-progress':<span className="badge badge-pending">В роботі</span>,
  done:         <span className="badge badge-ok">Виконано</span>,
}

export default function MaintenancePage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [rooms, setRooms] = useState([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [newIds, setNewIds] = useState(new Set())

  const fetchData = async () => {
    try {
      const { data } = await api.get('/maintenance')
      setItems(data)
    } catch { toast.error('Помилка завантаження') }
  }

  useEffect(() => {
    fetchData()
    api.get('/rooms').then(r => setRooms(r.data)).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/maintenance', form)
      const newItem = data?.maintenance || {
        maintenance_id: Date.now(),
        room_id: form.room_id,
        room_name: rooms.find(r => String(r.room_id) === String(form.room_id))?.name || `Кімната ${form.room_id}`,
        reported_by: form.reported_by,
        description: form.description,
        status: 'new',
        created_at: new Date().toISOString(),
      }
      setItems(prev => [newItem, ...prev])
      const id = newItem.maintenance_id
      setNewIds(s => new Set(s).add(id))
      setTimeout(() => setNewIds(s => { const n = new Set(s); n.delete(id); return n }), 1400)
      toast.success('Заявку подано')
      setModal(false)
      setForm(EMPTY)
    } catch { toast.error('Помилка подачі заявки') }
  }

  const handleUpdate = async (id, status) => {
    try {
      await api.patch(`/maintenance/${id}`, { status })
      setItems(prev => prev.map(i => i.maintenance_id === id ? { ...i, status } : i))
      toast.success('Статус оновлено')
    } catch { toast.error('Помилка оновлення') }
  }

  const f = field => e => setForm({ ...form, [field]: e.target.value })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Обслуговування</h1>
        <button onClick={() => setModal(true)} className="btn btn-primary">
          <FiPlus size={15} /> Нова заявка
        </button>
      </div>

      <div className="grid-2">
        {items.map(item => (
          <div
            key={item.maintenance_id}
            className="card"
            style={{
              outline: newIds.has(item.maintenance_id) ? '2px solid var(--accent-light)' : 'none',
              transition: 'outline 0.3s',
            }}
          >
            <div className="maint-header">
              <div className="maint-title">
                <FiTool size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
                {item.room_name || `Кімната ${item.room_id}`}
              </div>
              {statusBadge[item.status] || <span className="badge badge-neutral">{item.status}</span>}
            </div>
            <p className="maint-desc">{item.description}</p>
            <p className="maint-meta">
              {item.reported_by}
              {item.created_at && ` · ${new Date(item.created_at).toLocaleDateString('uk-UA')}`}
            </p>
            {user?.role !== 'client' && item.status !== 'done' && (
              <div className="maint-actions">
                {item.status === 'new' && (
                  <button
                    onClick={() => handleUpdate(item.maintenance_id, 'in-progress')}
                    className="btn btn-sm btn-outline"
                  >
                    Взяти в роботу
                  </button>
                )}
                {item.status === 'in-progress' && (
                  <button
                    onClick={() => handleUpdate(item.maintenance_id, 'done')}
                    className="btn btn-sm"
                    style={{ background: 'var(--s-ok-bg)', color: 'var(--s-ok-text)', border: 'none' }}
                  >
                    Завершити
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && <p className="empty" style={{ gridColumn: '1/-1' }}>Заявок немає</p>}
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Нова заявка на ТО</h2>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Кімната</label>
                <select value={form.room_id} onChange={f('room_id')} required>
                  <option value="">Оберіть кімнату</option>
                  {rooms.map(r => <option key={r.room_id} value={r.room_id}>{r.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Ваше ім'я</label>
                <input placeholder="Ім'я" value={form.reported_by} onChange={f('reported_by')} required />
              </div>
              <div className="form-group">
                <label>Опис проблеми</label>
                <textarea placeholder="Що сталося?" value={form.description} onChange={f('description')} required style={{ height: '88px', resize: 'vertical' }} />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setModal(false)} className="btn btn-outline">Скасувати</button>
                <button type="submit" className="btn btn-primary">Подати</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}