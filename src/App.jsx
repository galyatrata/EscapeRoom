import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Login from './pages/Login'
import Register from './pages/Register'
import Layout from './components/Layout/Layout'
import PrivateRoute from './components/Common/PrivateRoute'
import DashboardPage from './pages/DashboardPage'
import RoomsPage from './pages/RoomsPage'
import BookingsPage from './pages/BookingsPage'
import MaintenancePage from './pages/MaintenancePage'
import RecordsPage from './pages/RecordsPage'

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="bookings" element={<BookingsPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />
          <Route path="records" element={<RecordsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App