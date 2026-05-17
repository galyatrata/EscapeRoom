import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { FiPlus } from 'react-icons/fi'

const EMPTY = {
  booking_id: '',
  room_id: '',
  team_name: '',
  members: '',
  completion_time_seconds: '',
  hints_used: 0,
  success: true
}

const rankClass = (i) => {
  if (i === 0) return 'rank-badge rank-1'
  if (i === 1) return 'rank-badge rank-2'
  if (i === 2) return 'rank-badge rank-3'
  return 'rank-badge rank-other'
}

const formatTime = (sec) => {
  const m = Math.floor(Number(sec) / 60)
  const s = Number(sec) % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function RecordsPage() {
  const [rooms, setRooms] = useState([])
  const [records, setRecords] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    api.get('/rooms').then(r => {
      setRooms(r.data)
      if (r.data.length > 0) fetchRecords(r.data[0].room_id)
    }).catch(() => {})
  }, [])

  const fetchRecords = async (roomId) => {
    setSelectedRoom(Number(roomId))
    try {
      const { data } = await api.get(`/records/room/${roomId}`)
      setRecords(data)
    } catch {
      setRecords([])
    }
  }

  const openModal = () => {
    setForm({ ...EMPTY, room_id: selectedRoom || '' })
    setModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      room_id: Number(form.room_id),
      booking_id: form.booking_id ? Number(form.booking_id) : null,
      completion_time_seconds: Number(form.completion_time_seconds),
      hints_used: Number(form.hints_used) || 0,
      members: form.members.split(',').map(s => s.trim()).filter(Boolean)
    }

    try {
      await api.post('/records', payload)
      toast.success('Результат збережено')
      setModal(false)
      setForm(EMPTY)
      fetchRecords(payload.room_id)
    } catch (error) {
      toast.error(error.response?.data?.error || 'Помилка збереження')
    }
  }

  const f = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Рекорди гравців</h1>
        <button onClick={openModal} className="btn btn-primary">
          <FiPlus size={16} /> Новий результат
        </button>
      </div>

      <div className="tabs">
        {rooms.map(r => (
          <button
            key={r.room_id}
            onClick={() => fetchRecords(r.room_id)}
            className={`tab${selectedRoom === Number(r.room_id) ? ' active' : ''}`}
          >
            {r.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {records.map((rec, i) => (
          <div key={rec.record_id} className="card record-card">
            <div className={rankClass(i)}>{i + 1}</div>
            <div className="record-info">
              <div className="record-team">{rec.team_name}</div>
              <div className="record-members">{Array.isArray(rec.members) ? rec.members.join(', ') : rec.members}</div>
            </div>
            <div className="record-time">
              <div className="record-time-value">{formatTime(rec.completion_time_seconds)}</div>
              <div className="record-hints">Підказок: {rec.hints_used}</div>
            </div>
            <div>{rec.success ? <span className="badge badge-green">Пройдено</span> : <span className="badge badge-red">Невдача</span>}</div>
          </div>
        ))}
        {records.length === 0 && <p className="empty">Рекордів ще немає</p>}
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Новий результат</h2>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label>Кімната</label>
                <select value={form.room_id} onChange={f('room_id')} required>
                  <option value="">Оберіть кімнату</option>
                  {rooms.map(r => <option key={r.room_id} value={r.room_id}>{r.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>ID бронювання</label>
                <input placeholder="Необовʼязково" value={form.booking_id} onChange={f('booking_id')} />
              </div>
              <div className="form-group">
                <label>Назва команди</label>
                <input placeholder="Наприклад: Dream Team" value={form.team_name} onChange={f('team_name')} required />
              </div>
              <div className="form-group">
                <label>Учасники</label>
                <input placeholder="Імена через кому" value={form.members} onChange={f('members')} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Час проходження, сек</label>
                  <input type="number" min={1} placeholder="2340" value={form.completion_time_seconds} onChange={f('completion_time_seconds')} required />
                </div>
                <div className="form-group">
                  <label>Кількість підказок</label>
                  <input type="number" min={0} placeholder="0" value={form.hints_used} onChange={f('hints_used')} />
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input type="checkbox" checked={form.success} onChange={e => setForm({ ...form, success: e.target.checked })} style={{ width: 'auto', accentColor: 'var(--orange-500)' }} />
                Успішне проходження
              </label>
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
