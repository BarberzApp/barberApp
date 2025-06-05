'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { BookingForm } from '@/shared/components/booking/booking-form'
import { Service } from '@/shared/types/service'
import { useToast } from '@/shared/components/ui/use-toast'

type Barber = {
  id: string
  userId: string
  name: string
  image?: string
  bio?: string
  specialties: string[]
  services: Service[]
}

export default function BookPage() {
  const { barberId } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const [barber, setBarber] = useState<Barber | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [showBookingForm, setShowBookingForm] = useState(false)

  useEffect(() => {
    fetchBarberDetails()
  }, [barberId])

  const fetchBarberDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select(`
          id,
          user_id,
          bio,
          specialties,
          profile:profiles (
            full_name,
            avatar_url
          ),
          services (
            id,
            name,
            description,
            duration,
            price,
            barber_id
          )
        `)
        .eq('user_id', barberId)
        .single()

      if (error) throw error

      setBarber({
        id: data.id,
        userId: data.user_id,
        name: data.profile[0].full_name,
        image: data.profile[0].avatar_url,
        bio: data.bio,
        specialties: data.specialties,
        services: data.services.map((service: any) => ({
          ...service,
          barberId: service.barber_id
        }))
      })
    } catch (error) {
      console.error('Error fetching barber details:', error)
      toast({
        title: 'Error',
        description: 'Failed to load barber details',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!barber) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Barber not found</h1>
          <Button asChild>
            <a href="/browse">Back to Browse</a>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={barber.image || "/placeholder.svg"} alt={barber.name} />
                  <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{barber.name}</CardTitle>
                  {barber.bio && <p className="text-muted-foreground mt-1">{barber.bio}</p>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-2">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {barber.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium mb-2">Services</h3>
                  <div className="space-y-2">
                    {barber.services.map((service) => (
                      <div
                        key={service.id}
                        className="flex justify-between items-center p-3 bg-muted/30 rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{service.name}</h4>
                          {service.description && (
                            <p className="text-sm text-muted-foreground">{service.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">${service.price}</p>
                          <p className="text-sm text-muted-foreground">{service.duration} min</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Book Appointment</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                onClick={() => setShowBookingForm(true)}
              >
                Select Date & Time
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {showBookingForm && (
        <BookingForm
          isOpen={showBookingForm}
          onClose={() => setShowBookingForm(false)}
          selectedDate={selectedDate || new Date()}
          barberId={barber.id}
          onBookingCreated={(booking) => {
            setShowBookingForm(false)
            toast({
              title: 'Success',
              description: 'Appointment booked successfully!',
            })
            router.push('/calendar')
          }}
        />
      )}
    </div>
  )
} 