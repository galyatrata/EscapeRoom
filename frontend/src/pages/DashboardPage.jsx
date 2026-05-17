import { useEffect, useState } from 'react'
import api from '../api/axios'
import { useAuth } from '../contexts/AuthContext'
import { FiGrid, FiCalendar, FiTool, FiAward } from 'react-icons/fi'

const statusBadge = {
  pending:   <span className="badge badge-pending">Очікує</span>,
  confirmed: <span className="badge badge-ok">Підтверджено</span>,
  cancelled: <span className="badge badge-bad">Скасовано</span>,
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [stats, setStats] = useState({ rooms: 0, bookings: 0, maintenance: 0, records: 0 })
  const [recent, setRecent] = useState([])
  const [newIds, setNewIds] = useState(new Set())

  const fetchData = async () => {
    try {
      const [rooms, bookings, maintenance, analytics] = await Promise.allSettled([
        api.get('/rooms'),
        api.get('/admin/bookings'),
        api.get('/maintenance'),
        api.get('/analytics'),
      ])
      const bookingData = bookings.value?.data || []
      const analyticsData = analytics.value?.data || {}
      setStats({
        rooms:       analyticsData.rooms ?? rooms.value?.data?.length ?? 0,
        bookings:    analyticsData.bookings ?? bookingData.length,
        maintenance: analyticsData.maintenance ?? maintenance.value?.data?.length ?? 0,
        records:     analyticsData.records ?? 0,
      })
      setRecent(prev => {
        const prevIds = new Set(prev.map(b => b.booking_id))
        const fresh = bookingData.slice(0, 8)
        const added = fresh.filter(b => !prevIds.has(b.booking_id)).map(b => b.booking_id)
        if (added.length) {
          setNewIds(ids => { const s = new Set(ids); added.forEach(id => s.add(id)); return s })
          setTimeout(() => setNewIds(ids => { const s = new Set(ids); added.forEach(id => s.delete(id)); return s }), 1400)
        }
        return fresh
      })
    } catch {}
  }

  useEffect(() => { fetchData() }, [])

  const cards = [
    { label: 'Кімнат',    value: stats.rooms,       icon: FiGrid,     cls: 'si-rooms' },
    { label: 'Бронювань', value: stats.bookings,     icon: FiCalendar, cls: 'si-book' },
    { label: 'Заявки ТО', value: stats.maintenance,  icon: FiTool,     cls: 'si-maint' },
    { label: 'Рекорди',   value: stats.records,      icon: FiAward,    cls: 'si-rec' },
  ]

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Вітаємо, {user?.name}!</h1>
        <p className="page-subtitle">Зведена інформація системи</p>
      </div>

      <div className="grid-4">
        {cards.map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="card stat-card">
            <div className={`stat-icon ${cls}`}><Icon size={18} /></div>
            <div>
              <div className="stat-value">{value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-1)', marginBottom: '1rem' }}>
          Останні бронювання
        </h2>
        {recent.length === 0 ? (
          <p className="empty">Немає бронювань</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Кімната</th>
                  <th>Дата / Час</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(b => (
                  <tr key={b.booking_id} className={newIds.has(b.booking_id) ? 'row-new' : ''}>
                    <td className="td-id">#{b.booking_id}</td>
                    <td className="td-main">{b.room_name || `Кімната ${b.room_id}`}</td>
                    <td>{b.date} {b.time_slot}</td>
                    <td>{statusBadge[b.status] || <span className="badge badge-neutral">{b.status}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
