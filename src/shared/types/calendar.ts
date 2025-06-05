export type Person = {
  id: string
  name: string
  image?: string
}

export type CalendarEvent = {
  id: string
  title: string
  start: string
  end: string
  status: "pending" | "confirmed" | "cancelled" | "completed"
  services: string[]
  barber?: Person
  client?: Person
} 