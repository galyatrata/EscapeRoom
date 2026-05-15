import { FiBell, FiMenu, FiLogOut } from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth()

  return (
    <header className="header">
      <button onClick={onMenuClick} className="btn-ghost">
        <FiMenu size={18} />
      </button>

      <div className="header-right">
        <button className="btn-ghost" title="Сповіщення">
          <FiBell size={16} />
        </button>

        <div className="user-chip">
          <div className="user-avatar">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="hide-mobile">
            <div className="user-name">{user?.name}</div>
            <div className="user-role">{user?.role}</div>
          </div>
        </div>

        <button onClick={logout} className="btn-ghost" title="Вихід">
          <FiLogOut size={16} />
          <span className="hide-mobile">Вихід</span>
        </button>
      </div>
    </header>
  )
}