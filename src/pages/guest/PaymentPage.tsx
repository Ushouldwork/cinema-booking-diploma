import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { cinemaApi } from '../../api/CinemaApi'
import '../../assets/styles/ticket.css'
import Header from '../../components/common/Header'
import { useBooking } from '../../contexts/BookingContext'

const PaymentPage = () => {
  const navigate = useNavigate()
  const { booking, setPurchasedTickets } = useBooking()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!booking) {
    return <Navigate to="/" replace />
  }

  const total = booking.seats.reduce((sum, seat) => sum + seat.price, 0)
  const seats = booking.seats.map((seat) => `${seat.row} ряд, ${seat.place} место`).join('; ')

  const buyTickets = async () => {
    try {
      setLoading(true)
      setError('')
      const result = await cinemaApi.buyTickets(
        booking.seance.id,
        booking.date,
        booking.seats.map((seat) => ({ row: seat.row, place: seat.place, coast: seat.price })),
      )
      if (!Array.isArray(result.tickets) || result.tickets.length === 0) {
        throw new Error('Сервер не вернул данные купленного билета')
      }

      // Передаём билеты двумя способами. Состояние маршрута доступно QR-странице
      // сразу, а контекст и sessionStorage сохраняют билет после обновления страницы.
      sessionStorage.setItem('cinema-purchased-tickets', JSON.stringify(result.tickets))
      setPurchasedTickets(result.tickets)
      navigate('/ticket', { replace: true, state: { tickets: result.tickets } })
    } catch (buyError) {
      setError(buyError instanceof Error ? buyError.message : 'Не удалось забронировать билеты')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page page--guest">
      <Header />
      <main className="ticket-card">
        <header className="ticket-card__header">
          <h1>Вы выбрали билеты:</h1>
        </header>
        <section className="ticket-card__body">
          <div className="ticket-card__details">
            <p>На фильм: <strong>{booking.film.film_name}</strong></p>
            <p>Места: <strong>{seats}</strong></p>
            <p>В зале: <strong>{booking.hall.hall_name}</strong></p>
            <p>Начало сеанса: <strong>{booking.seance.seance_time}</strong></p>
            <p>Стоимость: <strong>{total}</strong> рублей</p>
          </div>

          <button className="button ticket-card__button" type="button" disabled={loading} onClick={buyTickets}>
            {loading ? 'Бронируем…' : 'Получить код бронирования'}
          </button>
          {error && <p className="ticket-card__error" role="alert">{error}</p>}

          <div className="ticket-card__note">
            <p>После оплаты билет будет доступен в этом окне. Покажите QR-код нашему контроллёру у входа в зал.</p>
            <p>Приятного просмотра!</p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default PaymentPage
