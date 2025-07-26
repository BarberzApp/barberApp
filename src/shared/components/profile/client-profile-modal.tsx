"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/router"
import { useAuth } from "@/shared/hooks/use-auth-zustand"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/shared/components/ui/dialog"
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar"
import { Button } from "@/shared/components/ui/button"
import { Calendar, Clock, MapPin, Scissors, X } from "lucide-react"

type Client = {
  id: string
  name: string
  email: string
  phone?: string
  location?: string
  bio?: string
  joinDate: string
}

type Barber = {
  id: string
  name: string
  location?: string
  phone?: string
  bio?: string
  specialties: string[]
}

type Booking = {
  id: string
  barberId: string
  clientId: string
  serviceId: string
  date: Date
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  price: number
  createdAt: Date
  updatedAt: Date
  barber: Barber
  service: {
    name: string
    duration: number
    price: number
  }
}

interface ClientProfileModalProps {
  client: Client | null
  bookings: Booking[]
  onClose: () => void
}

export function ClientProfileModal({
  client,
  bookings,
  onClose,
}: ClientProfileModalProps) {
  if (!client) return null

  return (
    <Dialog open={!!client} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Client Profile</DialogTitle>
          <DialogDescription>
            View client information, contact details, and booking history.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-medium">{client.name}</h3>
              <p className="text-sm text-muted-foreground">{client.email}</p>
              {client.phone && (
                <p className="text-sm text-muted-foreground">{client.phone}</p>
              )}
              {client.location && (
                <p className="text-sm text-muted-foreground">{client.location}</p>
              )}
            </div>
          </div>

          {client.bio && (
            <div>
              <h4 className="text-sm font-medium mb-1">Bio</h4>
              <p className="text-sm text-muted-foreground">{client.bio}</p>
            </div>
          )}

          <div>
            <h4 className="text-sm font-medium mb-2">Booking History</h4>
            <div className="space-y-2">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{booking.barber.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{booking.barber.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.service.name} - ${booking.service.price}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      {new Date(booking.date).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {booking.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
