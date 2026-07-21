import {
  addDays,
  getDates,
  getWeekday,
  isSameDay,
  isWeekend,
} from '../../utils/dates'

type DateNavigationProps = {
  startDate: Date
  selectedDate: Date
  onSelect: (date: Date) => void
  onNext: () => void
}

const DateNavigation = ({
  startDate,
  selectedDate,
  onSelect,
  onNext,
}: DateNavigationProps) => {
  const dates = getDates(startDate, 6)
  const today = new Date()

  return (
    <nav className="page-nav" aria-label="Выбор даты">
      {dates.map((date) => {
        const active = isSameDay(date, selectedDate)
        const isToday = isSameDay(date, today)

        return (
          <button
            className={`page-nav__day${active ? ' page-nav__day--active' : ''}${
              isWeekend(date) ? ' page-nav__day--weekend' : ''
            }`}
            key={date.toISOString()}
            type="button"
            onClick={() => onSelect(date)}
          >
            {isToday && <span className="page-nav__today">Сегодня</span>}
            <span>{getWeekday(date)},</span>
            <strong>{date.getDate()}</strong>
          </button>
        )
      })}
      <button
        className="page-nav__next"
        type="button"
        aria-label={`Показать даты после ${addDays(startDate, 5).toLocaleDateString('ru-RU')}`}
        onClick={onNext}
      >
        ›
      </button>
    </nav>
  )
}

export default DateNavigation
