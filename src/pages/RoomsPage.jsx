import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { FiPlus, FiEdit2, FiSearch } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

const EMPTY = { name: '', description: '', capacity: '', duration_minutes: '', difficulty: 'medium', price_per_person: '' }

const diffBadge = {
  easy:   <span className="badge badge-ok">Легкий</span>,
  medium: <span className="badge badge-pending">Середній</span>,
  hard:   <span className="badge badge-bad">Важкий</span>,
}

export default function RoomsPage() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [newIds, setNewIds] = useState(new Set())

  const fetchRooms = async () => {
    try {
      const { data } = await api.get('/rooms')
      setRooms(data)
    } catch { toast.error('Помилка завантаження кімнат') }
  }

  useEffect(() => { fetchRooms() }, [])

  const filtered = rooms.filter(r => r.name?.toLowerCase().includes(search.toLowerCase()))

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal(true) }
  const openEdit = r => { setForm({ ...r }); setEditId(r.room_id); setModal(true) }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editId) {
        await api.patch(`/rooms/${editId}`, form)
        toast.success('Кімнату оновлено')
        setRooms(prev => prev.map(r => r.room_id === editId ? { ...r, ...form } : r))
      } else {
        const { data } = await api.post('/rooms', form)
        const newRoom = data?.room || { ...form, room_id: Date.now() }
        setRooms(prev => [newRoom, ...prev])
        const id = newRoom.room_id
        setNewIds(s => new Set(s).add(id))
        setTimeout(() => setNewIds(s => { const n = new Set(s); n.delete(id); return n }), 1400)
        toast.success('Кімнату додано')
      }
      setModal(false)
    } catch { toast.error('Помилка збереження') }
  }

  const f = field => e => setForm({ ...form, [field]: e.target.value })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Кімнати</h1>
        {user?.role === 'admin' && (
          <button onClick={openAdd} className="btn btn-primary">
            <FiPlus size={15} /> Додати
          </button>
        )}
      </div>

      <div className="card" style={{ marginBottom: '0.875rem' }}>
        <div className="search-wrap">
          <FiSearch className="search-icon" size={14} />
          <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук кімнат..." />
        </div>
      </div>

      <div className="grid-3">
        {filtered.map(room => (
          <div
            key={room.room_id}
            className="card room-card"
            style={{ outline: newIds.has(room.room_id) ? '2px solid var(--accent-light)' : 'none', transition: 'outline 0.3s' }}
          >
            <div className="room-card-header">
              <span className="room-name">{room.name}</span>
              {user?.role === 'admin' && (
                <button onClick={() => openEdit(room)} className="btn-danger-ghost">
                  <FiEdit2 size={14} />
                </button>
              )}
            </div>
            <p className="room-desc">{room.description}</p>
            <div className="room-tags">
              <span className="badge badge-blue">👥 {room.capacity} осіб</span>
              <span className="badge badge-neutral">⏱ {room.duration_minutes} хв</span>
              {diffBadge[room.difficulty] || <span className="badge badge-neutral">{room.difficulty}</span>}
              <span className="badge badge-accent">₴ {room.price_per_person}/особа</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="empty" style={{ gridColumn: '1/-1' }}>Кімнат не знайдено</p>}
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>{editId ? 'Редагувати кімнату' : 'Нова кімната'}</h2>
            <form onSubmit={handleSubmit} className="modal-form">
              <input placeholder="Назва" value={form.name} onChange={f('name')} required />
              <textarea placeholder="Опис" value={form.description} onChange={f('description')} style={{ height: '72px', resize: 'vertical' }} />
              <div className="form-row">
                <input type="number" placeholder="Місткість" value={form.capacity} onChange={f('capacity')} />
                <input type="number" placeholder="Тривалість (хв)" value={form.duration_minutes} onChange={f('duration_minutes')} />
              </div>
              <select value={form.difficulty} onChange={f('difficulty')}>
                <option value="easy">Легкий</option>
                <option value="medium">Середній</option>
                <option value="hard">Важкий</option>
              </select>
              <input type="number" placeholder="Ціна/особа (₴)" value={form.price_per_person} onChange={f('price_per_person')} />
              <div className="form-actions">
                <button type="button" onClick={() => setModal(false)} className="btn btn-outline">Скасувати</button>
                <button type="submit" className="btn btn-primary">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}