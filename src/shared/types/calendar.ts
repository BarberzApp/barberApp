export type Person = {
  id: string
  name: string
  image?: string
  role: string
}

export type Service = {
  name: string
  duration: number
  price: number
}

export type CalendarEvent = {
  id: string
  title: string
  start: Date
  end: Date
  status: "pending" | "confirmed" | "cancelled" | "completed"
  service: Service
  barber: Person
  client: Person
} 