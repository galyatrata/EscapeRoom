import { Outlet } from 'react-router-dom'
import { useState } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Header onMenuClick={() => setSidebarOpen(o => !o)} />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}