"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { Badge } from "@/shared/components/ui/badge"
import { Calendar, Star, Scissors } from "lucide-react"
import { useToast } from "@/shared/components/ui/use-toast"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useData } from "../../hooks/use-data"
import { supabase } from '@/shared/lib/supabase'
import { BARBER_SPECIALTIES, getFilteredSpecialties } from '@/shared/constants/specialties'
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/shared/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"



export function BarberProfile() {
  const router = useRouter()
  const { user } = useAuth()
  const { updateBarber, loading: dataLoading } = useData()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [barberId, setBarberId] = useState<string>('')
  const [stats, setStats] = useState({
    totalAppointments: 0,
    averageRating: 0,
    servicesCount: 0
  })
  const [specialtiesOpen, setSpecialtiesOpen] = useState(false)
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(user?.specialties || [])

  useEffect(() => {
    if (user) {
      fetchBarberId()
      fetchStats()
    }
  }, [user])

  const fetchBarberId = async () => {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (error) throw error
      if (data) {
        setBarberId(data.id)
      }
    } catch (error) {
      console.error('Error fetching barber ID:', error)
    }
  }

  const fetchStats = async () => {
    try {
      // Fetch appointments count
      const { count: appointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact' })
        .eq('barber_id', barberId)

      // Fetch services count
      const { count: servicesCount } = await supabase
        .from('services')
        .select('*', { count: 'exact' })
        .eq('barber_id', barberId)

      // Fetch average rating
      const { data: reviews } = await supabase
        .from('reviews')
        .select('rating')
        .eq('barber_id', barberId)

      const averageRating = reviews?.length 
        ? reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length 
        : 0

      setStats({
        totalAppointments: appointmentsCount || 0,
        averageRating: Number(averageRating.toFixed(1)),
        servicesCount: servicesCount || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  if (!user) {
    router.push('/login')
    return null
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const barberData = {
        bio: formData.get('bio') as string,
        specialties: selectedSpecialties,
        location: formData.get('location') as string,
      }

      // Update barber profile
      await updateBarber(user.id, barberData)

      // Update phone in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          phone: formData.get('phone') as string,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <Avatar className="h-24 w-24">
                      <AvatarFallback>{user.name?.charAt(0) || "B"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-2xl">{user.name}</CardTitle>
                      <p className="text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        name="bio"
                        placeholder="Tell us about yourself..."
                        defaultValue={user.bio || ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialties">Specialties</Label>
                      <Popover open={specialtiesOpen} onOpenChange={setSpecialtiesOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={specialtiesOpen}
                            className="w-full justify-between"
                          >
                            {selectedSpecialties.length > 0 
                              ? `${selectedSpecialties.length} specialty(ies) selected`
                              : "Search and select specialties..."
                            }
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search specialties..." />
                            <CommandList>
                              <CommandEmpty>No specialty found.</CommandEmpty>
                              <CommandGroup>
                                {BARBER_SPECIALTIES.map((specialty) => (
                                  <CommandItem
                                    key={specialty}
                                    value={specialty}
                                    onSelect={() => {
                                      setSelectedSpecialties(prev => 
                                        prev.includes(specialty)
                                          ? prev.filter(s => s !== specialty)
                                          : [...prev, specialty]
                                      )
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        selectedSpecialties.includes(specialty) ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    {specialty}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <p className="text-sm text-muted-foreground">
                        Select the services you specialize in
                      </p>
                      {selectedSpecialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {selectedSpecialties.map((specialty) => (
                            <Badge key={specialty} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        placeholder="Your location"
                        defaultValue={user.location || ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder="Your phone number"
                        defaultValue={user.phone || ''}
                      />
                    </div>

                    <Button type="submit" disabled={loading || dataLoading}>
                      {loading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Total Appointments: 0</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Average Rating: 0.0</span>
                </div>
                <div className="flex items-center gap-2">
                  <Scissors className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Services Offered: 0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}