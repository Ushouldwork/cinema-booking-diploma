import { type DragEvent, type FormEvent, type TouchEvent, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cinemaApi } from '../../api/CinemaApi'
import '../../assets/styles/admin.css'
import AdminModal from '../../components/admin/AdminModal'
import AdminSection from '../../components/admin/AdminSection'
import Header from '../../components/common/Header'
import Loader from '../../components/common/Loader'
import type { CinemaData, Film, Hall, SeatType } from '../../types/cinema'

const emptyData: CinemaData = { halls: [], films: [], seances: [] }
const seatOrder: SeatType[] = ['standart', 'vip', 'disabled']

const resizeConfig = (hall: Hall, rows: number, places: number): SeatType[][] =>
  Array.from({ length: rows }, (_, row) =>
    Array.from({ length: places }, (_, place) => {
      const current = hall.hall_config[row]?.[place]
      return current === 'taken' ? 'standart' : current ?? 'standart'
    }),
  )

const AdminPage = () => {
  const navigate = useNavigate()
  const [data, setData] = useState<CinemaData>(emptyData)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [selectedHallId, setSelectedHallId] = useState<number | null>(null)
  const [rows, setRows] = useState(1)
  const [places, setPlaces] = useState(1)
  const [config, setConfig] = useState<SeatType[][]>([['standart']])
  const [priceStandart, setPriceStandart] = useState('0')
  const [priceVip, setPriceVip] = useState('0')
  const [newHallName, setNewHallName] = useState('')
  const [posterName, setPosterName] = useState('')
  const [modal, setModal] = useState<'hall' | 'film' | 'seance' | null>(null)
  const [pendingSeance, setPendingSeance] = useState({ hallId: 0, filmId: 0, time: '00:00' })
  const [touchFilmId, setTouchFilmId] = useState<number | null>(null)
  const [draggedSeanceId, setDraggedSeanceId] = useState<number | null>(null)
  const [isTrashActive, setIsTrashActive] = useState(false)

  const selectedHall = useMemo(
    () => data.halls.find((hall) => hall.id === selectedHallId) ?? null,
    [data.halls, selectedHallId],
  )

  const loadData = async () => {
    try {
      setLoading(true)
      setError('')
      const result = await cinemaApi.getAllData()
      setData(result)
      setSelectedHallId((current) => current && result.halls.some((hall) => hall.id === current) ? current : result.halls[0]?.id ?? null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Не удалось загрузить данные')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (sessionStorage.getItem('cinema-admin') !== 'true') {
      navigate('/admin/login', { replace: true })
      return
    }
    // Initial API synchronization after the protected page is mounted.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData()
  }, [navigate])

  useEffect(() => {
    if (!selectedHall) return
    // Keep the editable form synchronized when the administrator changes a hall.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRows(selectedHall.hall_rows)
    setPlaces(selectedHall.hall_places)
    setConfig(resizeConfig(selectedHall, selectedHall.hall_rows, selectedHall.hall_places))
    setPriceStandart(String(selectedHall.hall_price_standart))
    setPriceVip(String(selectedHall.hall_price_vip))
  }, [selectedHall])

  const runAction = async (action: () => Promise<unknown>) => {
    try {
      setBusy(true)
      setError('')
      await action()
      await loadData()
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : 'Не удалось сохранить изменения')
    } finally {
      setBusy(false)
    }
  }

  const changeSize = (nextRows: number, nextPlaces: number) => {
    if (!selectedHall) return
    const safeRows = Math.min(20, Math.max(1, nextRows || 1))
    const safePlaces = Math.min(20, Math.max(1, nextPlaces || 1))
    setRows(safeRows)
    setPlaces(safePlaces)
    setConfig(resizeConfig({ ...selectedHall, hall_config: config }, safeRows, safePlaces))
  }

  const cycleSeat = (row: number, place: number) => {
    setConfig((current) => current.map((currentRow, rowIndex) => currentRow.map((seat, placeIndex) => {
      if (rowIndex !== row || placeIndex !== place) return seat
      const normalized = seat === 'taken' ? 'standart' : seat
      return seatOrder[(seatOrder.indexOf(normalized) + 1) % seatOrder.length]
    })))
  }

  const addHall = (event: FormEvent) => {
    event.preventDefault()
    if (!newHallName.trim()) return
    void runAction(async () => {
      await cinemaApi.addHall(newHallName.trim())
      setNewHallName('')
      setModal(null)
    })
  }

  const addFilm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const poster = form.get('poster')
    if (!(poster instanceof File) || !poster.size) return
    void runAction(async () => {
      await cinemaApi.addFilm({
        name: String(form.get('name')),
        duration: Number(form.get('duration')),
        description: String(form.get('description')),
        origin: String(form.get('origin')),
        poster,
      })
      setModal(null)
    })
  }

  const addSeance = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const hallId = Number(form.get('hallId'))
    const filmId = Number(form.get('filmId'))
    const time = String(form.get('time'))

    if (!hallId || !filmId || !time) return
    void runAction(async () => {
      await cinemaApi.addSeance(hallId, filmId, time)
      setModal(null)
    })
  }

  const startFilmDrag = (event: DragEvent, film: Film) => {
    event.dataTransfer.setData('filmId', String(film.id))
    event.dataTransfer.effectAllowed = 'copy'
  }

  const openSeanceModal = (hallId: number, filmId: number, clientX: number, timeline: HTMLElement) => {
    const rect = timeline.getBoundingClientRect()
    const minutes = Math.round(Math.max(0, Math.min(1435, ((clientX - rect.left) / rect.width) * 1440)) / 5) * 5
    const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
    setPendingSeance({ hallId, filmId, time })
    setTouchFilmId(null)
    setModal('seance')
  }

  const addSeanceByDrop = (event: DragEvent<HTMLDivElement>, hallId: number) => {
    event.preventDefault()
    const filmId = Number(event.dataTransfer.getData('filmId'))
    if (!filmId) return
    openSeanceModal(hallId, filmId, event.clientX, event.currentTarget)
  }

  const addSeanceByTouch = (event: TouchEvent<HTMLElement>, filmId: number) => {
    const touch = event.changedTouches[0]
    if (!touch) return
    const timeline = document.elementFromPoint(touch.clientX, touch.clientY)?.closest<HTMLElement>('.timeline[data-hall-id]')
    if (!timeline) return
    const hallId = Number(timeline.dataset.hallId)
    if (!hallId) return
    event.preventDefault()
    openSeanceModal(hallId, filmId, touch.clientX, timeline)
  }

  const addSelectedFilmByTouch = (event: TouchEvent<HTMLDivElement>, hallId: number) => {
    if (!touchFilmId) return
    const touch = event.changedTouches[0]
    if (!touch) return
    event.preventDefault()
    openSeanceModal(hallId, touchFilmId, touch.clientX, event.currentTarget)
  }

  const deleteSeanceByDrop = (event: DragEvent) => {
    event.preventDefault()
    const seanceId = Number(event.dataTransfer.getData('seanceId')) || draggedSeanceId
    setDraggedSeanceId(null)
    setIsTrashActive(false)
    if (seanceId) void runAction(() => cinemaApi.deleteSeance(seanceId))
  }

  if (loading && !data.halls.length) {
    return <div className="page page--admin"><Header admin /><Loader text="Загружаем администраторскую…" /></div>
  }

  return (
    <div className="page page--admin">
      <Header admin />
      <main className="admin-panel">
        {error && <p className="admin-alert" role="alert">{error}</p>}

        <AdminSection title="Управление залами">
          <p>Доступные залы:</p>
          <ul className="hall-list">
            {data.halls.map((hall) => (
              <li key={hall.id}>— {hall.hall_name}
                <button className="icon-button" type="button" aria-label={`Удалить ${hall.hall_name}`} disabled={busy} onClick={() => void runAction(() => cinemaApi.deleteHall(hall.id))}>×</button>
              </li>
            ))}
          </ul>
          <button className="button admin-button" type="button" onClick={() => setModal('hall')}>Создать зал</button>
        </AdminSection>

        <AdminSection title="Конфигурация залов">
          <p>Выберите зал для конфигурации:</p>
          <div className="hall-tabs">{data.halls.map((hall) => <button className={hall.id === selectedHallId ? 'is-active' : ''} key={hall.id} type="button" onClick={() => setSelectedHallId(hall.id)}>{hall.hall_name}</button>)}</div>
          {selectedHall && <>
            <p>Укажите количество рядов и максимальное количество кресел в ряду:</p>
            <div className="size-fields">
              <label>Рядов, шт<input type="number" min="1" max="20" value={rows} onFocus={(event) => event.currentTarget.select()} onChange={(event) => changeSize(Number(event.target.value), places)} /></label>
              <span>×</span>
              <label>Мест, шт<input type="number" min="1" max="20" value={places} onFocus={(event) => event.currentTarget.select()} onChange={(event) => changeSize(rows, Number(event.target.value))} /></label>
            </div>
            <p>Нажимайте на кресла, чтобы менять их тип:</p>
            <div className="admin-seat-legend"><span><i className="admin-seat standart" /> обычные</span><span><i className="admin-seat vip" /> VIP</span><span><i className="admin-seat disabled" /> заблокированные</span></div>
            <div className="admin-hall"><strong>Экран</strong>{config.map((row, rowIndex) => <div className="admin-hall__row" key={rowIndex}>{row.map((seat, placeIndex) => <button className={`admin-seat ${seat}`} type="button" key={`${rowIndex}-${placeIndex}`} aria-label={`Ряд ${rowIndex + 1}, место ${placeIndex + 1}`} onClick={() => cycleSeat(rowIndex, placeIndex)} />)}</div>)}</div>
            <div className="admin-actions"><button className="button admin-button" type="button" disabled={busy} onClick={() => void runAction(() => cinemaApi.updateHallConfig(selectedHall.id, config))}>Сохранить</button></div>
          </>}
        </AdminSection>

        <AdminSection title="Конфигурация цен">
          <p>Выберите зал для конфигурации:</p>
          <div className="hall-tabs">{data.halls.map((hall) => <button className={hall.id === selectedHallId ? 'is-active' : ''} key={hall.id} type="button" onClick={() => setSelectedHallId(hall.id)}>{hall.hall_name}</button>)}</div>
          {selectedHall && <>
            <p>Установите цены для типов кресел:</p>
            <div className="price-fields"><label>Цена, рублей<input type="number" min="0" value={priceStandart} onFocus={(event) => event.currentTarget.select()} onChange={(event) => setPriceStandart(event.target.value)} /> обычные кресла</label><label>Цена, рублей<input type="number" min="0" value={priceVip} onFocus={(event) => event.currentTarget.select()} onChange={(event) => setPriceVip(event.target.value)} /> VIP кресла</label></div>
            <div className="admin-actions"><button className="button admin-button" type="button" disabled={busy || priceStandart === '' || priceVip === ''} onClick={() => void runAction(() => cinemaApi.updateHallPrices(selectedHall.id, Number(priceStandart), Number(priceVip)))}>Сохранить</button></div>
          </>}
        </AdminSection>

        <AdminSection title="Сетка сеансов">
          <button className="button admin-button" type="button" onClick={() => {
            setPosterName('')
            setModal('film')
          }}>Добавить фильм</button>
          <p className="drag-help">Перетащите фильм на шкалу нужного зала. Положение определяет время начала.</p>
          <p className="touch-drag-help">На телефоне коснитесь фильма, затем шкалы нужного зала.</p>
          <div className="film-library">{data.films.map((film, index) => (
            <article
              className={`film-chip film-chip--${index % 5}${touchFilmId === film.id ? ' is-touch-selected' : ''}`}
              draggable
              onDragStart={(event) => startFilmDrag(event, film)}
              onTouchStart={() => setTouchFilmId(film.id)}
              onTouchEnd={(event) => addSeanceByTouch(event, film.id)}
              key={film.id}
            >
              <img src={film.film_poster} alt="" />
              <span><strong>{film.film_name}</strong><small>{film.film_duration} минут</small></span>
              <button className="icon-button" type="button" aria-label={`Удалить ${film.film_name}`} onTouchStart={(event) => event.stopPropagation()} onClick={() => void runAction(() => cinemaApi.deleteFilm(film.id))}>×</button>
            </article>
          ))}</div>
          <div className="timelines">{data.halls.map((hall) => (
            <div className="timeline-row" key={hall.id}>
              <strong>{hall.hall_name}</strong>
              <div
                className="timeline"
                data-hall-id={hall.id}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => addSeanceByDrop(event, hall.id)}
                onTouchEnd={(event) => addSelectedFilmByTouch(event, hall.id)}
              >
                {data.seances.filter((seance) => seance.seance_hallid === hall.id).map((seance) => {
                  const film = data.films.find((item) => item.id === seance.seance_filmid)
                  const [hours, minutes] = seance.seance_time.split(':').map(Number)
                  return <div
                    className="timeline__seance"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('seanceId', String(seance.id))
                      event.dataTransfer.effectAllowed = 'move'
                      setDraggedSeanceId(seance.id)
                    }}
                    onDragEnd={() => {
                      setDraggedSeanceId(null)
                      setIsTrashActive(false)
                    }}
                    style={{ left: `${((hours * 60 + minutes) / 1440) * 100}%`, width: `${Math.max(5, ((film?.film_duration ?? 60) / 1440) * 100)}%` }}
                    key={seance.id}
                  ><span>{film?.film_name}</span><time>{seance.seance_time}</time></div>
                })}
              </div>
            </div>
          ))}</div>
          {draggedSeanceId !== null && (
            <div
              className={`seance-trash${isTrashActive ? ' is-active' : ''}`}
              role="region"
              aria-label="Удалить сеанс"
              onDragEnter={(event) => {
                event.preventDefault()
                setIsTrashActive(true)
              }}
              onDragLeave={() => setIsTrashActive(false)}
              onDragOver={(event) => {
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
              }}
              onDrop={deleteSeanceByDrop}
            >
              <svg aria-hidden="true" viewBox="0 0 24 24">
                <path d="M8 3h8l1 2h4v2H3V5h4l1-2Zm-2 6h12l-1 12H7L6 9Zm3 2v7h2v-7H9Zm4 0v7h2v-7h-2Z" />
              </svg>
              <span>Удалить сеанс</span>
            </div>
          )}
        </AdminSection>

        <AdminSection title="Открыть продажи">
          <p>Выберите зал для открытия/приостановки продаж:</p>
          <div className="hall-tabs">{data.halls.map((hall) => <button className={hall.id === selectedHallId ? 'is-active' : ''} key={hall.id} type="button" onClick={() => setSelectedHallId(hall.id)}>{hall.hall_name}</button>)}</div>
          {selectedHall && <div className="sales-control"><p>{selectedHall.hall_open ? 'Продажа билетов открыта' : 'Всё готово к открытию'}</p><button className="button admin-button" type="button" disabled={busy} onClick={() => void runAction(() => cinemaApi.setHallOpen(selectedHall.id, selectedHall.hall_open ? 0 : 1))}>{selectedHall.hall_open ? 'Приостановить продажу билетов' : 'Открыть продажу билетов'}</button></div>}
        </AdminSection>
      </main>

      {modal === 'hall' && (
        <AdminModal title="Добавление зала" onClose={() => setModal(null)}>
          <form className="admin-modal__form" onSubmit={addHall}>
            <label>
              Название зала
              <input autoFocus value={newHallName} onChange={(event) => setNewHallName(event.target.value)} placeholder="Например, «Зал 1»" required />
            </label>
            <div className="admin-modal__actions">
              <button className="button admin-button" type="submit" disabled={busy}>Добавить зал</button>
              <button className="button button--secondary" type="button" onClick={() => setModal(null)}>Отменить</button>
            </div>
          </form>
        </AdminModal>
      )}

      {modal === 'film' && (
        <AdminModal title="Добавление фильма" onClose={() => setModal(null)}>
          <form className="admin-modal__form" onSubmit={addFilm}>
            <label>Название фильма<input name="name" placeholder="Например, «Гражданин Кейн»" required /></label>
            <label>Продолжительность фильма (мин.)<input name="duration" type="number" min="1" required /></label>
            <label>Описание фильма<textarea name="description" required /></label>
            <label>Страна<input name="origin" required /></label>
            <input
              className="file-input"
              id="film-poster"
              name="poster"
              type="file"
              accept="image/*"
              required
              onChange={(event) => setPosterName(event.target.files?.[0]?.name ?? '')}
            />
            <p className={`poster-name${posterName ? ' is-selected' : ''}`}>
              {posterName ? `Выбран файл: ${posterName}` : 'Постер пока не выбран'}
            </p>
            <div className="admin-modal__actions">
              <button className="button admin-button" type="submit" disabled={busy}>Добавить фильм</button>
              <label className="button admin-button upload-button" htmlFor="film-poster">Загрузить постер</label>
              <button className="button button--secondary" type="button" onClick={() => setModal(null)}>Отменить</button>
            </div>
          </form>
        </AdminModal>
      )}

      {modal === 'seance' && (
        <AdminModal title="Добавление сеанса" onClose={() => setModal(null)}>
          <form className="admin-modal__form admin-modal__form--seance" onSubmit={addSeance}>
            <label>Название зала<select name="hallId" defaultValue={pendingSeance.hallId} required>{data.halls.map((hall) => <option value={hall.id} key={hall.id}>{hall.hall_name}</option>)}</select></label>
            <label>Название фильма<select name="filmId" defaultValue={pendingSeance.filmId} required>{data.films.map((film) => <option value={film.id} key={film.id}>{film.film_name}</option>)}</select></label>
            <label>Время начала<input name="time" type="time" defaultValue={pendingSeance.time} required /></label>
            <div className="admin-modal__actions">
              <button className="button admin-button" type="submit" disabled={busy}>Добавить сеанс</button>
              <button className="button button--secondary" type="button" onClick={() => setModal(null)}>Отменить</button>
            </div>
          </form>
        </AdminModal>
      )}
    </div>
  )
}

export default AdminPage
