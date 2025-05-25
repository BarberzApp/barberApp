"use client"

import { useState } from "react"
import { CalendarView } from "@/components/calendar/calendar-view"
import { useAuth } from "@/contexts/auth-context" // Adjusted the import path

// Mock calendar events
const mockEvents = [
  {
    id: "1",
    title: "Haircut & Beard Trim",
    start: (() => {
      const date = new Date()
      date.setHours(10, 0, 0, 0)
      return date
    })(),
    end: (() => {
      const date = new Date()
      date.setHours(11, 0, 0, 0)
      return date
    })(),
    client: {
      id: "c1",
      name: "Michael Brown",
      image: "/placeholder.svg?height=100&width=100",
    },
    barber: {
      id: "b1",
      name: "Alex Johnson",
      image: "/placeholder.svg?height=100&width=100",
    },
    services: ["Haircut", "Beard Trim"],
    status: "confirmed" as "confirmed",
  },
  {
    id: "2",
    title: "Fade",
    start: (() => {
      const date = new Date()
      date.setDate(date.getDate() + 1)
      date.setHours(14, 30, 0, 0)
      return date
    })(),
    end: (() => {
      const date = new Date()
      date.setDate(date.getDate() + 1)
      date.setHours(15, 15, 0, 0)
      return date
    })(),
    client: {
      id: "c2",
      name: "David Lee",
      image: "/placeholder.svg?height=100&width=100",
    },
    barber: {
      id: "b2",
      name: "Maria Garcia",
      image: "/placeholder.svg?height=100&width=100",
    },
    services: ["Fade"],
    status: "pending" as "pending",
  },
  {
    id: "3",
    title: "Haircut & Style",
    start: (() => {
      const date = new Date()
      date.setDate(date.getDate() - 2)
      date.setHours(11, 0, 0, 0)
      return date
    })(),
    end: (() => {
      const date = new Date()
      date.setDate(date.getDate() - 2)
      date.setHours(12, 0, 0, 0)
      return date
    })(),
    client: {
      id: "c3",
      name: "Sarah Johnson",
      image: "/placeholder.svg?height=100&width=100",
    },
    barber: {
      id: "b3",
      name: "Jamal Williams",
      image: "/placeholder.svg?height=100&width=100",
    },
    services: ["Haircut", "Style"],
    status: "completed" as "completed",
  },
  {
    id: "4",
    title: "Hot Towel Shave",
    start: (() => {
      const date = new Date()
      date.setDate(date.getDate() + 3)
      date.setHours(16, 0, 0, 0)
      return date
    })(),
    end: (() => {
      const date = new Date()
      date.setDate(date.getDate() + 3)
      date.setHours(16, 45, 0, 0)
      return date
    })(),
    client: {
      id: "c4",
      name: "James Wilson",
      image: "/placeholder.svg?height=100&width=100",
    },
    barber: {
      id: "b1",
      name: "Alex Johnson",
      image: "/placeholder.svg?height=100&width=100",
    },
    services: ["Hot Towel Shave"],
    status: "confirmed" as "confirmed",
  },
  {
    id: "5",
    title: "Kids Haircut",
    start: (() => {
      const date = new Date()
      date.setDate(date.getDate() + 5)
      date.setHours(9, 0, 0, 0)
      return date
    })(),
    end: (() => {
      const date = new Date()
      date.setDate(date.getDate() + 5)
      date.setHours(9, 30, 0, 0)
      return date
    })(),
    client: {
      id: "c5",
      name: "Emily Chen",
      image: "/placeholder.svg?height=100&width=100",
    },
    barber: {
      id: "b2",
      name: "Maria Garcia",
      image: "/placeholder.svg?height=100&width=100",
    },
    services: ["Kids Haircut"],
    status: "confirmed",
  },
]

export default function CalendarPage() {
  const { user } = useAuth();
  const [userType, setUserType] = useState<"client" | "barber">("client")

  // Optionally handle loading state if it's managed elsewhere
  if (!user || (user.role !== "client" && user.role !== "barber")) {
    return <div>Access Denied</div>;
  }

  // Optionally, set userType based on user.role
  // setUserType(user.role)

  return (
    <div className="container py-8 h-[calc(100vh-4rem)]">

    </div>
  )
}
