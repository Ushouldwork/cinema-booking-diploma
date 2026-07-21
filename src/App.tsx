import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import AdminPage from './pages/admin/AdminPage'
import LoginPage from './pages/admin/LoginPage'
import HallPage from './pages/guest/HallPage'
import HomePage from './pages/guest/HomePage'
import PaymentPage from './pages/guest/PaymentPage'
import TicketPage from './pages/guest/TicketPage'
import { BookingProvider } from './contexts/BookingContext'

function App() {
  return (
    <HashRouter>
      <BookingProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/hall/:seanceId" element={<HallPage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/ticket" element={<TicketPage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BookingProvider>
    </HashRouter>
  )
}

export default App
