"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/shared/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar"
import { Button } from "@/shared/components/ui/button"
import { Calendar, Clock, MapPin, Scissors, X } from "lucide-react"

type Person = {
  id: string
  name: string
  role: string
}

type Event = {
  id: string
  title: string
  start: Date
  end: Date
  barber: Person
  client: Person
  service: {
    name: string
    duration: number
    price: number
  }
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
}

interface CalendarEventDialogProps {
  event: Event | null
  userType: "client" | "barber"
  onClose: () => void
  onStatusChange: (eventId: string, status: Event['status']) => void
}

export function CalendarEventDialog({
  event,
  userType,
  onClose,
  onStatusChange,
}: CalendarEventDialogProps) {
  if (!event) return null

  return (
    <Dialog open={!!event} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Appointment Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{event.barber.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium">{event.barber.name}</h3>
              <p className="text-sm text-muted-foreground">{event.barber.role}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {event.start.toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                {event.start.toLocaleTimeString()} - {event.end.toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Scissors className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{event.service.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Barbershop Location</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Status</p>
              <p className="text-sm text-muted-foreground capitalize">{event.status}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Price</p>
              <p className="text-sm text-muted-foreground">${event.service.price}</p>
            </div>
          </div>

          {event.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onStatusChange(event.id, 'cancelled')}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={() => onStatusChange(event.id, 'confirmed')}
              >
                Confirm
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
