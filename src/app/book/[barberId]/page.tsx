'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar'
import { Button } from '@/shared/components/ui/button'
import { BookingForm } from '@/shared/components/booking/booking-form'
import { Service } from '@/shared/types/service'
import { useToast } from '@/shared/components/ui/use-toast'
import Link from 'next/link'

type Barber = {
  id: string
  userId: string
  name: string
  location?: string
  phone?: string
  bio?: string
  specialties: string[]
  services: Service[]
}

type BarberFromDB = {
  id: string
  user_id: string
  bio: string | null
  specialties: string[]
  profiles: Array<{
    name: string
    location: string | null
    phone: string | null
  }>
  services: Array<{
    id: string
    name: string
    description: string | null
    duration: number
    price: number
    barber_id: string
  }>
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
      // First, get the barber's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', barberId)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        throw profileError
      }

      if (!profileData) {
        throw new Error('Profile not found')
      }

      // Then, get the barber's details
      const { data: barberData, error: barberError } = await supabase
        .from('barbers')
        .select('*')
        .eq('user_id', profileData.id)
        .single()

      if (barberError) {
        console.error('Error fetching barber:', barberError)
        throw barberError
      }

      if (!barberData) {
        throw new Error('Barber not found')
      }

      // Finally, get the barber's services
      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .eq('barber_id', barberData.id)

      if (servicesError) {
        console.error('Error fetching services:', servicesError)
        throw servicesError
      }

      setBarber({
        id: barberData.id,
        userId: barberData.user_id,
        name: profileData.name || '',
        location: profileData.location || '',
        phone: profileData.phone || '',
        bio: barberData.bio || '',
        specialties: barberData.specialties || [],
        services: (servicesData || []).map(service => ({
          id: service.id,
          name: service.name,
          description: service.description || undefined,
          duration: service.duration,
          price: service.price,
          barberId: service.barber_id
        })),
      })
    } catch (error) {
      console.error('Error fetching barber details:', error)
      toast({
        title: 'Error',
        description: 'Failed to load barber details. Please try again.',
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
      <div className="min-h-screen bg-[#181A20] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-white">Barber not found</h1>
          <Button asChild className="rounded-full bg-primary text-white px-6 py-2">
            <Link href="/browse">Back to Browse</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#181A20] py-10">
      <div className="container mx-auto max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2">
          <Card className="rounded-2xl bg-[#23243a] border-none shadow-lg">
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-2xl bg-primary text-white">{barber.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-3xl text-white font-bold mb-1 tracking-tight">{barber.name}</CardTitle>
                  {barber.bio && <p className="text-[#A1A1AA] mt-1">{barber.bio}</p>}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div>
                  <h3 className="font-semibold mb-2 text-white">Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {barber.specialties.map((specialty, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#8E44AD] text-white rounded-full text-xs font-medium shadow-sm"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2 text-white">Services</h3>
                  <div className="space-y-3">
                    {barber.services.map((service) => (
                      <div
                        key={service.id}
                        className="flex justify-between items-center p-4 bg-[#292B36] rounded-xl shadow group hover:bg-primary/10 transition"
                      >
                        <div>
                          <h4 className="font-semibold text-white group-hover:text-primary transition-colors">{service.name}</h4>
                          {service.description && (
                            <p className="text-xs text-[#A1A1AA] mt-1">{service.description}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white group-hover:text-primary transition-colors">${service.price}</p>
                          <p className="text-xs text-[#A1A1AA]">{service.duration} min</p>
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
          <Card className="rounded-2xl bg-[#23243a] border-none shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl text-white font-bold">Book Appointment</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full rounded-full py-3 font-semibold bg-primary hover:bg-primary/90 text-white shadow-md transition text-lg"
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