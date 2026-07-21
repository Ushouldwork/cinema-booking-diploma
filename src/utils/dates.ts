const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']

export const startOfDay = (date: Date) => {
  const result = new Date(date)
  result.setHours(0, 0, 0, 0)
  return result
}

export const addDays = (date: Date, days: number) => {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

export const getDates = (startDate: Date, count: number) =>
  Array.from({ length: count }, (_, index) => addDays(startDate, index))

export const toApiDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const isSameDay = (first: Date, second: Date) =>
  toApiDate(first) === toApiDate(second)

export const getWeekday = (date: Date) => WEEKDAYS[date.getDay()]

export const isWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6

export const isSeancePast = (date: Date, time: string) => {
  const now = new Date()

  if (!isSameDay(date, now)) {
    return date < startOfDay(now)
  }

  const [hours, minutes] = time.split(':').map(Number)
  const startTime = new Date(date)
  startTime.setHours(hours, minutes, 0, 0)
  return startTime <= now
}
