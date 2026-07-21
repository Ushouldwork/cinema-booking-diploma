import type { SelectedSeat } from '../../contexts/BookingContext'
import type { Hall, SeatType } from '../../types/cinema'
import screenImage from '../../assets/images/screen.png'

type HallSchemeProps = {
  config: SeatType[][]
  hall: Hall
  selectedSeats: SelectedSeat[]
  onToggle: (row: number, place: number, type: SeatType) => void
}

const HallScheme = ({ config, hall, selectedSeats, onToggle }: HallSchemeProps) => {
  const selected = new Set(selectedSeats.map((seat) => `${seat.row}-${seat.place}`))

  return (
    <div className="buying-scheme">
      <div className="buying-scheme__wrapper">
        <img className="buying-scheme__screen" src={screenImage} alt="Экран" />
        {config.map((row, rowIndex) => (
          <div className="buying-scheme__row" key={`row-${rowIndex + 1}`}>
            {row.map((type, placeIndex) => {
              const rowNumber = rowIndex + 1
              const placeNumber = placeIndex + 1
              const isSelected = selected.has(`${rowNumber}-${placeNumber}`)
              const selectable = type === 'standart' || type === 'vip'

              return (
                <button
                  className={`chair chair--${type}${isSelected ? ' chair--selected' : ''}`}
                  type="button"
                  aria-label={`Ряд ${rowNumber}, место ${placeNumber}`}
                  aria-pressed={isSelected}
                  disabled={!selectable}
                  onClick={() => onToggle(rowNumber, placeNumber, type)}
                  key={`${rowNumber}-${placeNumber}`}
                />
              )
            })}
          </div>
        ))}
      </div>

      <div className="buying-scheme__legend">
        <div>
          <p><span className="chair chair--standart" /> Свободно ({hall.hall_price_standart}руб)</p>
          <p><span className="chair chair--vip" /> Свободно VIP ({hall.hall_price_vip}руб)</p>
        </div>
        <div>
          <p><span className="chair chair--taken" /> Занято</p>
          <p><span className="chair chair--selected" /> Выбрано</p>
        </div>
      </div>
    </div>
  )
}

export default HallScheme
