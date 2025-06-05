"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/shared/components/ui/dialog"
import { Button } from "@/shared/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Badge } from "@/shared/components/ui/badge"
import { Calendar, Clock, Scissors, MapPin, MessageSquare } from "lucide-react"
import type { CalendarEvent } from "@/shared/types/calendar"
import Link from "next/link"

interface CalendarEventDialogProps {
  event: CalendarEvent
  userType: "client" | "barber"
  onClose: () => void
}

export function CalendarEventDialog({ event, userType, onClose }: CalendarEventDialogProps) {
  const formatTimeRange = (start: string, end: string) => {
    return `${new Date(start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${new Date(end).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-barber-500">Confirmed</Badge>
      case "pending":
        return <Badge className="bg-yellow-500">Pending</Badge>
      case "completed":
        return <Badge className="bg-green-500">Completed</Badge>
      case "cancelled":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Cancelled
          </Badge>
        )
      default:
        return null
    }
  }

  const person = userType === "client" ? event.barber : event.client

  return (
    <Dialog open={!!event} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{event.title}</span>
            {getStatusBadge(event.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Date</p>
              <p>
                {new Date(event.start).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Time</p>
              <p>{formatTimeRange(event.start, event.end)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Scissors className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Services</p>
              <p>{event.services.join(", ")}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Location</p>
              <p>Downtown Studio</p>
            </div>
          </div>

          {person && (
            <div className="flex items-start gap-3 pt-2">
              <Avatar className="h-10 w-10">
                <AvatarImage src={person.image || "/placeholder.svg"} alt={person.name} />
                <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{userType === "client" ? "Barber" : "Client"}</p>
                <p className="font-medium">{person.name}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-2">
          {event.barber && (
            <Button variant="outline" className="sm:flex-1" href={`/messages/${event.barber.id}`}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Message Barber
            </Button>
          )}
          {event.status === "confirmed" && (
            <Button variant="destructive" className="sm:flex-1">
              Cancel Appointment
            </Button>
          )}
          {event.status === "pending" && <Button className="sm:flex-1">Confirm Appointment</Button>}
          {event.status === "completed" && <Button className="sm:flex-1">Book Again</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
