import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { Film, Hall, PurchasedTicket, Seance, SeatType } from '../types/cinema'

export type SelectedSeat = {
  row: number
  place: number
  type: Extract<SeatType, 'standart' | 'vip'>
  price: number
}

export type Booking = {
  date: string
  film: Film
  hall: Hall
  seance: Seance
  seats: SelectedSeat[]
}

type BookingContextValue = {
  booking: Booking | null
  purchasedTickets: PurchasedTicket[]
  setBooking: (booking: Booking | null) => void
  setPurchasedTickets: (tickets: PurchasedTicket[]) => void
}

const BookingContext = createContext<BookingContextValue | null>(null)
const STORAGE_KEY = 'cinema-booking'
const TICKETS_STORAGE_KEY = 'cinema-purchased-tickets'

const readStoredBooking = () => {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY)
    return value ? (JSON.parse(value) as Booking) : null
  } catch {
    return null
  }
}

const readStoredTickets = () => {
  try {
    const value = sessionStorage.getItem(TICKETS_STORAGE_KEY)
    const tickets: unknown = value ? JSON.parse(value) : []
    return Array.isArray(tickets) ? (tickets as PurchasedTicket[]) : []
  } catch {
    return []
  }
}

export const BookingProvider = ({ children }: { children: React.ReactNode }) => {
  const [booking, setBooking] = useState<Booking | null>(readStoredBooking)
  const [purchasedTickets, setPurchasedTickets] = useState<PurchasedTicket[]>(readStoredTickets)

  useEffect(() => {
    if (booking) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(booking))
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  }, [booking])

  useEffect(() => {
    if (purchasedTickets.length > 0) {
      sessionStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(purchasedTickets))
    } else {
      sessionStorage.removeItem(TICKETS_STORAGE_KEY)
    }
  }, [purchasedTickets])

  const value = useMemo(
    () => ({ booking, purchasedTickets, setBooking, setPurchasedTickets }),
    [booking, purchasedTickets],
  )

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export const useBooking = () => {
  const context = useContext(BookingContext)

  if (!context) {
    throw new Error('useBooking должен использоваться внутри BookingProvider')
  }

  return context
}
