"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, Scissors, User, Mail, Phone, FileText } from "lucide-react"

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
}

interface Barber {
  id: string
  name: string
  image: string
  location: string
}

interface BookingConfirmationProps {
  barber: Barber
  date: Date
  time: string
  services: Service[]
  details: {
    name: string
    email: string
    phone: string
    notes: string
  }
  totalPrice: number
  totalDuration: number
  onConfirm: () => void
}

export function BookingConfirmation({
  barber,
  date,
  time,
  services,
  details,
  totalPrice,
  totalDuration,
  onConfirm,
}: BookingConfirmationProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium text-lg mb-4">Appointment Details</h3>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Date</p>
                <p>
                  {date.toLocaleDateString("en-US", {
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
                <p>{time}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Scissors className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Services</p>
                <ul className="list-disc list-inside">
                  {services.map((service) => (
                    <li key={service.id}>
                      {service.name} - ${service.price}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <Separator />

            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Customer</p>
                <p>{details.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p>{details.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Phone</p>
                <p>{details.phone}</p>
              </div>
            </div>

            {details.notes && (
              <div className="flex items-start gap-3">
                <FileText className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm">{details.notes}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="bg-muted p-4 rounded-lg">
        <div className="flex justify-between mb-2">
          <span className="font-medium">Total Duration:</span>
          <span>{totalDuration} minutes</span>
        </div>
        <div className="flex justify-between">
          <span className="font-medium">Total Price:</span>
          <span className="font-bold">${totalPrice}</span>
        </div>
      </div>

      <Button onClick={onConfirm} className="w-full">
        Confirm Booking
      </Button>
    </div>
  )
}
