import { useEffect, useMemo, useState } from 'react'
import { cinemaApi } from '../../api/CinemaApi'
import Header from '../../components/common/Header'
import Loader from '../../components/common/Loader'
import DateNavigation from '../../components/guest/DateNavigation'
import MovieCard from '../../components/guest/MovieCard'
import type { CinemaData } from '../../types/cinema'
import { addDays, startOfDay } from '../../utils/dates'
import '../../assets/styles/home.css'

const HomePage = () => {
  const [data, setData] = useState<CinemaData | null>(null)
  const [error, setError] = useState('')
  const [startDate, setStartDate] = useState(() => startOfDay(new Date()))
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()))

  useEffect(() => {
    const loadData = async () => {
      try {
        setError('')
        setData(await cinemaApi.getAllData())
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить расписание')
      }
    }

    void loadData()
  }, [])

  const schedule = useMemo(() => {
    if (!data) return null

    const halls = data.halls.filter((hall) => hall.hall_open === 1)
    const openHallIds = new Set(halls.map((hall) => hall.id))
    const seances = data.seances.filter((seance) => openHallIds.has(seance.seance_hallid))
    const filmIds = new Set(seances.map((seance) => seance.seance_filmid))
    const films = data.films.filter((film) => filmIds.has(film.id))

    return { halls, films, seances }
  }, [data])

  const showNextDates = () => {
    const nextStartDate = addDays(startDate, 1)
    setStartDate(nextStartDate)

    if (selectedDate < nextStartDate) {
      setSelectedDate(nextStartDate)
    }
  }

  return (
    <div className="page page--guest">
      <Header showLogin />
      <DateNavigation
        startDate={startDate}
        selectedDate={selectedDate}
        onSelect={setSelectedDate}
        onNext={showNextDates}
      />

      <main className="schedule">
        {!data && !error && <Loader text="Загружаем расписание…" />}
        {error && (
          <div className="status-message status-message--error" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => window.location.reload()}>
              Попробовать снова
            </button>
          </div>
        )}
        {schedule?.films.map((film) => (
          <MovieCard
            film={film}
            halls={schedule.halls}
            seances={schedule.seances}
            selectedDate={selectedDate}
            key={film.id}
          />
        ))}
        {schedule && schedule.films.length === 0 && (
          <div className="status-message">
            <p>На выбранную дату открытых сеансов пока нет.</p>
          </div>
        )}
      </main>
    </div>
  )
}

export default HomePage
