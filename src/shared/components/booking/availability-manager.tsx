"use client"

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { WeeklySchedule } from './weekly-schedule'
import { TimeOffManager } from './time-off-manager'
import { SpecialHoursManager } from './special-hours-manager'
import { AvailabilityCalendar } from './availability-calendar'
import { supabase } from '@/shared/lib/supabase'
import { toast } from 'sonner'
import { Loader2, Calendar, Clock, Umbrella, Eye } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'

interface TimeOff {
  id: string
  barber_id: string
  start_date: string
  end_date: string
  reason: string
  created_at: string
  updated_at: string
}

interface SpecialHours {
  id: string
  barber_id: string
  date: string
  start_time: string
  end_time: string
  is_closed: boolean
  reason: string
  created_at: string
  updated_at: string
}

interface TimeSlot {
  start: string
  end: string
}

interface Availability {
  id: string
  barber_id: string
  day_of_week: number
  start_time: string
  end_time: string
  created_at: string
  updated_at: string
}

interface AvailabilityManagerProps {
  barberId: string
}

export function AvailabilityManager({ barberId }: AvailabilityManagerProps) {
  const [activeTab, setActiveTab] = useState('weekly')
  const [loading, setLoading] = useState(true)
  const [specialHours, setSpecialHours] = useState<SpecialHours[]>([])
  const [timeOff, setTimeOff] = useState<TimeOff[]>([])
  const [availability, setAvailability] = useState<Availability[]>([])

  useEffect(() => {
    fetchAvailability()
  }, [barberId])

  const fetchAvailability = async () => {
    try {
      setLoading(true)
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('availability')
        .select('*')
        .eq('barber_id', barberId)

      if (availabilityError) throw availabilityError

      const { data: specialHoursData, error: specialHoursError } = await supabase
        .from('special_hours')
        .select('*')
        .eq('barber_id', barberId)

      if (specialHoursError) throw specialHoursError

      const { data: timeOffData, error: timeOffError } = await supabase
        .from('time_off')
        .select('*')
        .eq('barber_id', barberId)

      if (timeOffError) throw timeOffError

      setAvailability(availabilityData || [])
      setSpecialHours(specialHoursData || [])
      setTimeOff(timeOffData || [])
    } catch (error) {
      console.error('Error fetching availability:', error)
      toast.error('Failed to load availability settings')
    } finally {
      setLoading(false)
    }
  }

  const handleAddTimeOff = async (timeOffData: Omit<TimeOff, 'id' | 'barber_id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('time_off').insert({
        barber_id: barberId,
        start_date: timeOffData.start_date,
        end_date: timeOffData.end_date,
        reason: timeOffData.reason
      }).select()

      if (error) throw error

      setTimeOff([...timeOff, data[0]])
      toast.success('Time off added successfully')
    } catch (error) {
      console.error('Error adding time off:', error)
      toast.error('Failed to add time off')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveTimeOff = async (id: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.from('time_off').delete().eq('id', id)

      if (error) throw error

      setTimeOff(timeOff.filter((item) => item.id !== id))
      toast.success('Time off removed successfully')
    } catch (error) {
      console.error('Error removing time off:', error)
      toast.error('Failed to remove time off')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSpecialHours = async (hours: Omit<SpecialHours, 'id' | 'barber_id' | 'created_at' | 'updated_at'>) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.from('special_hours').insert({
        barber_id: barberId,
        date: hours.date,
        start_time: hours.start_time,
        end_time: hours.end_time,
        is_closed: hours.is_closed,
        reason: hours.reason
      }).select()

      if (error) throw error

      setSpecialHours([...specialHours, data[0]])
      toast.success('Special hours added successfully')
    } catch (error) {
      console.error('Error adding special hours:', error)
      toast.error('Failed to add special hours')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveSpecialHours = async (id: string) => {
    try {
      setLoading(true)
      const { error } = await supabase.from('special_hours').delete().eq('id', id)

      if (error) throw error

      setSpecialHours(specialHours.filter((hours) => hours.id !== id))
      toast.success('Special hours removed successfully')
    } catch (error) {
      console.error('Error removing special hours:', error)
      toast.error('Failed to remove special hours')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="bg-darkpurple/90 border border-white/10 shadow-2xl rounded-3xl backdrop-blur-xl p-8">
          <Loader2 className="h-8 w-8 animate-spin text-saffron mx-auto" />
          <p className="text-white/70 mt-4 text-center">Loading availability settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bebas text-white">Schedule Management</h2>
        <p className="text-white/70">Manage your availability, special hours, and time off</p>
      </div>

      {/* Main Content */}
      <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl rounded-3xl backdrop-blur-xl overflow-hidden">
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="border-b border-white/10">
              <TabsList className="grid w-full grid-cols-4 bg-transparent border-0 p-0 h-auto">
                <TabsTrigger 
                  value="weekly" 
                  className={`relative flex items-center gap-2 px-6 py-4 rounded-none border-b-2 transition-all duration-200 text-sm font-medium ${
                    activeTab === 'weekly' 
                      ? 'bg-transparent text-saffron border-saffron' 
                      : 'text-white/70 hover:text-white border-transparent hover:border-white/20'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Weekly</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="special-hours" 
                  className={`relative flex items-center gap-2 px-6 py-4 rounded-none border-b-2 transition-all duration-200 text-sm font-medium ${
                    activeTab === 'special-hours' 
                      ? 'bg-transparent text-saffron border-saffron' 
                      : 'text-white/70 hover:text-white border-transparent hover:border-white/20'
                  }`}
                >
                  <Clock className="h-4 w-4" />
                  <span className="hidden sm:inline">Special Hours</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="time-off" 
                  className={`relative flex items-center gap-2 px-6 py-4 rounded-none border-b-2 transition-all duration-200 text-sm font-medium ${
                    activeTab === 'time-off' 
                      ? 'bg-transparent text-saffron border-saffron' 
                      : 'text-white/70 hover:text-white border-transparent hover:border-white/20'
                  }`}
                >
                  <Umbrella className="h-4 w-4" />
                  <span className="hidden sm:inline">Time Off</span>
                </TabsTrigger>
                
                <TabsTrigger 
                  value="calendar" 
                  className={`relative flex items-center gap-2 px-6 py-4 rounded-none border-b-2 transition-all duration-200 text-sm font-medium ${
                    activeTab === 'calendar' 
                      ? 'bg-transparent text-saffron border-saffron' 
                      : 'text-white/70 hover:text-white border-transparent hover:border-white/20'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Calendar</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-6">
              <TabsContent value="weekly" className="m-0">
                <WeeklySchedule
                  barberId={barberId}
                  initialSchedule={availability}
                />
              </TabsContent>

              <TabsContent value="special-hours" className="m-0">
                <SpecialHoursManager
                  specialHours={specialHours}
                  onAdd={handleAddSpecialHours}
                  onRemove={handleRemoveSpecialHours}
                  barberId={barberId}
                />
              </TabsContent>

              <TabsContent value="time-off" className="m-0">
                <TimeOffManager
                  timeOff={timeOff}
                  onAdd={handleAddTimeOff}
                  onRemove={handleRemoveTimeOff}
                />
              </TabsContent>

              <TabsContent value="calendar" className="m-0">
                <AvailabilityCalendar
                  availability={availability}
                  specialHours={specialHours}
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}