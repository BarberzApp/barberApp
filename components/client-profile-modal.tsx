"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Star, Scissors } from "lucide-react"

interface ClientProfileModalProps {
  trigger: React.ReactNode
  client: {
    id: string
    name: string
    image: string
    email: string
    phone: string
    joinDate: string
    bookingHistory: {
      id: string
      date: string
      service: string
      barber: string
      price: string
    }[]
    favoriteBarbers: {
      id: string
      name: string
      image: string
      specialty: string
    }[]
  }
}

export function ClientProfileModal({ trigger, client }: ClientProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Client Profile</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center py-4">
          <Avatar className="h-24 w-24 mb-4">
            <AvatarImage src={client.image || "/placeholder.svg"} alt={client.name} />
            <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold">{client.name}</h2>
          <div className="flex gap-2 mt-1 text-sm text-muted-foreground">
            <span>{client.email}</span>
            <span>•</span>
            <span>{client.phone}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Client since {client.joinDate}</p>
        </div>

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history">Booking History</TabsTrigger>
            <TabsTrigger value="favorites">Favorite Barbers</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="space-y-4 mt-4">
            {client.bookingHistory.map((booking) => (
              <Card key={booking.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{booking.date}</span>
                      </div>
                      <h4 className="font-medium mt-1">{booking.service}</h4>
                      <p className="text-sm text-muted-foreground">Barber: {booking.barber}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold">{booking.price}</span>
                      <Button size="sm" variant="ghost" className="mt-2">
                        <Star className="h-4 w-4 mr-1" />
                        Review
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="favorites" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {client.favoriteBarbers.map((barber) => (
                <Card key={barber.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={barber.image || "/placeholder.svg"} alt={barber.name} />
                        <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-medium">{barber.name}</h4>
                        <Badge variant="secondary" className="mt-1">
                          <Scissors className="h-3 w-3 mr-1" />
                          {barber.specialty}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
