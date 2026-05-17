import { useEffect, useState, useRef } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { FiPlus, FiSearch, FiTrash2, FiCheck } from 'react-icons/fi'
import { useAuth } from '../contexts/AuthContext'

const EMPTY = { room_id: '', date: '', time_slot: '18:00', participants: 1 }
const TIME_SLOTS = ['10:00','12:00','14:00','16:00','18:00','20:00']

const statusBadge = {
  pending:   <span className="badge badge-pending">Очікує</span>,
  confirmed: <span className="badge badge-ok">Підтверджено</span>,
  cancelled: <span className="badge badge-bad">Скасовано</span>,
}

export default function BookingsPage() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [rooms, setRooms] = useState([])
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [newIds, setNewIds] = useState(new Set())
  const tableRef = useRef(null)

  const fetchBookings = async () => {
    try {
      const endpoint = user?.role === 'admin' ? '/admin/bookings' : `/bookings/user/${user?.id}`
      const { data } = await api.get(endpoint)
      setBookings(data)
    } catch { toast.error('Помилка завантаження') }
  }

  useEffect(() => {
    fetchBookings()
    api.get('/rooms').then(r => setRooms(r.data)).catch(() => {})
  }, [])

  const markNew = (id) => {
    setNewIds(s => new Set(s).add(id))
    setTimeout(() => setNewIds(s => { const n = new Set(s); n.delete(id); return n }), 1400)
    // scroll to top of table
    setTimeout(() => tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 50)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      const { data } = await api.post('/bookings', { ...form, user_id: user?.id })
      const newBooking = data?.booking || (data?.booking_id ? data : null) || {
        booking_id: Date.now(),
        room_id: form.room_id,
        room_name: rooms.find(r => String(r.room_id) === String(form.room_id))?.name || `Кімната ${form.room_id}`,
        date: form.date,
        time_slot: form.time_slot,
        participants: form.participants,
        total_price: null,
        status: 'pending',
      }
      setBookings(prev => [newBooking, ...prev])
      markNew(newBooking.booking_id)
      toast.success('Бронювання створено!')
      setModal(false)
      setForm(EMPTY)
    } catch (error) { toast.error(error.response?.data?.error || 'Помилка створення бронювання') }
  }

  const handleCancel = async (id) => {
    if (!confirm('Скасувати бронювання?')) return
    try {
      await api.delete(`/bookings/${id}`)
      setBookings(prev => prev.map(b => b.booking_id === id ? { ...b, status: 'cancelled' } : b))
      toast.success('Бронювання скасовано')
    } catch { toast.error('Помилка скасування') }
  }

  const handleStatusChange = async (id, status) => {
    try {
      await api.patch(`/admin/bookings/${id}`, { status })
      setBookings(prev => prev.map(b => b.booking_id === id ? { ...b, status } : b))
      toast.success('Статус оновлено')
    } catch { toast.error('Помилка оновлення') }
  }

  const filtered = bookings.filter(b =>
    String(b.booking_id).includes(search) ||
    String(b.room_id).includes(search) ||
    (b.room_name || '').toLowerCase().includes(search.toLowerCase())
  )

  const f = field => e => setForm({ ...form, [field]: e.target.value })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Бронювання</h1>
        <button onClick={() => setModal(true)} className="btn btn-primary">
          <FiPlus size={15} /> Нове
        </button>
      </div>

      <div className="card" style={{ marginBottom: '0.875rem' }}>
        <div className="search-wrap">
          <FiSearch className="search-icon" size={14} />
          <input className="search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Пошук..." />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap" ref={tableRef}>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Кімната</th>
                <th>Дата / Час</th>
                <th>Учасники</th>
                <th>Сума</th>
                <th>Статус</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(b => (
                <tr key={b.booking_id} className={newIds.has(b.booking_id) ? 'row-new' : ''}>
                  <td className="td-id">#{b.booking_id}</td>
                  <td className="td-main">{b.room_name || `Кімната ${b.room_id}`}</td>
                  <td>{b.date} <span style={{ color: 'var(--text-3)' }}>{b.time_slot}</span></td>
                  <td>{b.participants}</td>
                  <td>{b.total_price ? `₴ ${b.total_price}` : '—'}</td>
                  <td>
                    {statusBadge[b.status] || <span className="badge badge-neutral">{b.status}</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                      {user?.role === 'admin' && b.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(b.booking_id, 'confirmed')}
                          className="btn btn-sm"
                          style={{ background: 'var(--s-ok-bg)', color: 'var(--s-ok-text)', border: 'none' }}
                          title="Підтвердити"
                        >
                          <FiCheck size={12} />
                        </button>
                      )}
                      {b.status !== 'cancelled' && (
                        <button onClick={() => handleCancel(b.booking_id)} className="btn-danger-ghost" title="Скасувати">
                          <FiTrash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="empty">Бронювань не знайдено</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Нове бронювання</h2>
            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-group">
                <label>Кімната</label>
                <select value={form.room_id} onChange={f('room_id')} required>
                  <option value="">Оберіть кімнату</option>
                  {rooms.map(r => <option key={r.room_id} value={r.room_id}>{r.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Дата</label>
                <input type="date" value={form.date} onChange={f('date')} required />
              </div>
              <div className="form-group">
                <label>Час</label>
                <select value={form.time_slot} onChange={f('time_slot')}>
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Кількість учасників</label>
                <input type="number" min={1} max={10} value={form.participants} onChange={f('participants')} required />
              </div>
              <div className="form-actions">
                <button type="button" onClick={() => setModal(false)} className="btn btn-outline">Скасувати</button>
                <button type="submit" className="btn btn-primary">Забронювати</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
