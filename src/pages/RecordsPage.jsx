import { useEffect, useState } from 'react'
import api from '../api/axios'
import toast from 'react-hot-toast'
import { FiPlus } from 'react-icons/fi'

const EMPTY = {
  booking_id: '', room_id: '', team_name: '', members: '',
  completion_time_seconds: '', hints_used: 0, success: true
}

const rankClass = (i) => {
  if (i === 0) return 'rank-badge rank-1'
  if (i === 1) return 'rank-badge rank-2'
  if (i === 2) return 'rank-badge rank-3'
  return 'rank-badge rank-other'
}

const rankEmoji = (i) => ['🥇','🥈','🥉'][i] ?? (i + 1)

const formatTime = (sec) => {
  const m = Math.floor(sec / 60)
  const s = sec % 60
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
    setSelectedRoom(roomId)
    try {
      const { data } = await api.get(`/records/room/${roomId}`)
      setRecords(data)
    } catch { setRecords([]) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        members: form.members.split(',').map(s => s.trim()).filter(Boolean)
      }
      await api.post('/records', payload)
      toast.success('Результат збережено')
      setModal(false)
      if (selectedRoom) fetchRecords(selectedRoom)
    } catch { toast.error('Помилка збереження') }
  }

  const f = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Рекорди гравців</h1>
        <button onClick={() => setModal(true)} className="btn btn-primary">
          <FiPlus size={16} /> Новий результат
        </button>
      </div>

      <div className="tabs">
        {rooms.map(r => (
          <button
            key={r.room_id}
            onClick={() => fetchRecords(r.room_id)}
            className={`tab${selectedRoom === r.room_id ? ' active' : ''}`}
          >
            {r.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {records.map((rec, i) => (
          <div key={rec.record_id} className="card record-card">
            <div className={rankClass(i)}>{rankEmoji(i)}</div>
            <div className="record-info">
              <div className="record-team">{rec.team_name}</div>
              <div className="record-members">
                {Array.isArray(rec.members) ? rec.members.join(', ') : rec.members}
              </div>
            </div>
            <div className="record-time">
              <div className="record-time-value">{formatTime(rec.completion_time_seconds)}</div>
              <div className="record-hints">Підказок: {rec.hints_used}</div>
            </div>
            <div>
              {rec.success
                ? <span className="badge badge-green">✓ Пройдено</span>
                : <span className="badge badge-red">✗ Невдача</span>
              }
            </div>
          </div>
        ))}
        {records.length === 0 && (
          <p className="empty">Рекордів ще немає</p>
        )}
      </div>

      {modal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Новий результат</h2>
            <form onSubmit={handleSubmit} className="modal-form">
              <select value={form.room_id} onChange={f('room_id')} required>
                <option value="">Оберіть кімнату</option>
                {rooms.map(r => <option key={r.room_id} value={r.room_id}>{r.name}</option>)}
              </select>
              <input placeholder="ID бронювання" value={form.booking_id} onChange={f('booking_id')} />
              <input placeholder="Назва команди" value={form.team_name} onChange={f('team_name')} required />
              <input placeholder="Учасники (через кому)" value={form.members} onChange={f('members')} />
              <div className="form-row">
                <input type="number" placeholder="Час (сек)" value={form.completion_time_seconds} onChange={f('completion_time_seconds')} required />
                <input type="number" min={0} placeholder="Підказки" value={form.hints_used} onChange={f('hints_used')} />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.success}
                  onChange={e => setForm({ ...form, success: e.target.checked })}
                  style={{ width: 'auto', accentColor: 'var(--orange-500)' }}
                />
                Успішне проходження
              </label>
              <div className="form-actions">
                <button type="button" onClick={() => setModal(false)} className="btn btn-secondary">Скасувати</button>
                <button type="submit" className="btn btn-primary">Зберегти</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
