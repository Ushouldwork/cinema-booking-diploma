import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { cinemaApi } from '../../api/CinemaApi'
import tapHint from '../../assets/images/tap-hint.png'
import '../../assets/styles/booking.css'
import Header from '../../components/common/Header'
import Loader from '../../components/common/Loader'
import HallScheme from '../../components/guest/HallScheme'
import { useBooking, type SelectedSeat } from '../../contexts/BookingContext'
import type { Film, Hall, Seance, SeatType } from '../../types/cinema'
import { toApiDate } from '../../utils/dates'

type HallData = {
  film: Film
  hall: Hall
  seance: Seance
  config: SeatType[][]
}

const HallPage = () => {
  const { seanceId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setBooking } = useBooking()
  const [data, setData] = useState<HallData | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([])
  const [error, setError] = useState('')
  const date = searchParams.get('date') || toApiDate(new Date())
  const numericSeanceId = Number(seanceId)

  useEffect(() => {
    const loadHall = async () => {
      if (!Number.isInteger(numericSeanceId)) {
        setError('Некорректный номер сеанса')
        return
      }

      try {
        const [cinemaData, config] = await Promise.all([
          cinemaApi.getAllData(),
          cinemaApi.getHallConfig(numericSeanceId, date),
        ])
        const seance = cinemaData.seances.find((item) => item.id === numericSeanceId)
        const hall = cinemaData.halls.find((item) => item.id === seance?.seance_hallid)
        const film = cinemaData.films.find((item) => item.id === seance?.seance_filmid)

        if (!seance || !hall || !film || hall.hall_open !== 1) {
          throw new Error('Этот сеанс сейчас недоступен')
        }

        setData({ film, hall, seance, config })
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить схему зала')
      }
    }

    void loadHall()
  }, [date, numericSeanceId])

  const toggleSeat = (row: number, place: number, type: SeatType) => {
    if (!data || (type !== 'standart' && type !== 'vip')) return

    setSelectedSeats((current) => {
      const exists = current.some((seat) => seat.row === row && seat.place === place)

      if (exists) {
        return current.filter((seat) => seat.row !== row || seat.place !== place)
      }

      return [
        ...current,
        {
          row,
          place,
          type,
          price: type === 'vip' ? data.hall.hall_price_vip : data.hall.hall_price_standart,
        },
      ]
    })
  }

  const continueBooking = () => {
    if (!data || selectedSeats.length === 0) return

    setBooking({
      date,
      film: data.film,
      hall: data.hall,
      seance: data.seance,
      seats: selectedSeats,
    })
    navigate('/payment')
  }

  return (
    <div className="page page--guest page--guest-hall">
      <Header />
      <main className="buying">
        {!data && !error && <Loader text="Загружаем схему зала…" />}
        {error && <div className="status-message status-message--error" role="alert">{error}</div>}
        {data && (
          <section className="buying__content">
            <div className="buying__info">
              <div>
                <h1>{data.film.film_name}</h1>
                <p>Начало сеанса: {data.seance.seance_time}</p>
                <strong>{data.hall.hall_name}</strong>
              </div>
              <div className="buying__hint">
                <img src={tapHint} alt="" />
                <span>Тапните<br />дважды,<br />чтобы<br />увеличить</span>
              </div>
            </div>

            <HallScheme
              config={data.config}
              hall={data.hall}
              selectedSeats={selectedSeats}
              onToggle={toggleSeat}
            />

            <div className="buying__action">
              <button
                className="button buying__button"
                type="button"
                disabled={selectedSeats.length === 0}
                onClick={continueBooking}
              >
                Забронировать
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default HallPage
