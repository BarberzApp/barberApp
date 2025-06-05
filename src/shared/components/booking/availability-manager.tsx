"use client"

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { WeeklySchedule } from './weekly-schedule'
import { TimeOffManager } from './time-off-manager'
import { SpecialHoursManager } from './special-hours-manager'
import { AvailabilityCalendar } from './availability-calendar'
import { supabase } from '@/shared/lib/supabase'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

interface TimeOff {
  id: string
  startDate: string
  endDate: string
  reason: string
}

interface SpecialHours {
  id: string
  date: string
  startTime: string
  endTime: string
  reason: string
}

interface TimeSlot {
  start: string
  end: string
}

interface Availability {
  day: string
  isAvailable: boolean
  slots: TimeSlot[]
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

      setAvailability(
        availabilityData.map((item) => ({
          day: item.day,
          isAvailable: item.is_available,
          slots: item.slots
        }))
      )
      setSpecialHours(specialHoursData)
      setTimeOff(timeOffData)
    } catch (error) {
      console.error('Error fetching availability:', error)
      toast.error('Failed to load availability settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveAvailability = async (newAvailability: Availability[]) => {
    try {
      setLoading(true)
      // Delete existing availability
      await supabase.from('availability').delete().eq('barber_id', barberId)

      // Insert new availability
      const { error } = await supabase.from('availability').insert(
        newAvailability.map((item) => ({
          barber_id: barberId,
          day: item.day,
          is_available: item.isAvailable,
          slots: item.slots
        }))
      )

      if (error) throw error

      setAvailability(newAvailability)
      toast.success('Availability updated successfully')
    } catch (error) {
      console.error('Error saving availability:', error)
      toast.error('Failed to save availability')
    } finally {
      setLoading(false)
    }
  }

  const handleAddSpecialHours = async (hours: SpecialHours) => {
    try {
      setLoading(true)
      const { error } = await supabase.from('special_hours').insert({
        barber_id: barberId,
        date: hours.date,
        start_time: hours.startTime,
        end_time: hours.endTime,
        reason: hours.reason
      })

      if (error) throw error

      setSpecialHours([...specialHours, hours])
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

  const handleAddTimeOff = async (timeOff: TimeOff) => {
    try {
      setLoading(true)
      const { error } = await supabase.from('time_off').insert({
        barber_id: barberId,
        start_date: timeOff.startDate,
        end_date: timeOff.endDate,
        reason: timeOff.reason
      })

      if (error) throw error

      setTimeOff((prev) => [...prev, timeOff])
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
        <TabsTrigger value="time-off">Time Off</TabsTrigger>
        <TabsTrigger value="special-hours">Special Hours</TabsTrigger>
        <TabsTrigger value="calendar">Calendar View</TabsTrigger>
      </TabsList>

      <TabsContent value="weekly">
        <WeeklySchedule availability={availability} onSave={handleSaveAvailability} />
      </TabsContent>

      <TabsContent value="time-off">
        <TimeOffManager timeOff={timeOff} onAdd={handleAddTimeOff} onRemove={handleRemoveTimeOff} />
      </TabsContent>

      <TabsContent value="special-hours">
        <SpecialHoursManager
          specialHours={specialHours}
          onAdd={handleAddSpecialHours}
          onRemove={handleRemoveSpecialHours}
        />
      </TabsContent>

      <TabsContent value="calendar">
        <AvailabilityCalendar
          availability={availability}
          specialHours={specialHours}
          timeOff={timeOff}
        />
      </TabsContent>
    </Tabs>
  )
}