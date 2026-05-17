import { NavLink } from 'react-router-dom'
import { FiHome, FiGrid, FiCalendar, FiTool, FiAward, FiX } from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'

const allMenuItems = [
  { path: '/',            icon: FiHome,     label: 'Головна',          roles: ['all'] },
  { path: '/rooms',       icon: FiGrid,     label: 'Кімнати',          roles: ['all'] },
  { path: '/bookings',    icon: FiCalendar, label: 'Бронювання',       roles: ['all'] },
  { path: '/maintenance', icon: FiTool,     label: 'Обслуговування',   roles: ['admin','gamemaster','technician'] },
  { path: '/records',     icon: FiAward,    label: 'Рекорди',          roles: ['all'] },
]

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()
  const menuItems = allMenuItems.filter(i =>
    i.roles.includes('all') || i.roles.includes(user?.role)
  )

  return (
    <>
      {isOpen && <div className="sidebar-overlay show" onClick={onClose} />}
      <aside className={`sidebar${isOpen ? ' open' : ''}`}>
        <div className="sidebar-logo">
          <div className="logo-inner">
            <div className="logo-icon">🔐</div>
            <div>
              <div className="logo-title">EscapeRoom</div>
              <div className="logo-sub">Система управління</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ color: 'var(--side-text)', padding: '0.25rem', borderRadius: 'var(--r-sm)', transition: 'color 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--side-text)'}
          >
            <FiX size={16} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              onClick={onClose}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}