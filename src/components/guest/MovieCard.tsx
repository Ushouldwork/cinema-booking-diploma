import { Link } from 'react-router-dom'
import type { Film, Hall, Seance } from '../../types/cinema'
import { isSeancePast, toApiDate } from '../../utils/dates'

type MovieCardProps = {
  film: Film
  halls: Hall[]
  seances: Seance[]
  selectedDate: Date
}

const MovieCard = ({ film, halls, seances, selectedDate }: MovieCardProps) => {
  const filmSeances = seances.filter((seance) => seance.seance_filmid === film.id)

  return (
    <article className="movie">
      <div className="movie__info">
        <div className="movie__poster-wrap">
          <img className="movie__poster" src={film.film_poster} alt={`Постер фильма «${film.film_name}»`} />
        </div>
        <div className="movie__description">
          <h2 className="movie__title">{film.film_name}</h2>
          <p className="movie__synopsis">{film.film_description}</p>
          <p className="movie__data">
            <span>{film.film_duration} минут</span>
            <span>{film.film_origin}</span>
          </p>
        </div>
      </div>

      <div className="movie-seances">
        {halls.map((hall) => {
          const hallSeances = filmSeances
            .filter((seance) => seance.seance_hallid === hall.id)
            .sort((first, second) => first.seance_time.localeCompare(second.seance_time))

          if (hallSeances.length === 0) return null

          return (
            <section className="movie-seances__hall" key={hall.id}>
              <h3>{hall.hall_name}</h3>
              <ul className="movie-seances__list">
                {hallSeances.map((seance) => {
                  const past = isSeancePast(selectedDate, seance.seance_time)
                  const url = `/hall/${seance.id}?date=${toApiDate(selectedDate)}`

                  return (
                    <li key={seance.id}>
                      {past ? (
                        <span className="movie-seances__time movie-seances__time--disabled">
                          {seance.seance_time}
                        </span>
                      ) : (
                        <Link className="movie-seances__time" to={url}>
                          {seance.seance_time}
                        </Link>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )
        })}
      </div>
    </article>
  )
}

export default MovieCard
