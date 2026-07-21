import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { Navigate } from 'react-router-dom'
import '../../assets/styles/ticket.css'
import Header from '../../components/common/Header'
import Loader from '../../components/common/Loader'
import { useBooking } from '../../contexts/BookingContext'

const TicketPage = () => {
  const { purchasedTickets } = useBooking()
  const [qrCode, setQrCode] = useState('')
  const [error, setError] = useState('')

  const qrText = useMemo(() => {
    if (purchasedTickets.length === 0) return ''

    const first = purchasedTickets[0]
    const tickets = purchasedTickets
      .map(
        (ticket) =>
          `Билет №${ticket.id}: ряд ${ticket.ticket_row}, место ${ticket.ticket_place}, стоимость ${ticket.ticket_price} руб.`,
      )
      .join('\n')

    return [
      `Дата: ${first.ticket_date}`,
      `Время: ${first.ticket_time}`,
      `Фильм: ${first.ticket_filmname}`,
      `Зал: ${first.ticket_hallname}`,
      tickets,
      'Билет действителен строго на свой сеанс',
    ].join('\n')
  }, [purchasedTickets])

  useEffect(() => {
    if (!qrText) return

    QRCode.toDataURL(qrText, { width: 220, margin: 2, errorCorrectionLevel: 'H' })
      .then(setQrCode)
      .catch(() => setError('Не удалось сформировать QR-код'))
  }, [qrText])

  if (purchasedTickets.length === 0) {
    return <Navigate to="/payment" replace />
  }

  const first = purchasedTickets[0]
  const seats = purchasedTickets
    .map((ticket) => `${ticket.ticket_row} ряд, ${ticket.ticket_place} место`)
    .join('; ')

  return (
    <div className="page page--guest">
      <Header />
      <main className="ticket-card ticket-card--qr">
        <header className="ticket-card__header">
          <h1>Электронный билет</h1>
        </header>
        <section className="ticket-card__body">
          <div className="ticket-card__details">
            <p>На фильм: <strong>{first.ticket_filmname}</strong></p>
            <p>Места: <strong>{seats}</strong></p>
            <p>В зале: <strong>{first.ticket_hallname}</strong></p>
            <p>Начало сеанса: <strong>{first.ticket_time}</strong></p>
          </div>

          <div className="ticket-card__qr">
            {!qrCode && !error && <Loader text="Создаём QR-код…" />}
            {qrCode && <img src={qrCode} alt="QR-код электронного билета" />}
            {error && <p role="alert">{error}</p>}
          </div>

          <div className="ticket-card__note">
            <p>Покажите QR-код нашему контроллёру для подтверждения бронирования.</p>
            <p>Приятного просмотра!</p>
          </div>
        </section>
      </main>
    </div>
  )
}

export default TicketPage
