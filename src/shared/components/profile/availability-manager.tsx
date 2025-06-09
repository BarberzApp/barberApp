"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Input } from '@/shared/components/ui/input'
import { supabase } from '@/shared/lib/supabase'
import { toast } from 'sonner'

interface Availability {
  day_of_week: number
  start_time: string
  end_time: string
}

interface AvailabilityManagerProps {
  barberId: string
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function AvailabilityManager({ barberId }: AvailabilityManagerProps) {
  const [availability, setAvailability] = useState<Availability[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchAvailability()
  }, [barberId])

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .eq('barber_id', barberId)

      if (error) throw error

      if (data && data.length > 0) {
        setAvailability(data)
      } else {
        // Set default availability if none exists
        const defaultAvailability = DAYS.map((_, index) => ({
          day_of_week: index,
          start_time: '09:00',
          end_time: '17:00'
        }))
        setAvailability(defaultAvailability)
      }
    } catch (error) {
      console.error('Error fetching availability:', error)
      toast.error('Failed to load availability')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTimeChange = (dayOfWeek: number, field: 'start_time' | 'end_time', value: string) => {
    setAvailability(prev => 
      prev.map(avail => 
        avail.day_of_week === dayOfWeek ? { ...avail, [field]: value } : avail
      )
    )
  }

  const toggleAvailability = (dayOfWeek: number) => {
    setAvailability(prev => {
      const day = prev.find(avail => avail.day_of_week === dayOfWeek)
      if (!day) return prev

      // If the day exists, remove it (making it unavailable)
      if (day.start_time && day.end_time) {
        return prev.filter(avail => avail.day_of_week !== dayOfWeek)
      }

      // If the day doesn't exist, add it with default times
      return [...prev, {
        day_of_week: dayOfWeek,
        start_time: '09:00',
        end_time: '17:00'
      }]
    })
  }

  const saveAvailability = async () => {
    try {
      setIsLoading(true)
      
      // Validate data
      const invalidTimes = availability.filter(avail => 
        new Date(`2000-01-01T${avail.start_time}`) >= new Date(`2000-01-01T${avail.end_time}`)
      )

      if (invalidTimes.length > 0) {
        toast.error('End time must be after start time')
        return
      }

      // Delete existing availability
      const { error: deleteError } = await supabase
        .from('availability')
        .delete()
        .eq('barber_id', barberId)

      if (deleteError) throw deleteError

      // Insert new availability
      const { error: insertError } = await supabase
        .from('availability')
        .insert(
          availability.map(avail => ({
            barber_id: barberId,
            day_of_week: avail.day_of_week,
            start_time: avail.start_time,
            end_time: avail.end_time
          }))
        )

      if (insertError) throw insertError

      // Refresh the data
      await fetchAvailability()
      toast.success('Availability updated successfully')
    } catch (error) {
      console.error('Error saving availability:', error)
      toast.error('Failed to save availability')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6">Manage Availability</h2>
      <div className="space-y-6">
        {DAYS.map((dayName, index) => {
          const day = availability.find(avail => avail.day_of_week === index)
          const isAvailable = !!day

          return (
            <div key={dayName} className="flex items-center gap-4">
              <div className="w-32">
                <Label>{dayName}</Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="time"
                  value={day?.start_time || '09:00'}
                  onChange={(e) => handleTimeChange(index, 'start_time', e.target.value)}
                  disabled={!isAvailable}
                  className="w-32"
                />
                <span>to</span>
                <Input
                  type="time"
                  value={day?.end_time || '17:00'}
                  onChange={(e) => handleTimeChange(index, 'end_time', e.target.value)}
                  disabled={!isAvailable}
                  className="w-32"
                />
              </div>
              <Button
                variant={isAvailable ? "default" : "outline"}
                onClick={() => toggleAvailability(index)}
              >
                {isAvailable ? 'Available' : 'Unavailable'}
              </Button>
            </div>
          )
        })}
        <Button 
          onClick={saveAvailability} 
          disabled={isLoading}
          className="w-full mt-6"
        >
          Save Availability
        </Button>
      </div>
    </Card>
  )
} 