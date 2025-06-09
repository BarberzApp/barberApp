"use client"

import { useState } from "react"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useData } from "@/shared/contexts/data-context"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/shared/components/ui/select"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Card } from "@/shared/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Badge } from "@/shared/components/ui/badge"
import dynamic from 'next/dynamic'
import { Loader2 } from "lucide-react"
import { BarberCard } from "@/shared/components/profile/barber-card"
import type { Barber } from "@/shared/types"

const Calendar = dynamic(
  () => import("@/shared/components/ui/calendar").then((mod) => mod.Calendar),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
)

const CalendarSection = dynamic(
  () => Promise.resolve(({ selectedDate, onSelect }: { selectedDate: Date | undefined, onSelect: (date: Date | undefined) => void }) => (
    <div className="w-[300px]">
      <Calendar
        mode="single"
        selected={selectedDate}
        onSelect={onSelect}
        className="rounded-md border"
      />
    </div>
  )),
  {
    ssr: false,
    loading: () => (
      <div className="w-[300px] h-[300px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
)

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
  const { barbers, loading, error } = useData()
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())
  const [selectedBarber, setSelectedBarber] = useState<string | undefined>()

  if (loading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-barber-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading barbers...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="text-center">
          <p className="text-red-500">Error loading barbers: {error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">View and manage your appointments</p>
        </div>
        <div className="flex gap-4">
          <Select
            value={selectedBarber}
            onValueChange={setSelectedBarber}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select barber" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Barbers</SelectItem>
              {barbers.map((barber) => (
                <SelectItem key={barber.id} value={barber.id}>
                  {barber.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <CalendarSection selectedDate={selectedDate} onSelect={setSelectedDate} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {barbers
          .filter((barber) => !selectedBarber || barber.id === selectedBarber)
          .map((barber) => (
            <BarberCard key={barber.id} barber={barber} />
          ))}
      </div>
    </div>
  )
}
