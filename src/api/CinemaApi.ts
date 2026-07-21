import type {
  ApiResponse,
  CinemaData,
  Film,
  Hall,
  PurchasedTicket,
  Seance,
  SeatType,
  TicketInput,
} from '../types/cinema'

const API_URL = 'https://shfe-diplom.neto-server.ru'

const createFormData = (values: Record<string, string | number>) => {
  const formData = new FormData()

  Object.entries(values).forEach(([key, value]) => {
    formData.set(key, String(value))
  })

  return formData
}

class CinemaApi {
  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, options)

    if (!response.ok) {
      throw new Error(`Ошибка сервера: ${response.status}`)
    }

    const data = (await response.json()) as ApiResponse<T>

    if (!data.success) {
      throw new Error(data.error || 'Не удалось выполнить запрос')
    }

    return data.result
  }

  getAllData() {
    return this.request<CinemaData>('/alldata')
  }

  login(login: string, password: string) {
    return this.request<string>('/login', {
      method: 'POST',
      body: createFormData({ login, password }),
    })
  }

  addHall(hallName: string) {
    return this.request<{ halls: Hall[] }>('/hall', {
      method: 'POST',
      body: createFormData({ hallName }),
    })
  }

  deleteHall(hallId: number) {
    return this.request<{ halls: Hall[]; seances: Seance[] }>(`/hall/${hallId}`, {
      method: 'DELETE',
    })
  }

  updateHallConfig(hallId: number, config: SeatType[][]) {
    return this.request<Hall>(`/hall/${hallId}`, {
      method: 'POST',
      body: createFormData({
        rowCount: config.length,
        placeCount: config[0]?.length ?? 0,
        config: JSON.stringify(config),
      }),
    })
  }

  updateHallPrices(hallId: number, priceStandart: number, priceVip: number) {
    return this.request<Hall>(`/price/${hallId}`, {
      method: 'POST',
      body: createFormData({ priceStandart, priceVip }),
    })
  }

  setHallOpen(hallId: number, hallOpen: 0 | 1) {
    return this.request<Hall>(`/open/${hallId}`, {
      method: 'POST',
      body: createFormData({ hallOpen }),
    })
  }

  addFilm(values: {
    name: string
    duration: number
    description: string
    origin: string
    poster: File
  }) {
    const formData = createFormData({
      filmName: values.name,
      filmDuration: values.duration,
      filmDescription: values.description,
      filmOrigin: values.origin,
    })
    formData.set('filePoster', values.poster)

    return this.request<{ films: Film[] }>('/film', {
      method: 'POST',
      body: formData,
    })
  }

  deleteFilm(filmId: number) {
    return this.request<{ films: Film[]; seances: Seance[] }>(`/film/${filmId}`, {
      method: 'DELETE',
    })
  }

  addSeance(seanceHallid: number, seanceFilmid: number, seanceTime: string) {
    return this.request<{ seances: Seance[] }>('/seance', {
      method: 'POST',
      body: createFormData({ seanceHallid, seanceFilmid, seanceTime }),
    })
  }

  deleteSeance(seanceId: number) {
    return this.request<{ seances: Seance[] }>(`/seance/${seanceId}`, {
      method: 'DELETE',
    })
  }

  getHallConfig(seanceId: number, date: string) {
    const params = new URLSearchParams({ seanceId: String(seanceId), date })
    return this.request<SeatType[][]>(`/hallconfig?${params}`)
  }

  buyTickets(seanceId: number, ticketDate: string, tickets: TicketInput[]) {
    const formData = createFormData({ seanceId, ticketDate })
    formData.set('tickets', JSON.stringify(tickets))

    return this.request<unknown>('/ticket', {
      method: 'POST',
      body: formData,
    }).then((result) => {
      if (Array.isArray(result)) {
        return result as PurchasedTicket[]
      }

      if (result && typeof result === 'object') {
        const response = result as {
          tickets?: PurchasedTicket[] | PurchasedTicket
          ticket?: PurchasedTicket[] | PurchasedTicket
          ticket_date?: string
        }
        const receivedTickets = response.tickets ?? response.ticket

        if (Array.isArray(receivedTickets)) return receivedTickets
        if (receivedTickets && typeof receivedTickets === 'object') return [receivedTickets]
        if (response.ticket_date) return [result as PurchasedTicket]
      }

      return []
    })
  }
}

export const cinemaApi = new CinemaApi()
