export type SeatType = 'standart' | 'vip' | 'taken' | 'disabled'

export type Hall = {
  id: number
  hall_name: string
  hall_rows: number
  hall_places: number
  hall_config: SeatType[][]
  hall_price_standart: number
  hall_price_vip: number
  hall_open: 0 | 1
}

export type Film = {
  id: number
  film_name: string
  film_duration: number
  film_description: string
  film_origin: string
  film_poster: string
}

export type Seance = {
  id: number
  seance_hallid: number
  seance_filmid: number
  seance_time: string
}

export type CinemaData = {
  halls: Hall[]
  films: Film[]
  seances: Seance[]
}

export type ApiResponse<T> = {
  success: boolean
  result: T
  error?: string
}

export type TicketInput = {
  row: number
  place: number
  coast: number
}

export type PurchasedTicket = {
  id: number
  ticket_date: string
  ticket_time: string
  ticket_filmname: string
  ticket_hallname: string
  ticket_row: number
  ticket_place: number
  ticket_price: number
}
