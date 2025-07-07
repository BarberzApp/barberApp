"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import { Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/shared/components/ui/use-toast'
import { supabase } from '@/shared/lib/supabase'

interface Availability {
  id?: string
  barber_id: string
  day_of_week: number
  start_time: string
  end_time: string
  isAvailable?: boolean
}

interface WeeklyScheduleProps {
  barberId: string
  initialSchedule?: Availability[]
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function WeeklySchedule({ barberId, initialSchedule }: WeeklyScheduleProps) {
  const { toast } = useToast()
  const [schedule, setSchedule] = useState<Availability[]>([])
  const [isSaving, setIsSaving] = useState(false)

  // Initialize schedule when component mounts or initialSchedule changes
  useEffect(() => {
    if (initialSchedule && initialSchedule.length > 0) {
      // Map the initial schedule to include isAvailable property
      const mappedSchedule = DAYS.map((_, index) => {
        const existingDay = initialSchedule.find(day => day.day_of_week === index)
        return {
          barber_id: barberId,
          day_of_week: index,
          start_time: existingDay?.start_time || '',
          end_time: existingDay?.end_time || '',
          isAvailable: !!(existingDay?.start_time && existingDay?.end_time)
        }
      })
      setSchedule(mappedSchedule)
    } else {
      // Set default schedule if no initial data
      const defaultSchedule = DAYS.map((_, index) => ({
        barber_id: barberId,
        day_of_week: index,
        start_time: '',
        end_time: '',
        isAvailable: false
      }))
      setSchedule(defaultSchedule)
    }
  }, [initialSchedule, barberId])

  const handleToggleDay = (dayOfWeek: number) => {
    setSchedule(schedule.map(item => 
      item.day_of_week === dayOfWeek 
        ? { 
            ...item, 
            isAvailable: !item.isAvailable,
            start_time: item.isAvailable ? '' : '09:00',
            end_time: item.isAvailable ? '' : '17:00'
          } 
        : item
    ))
  }

  const handleTimeChange = (day: number, field: 'start_time' | 'end_time', value: string) => {
    if (!value) return; // Don't update if value is empty
    
    setSchedule(prev => 
      prev.map(slot => 
        slot.day_of_week === day 
          ? { ...slot, [field]: value }
          : slot
      )
    );
  }

  const handleSave = async () => {
    try {
      setIsSaving(true);
      // Validate time slots
      const validSlots = schedule.filter(day => {
        if (!day.isAvailable) return false;
        if (!day.start_time || !day.end_time) {
          toast({
            title: "Error",
            description: `Please set both start and end times for ${DAYS[day.day_of_week]}`,
            variant: "destructive",
          });
          return false;
        }
        return true;
      });

      if (validSlots.length === 0) {
        toast({
          title: "Error",
          description: "Please set at least one day's availability",
          variant: "destructive",
        });
        return;
      }

      // Delete existing availability first
      await supabase.from('availability').delete().eq('barber_id', barberId)

      // Insert new availability
      const { error } = await supabase
        .from('availability')
        .insert(
          validSlots.map(slot => ({
            barber_id: barberId,
            day_of_week: slot.day_of_week,
            start_time: slot.start_time,
            end_time: slot.end_time
          }))
        );

      if (error) throw error;

      toast({
        title: "Success",
        description: "Availability updated successfully",
      });
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        title: "Error",
        description: "Failed to save availability",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {schedule.map((slot) => (
          <div key={slot.day_of_week} className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center space-x-4">
              {/* Custom toggle switch */}
              <label className="relative inline-flex items-center cursor-pointer group focus:outline-none">
                <input
                  type="checkbox"
                  checked={slot.isAvailable}
                  onChange={() => handleToggleDay(slot.day_of_week)}
                  className="sr-only peer"
                  aria-label={`Toggle ${DAYS[slot.day_of_week]}`}
                />
                <span
                  className="w-11 h-6 flex items-center bg-input rounded-full border-2 border-saffron transition-colors duration-200 peer-checked:bg-saffron peer-focus:ring-2 peer-focus:ring-saffron peer-focus:ring-offset-2 peer-focus:ring-offset-background"
                >
                  <span
                    className="h-5 w-5 bg-background rounded-full shadow-lg transform transition-transform duration-200 translate-x-1 peer-checked:translate-x-5 flex items-center justify-center"
                  >
                    {/* Animated checkmark */}
                    <svg
                      className="w-3 h-3 text-saffron opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
                      viewBox="0 0 20 20"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="5 10 9 14 15 7" />
                    </svg>
                  </span>
                </span>
              </label>
              <span className="font-medium">{DAYS[slot.day_of_week]}</span>
            </div>
            {slot.isAvailable && (
              <div className="flex items-center space-x-4">
                <div className="space-y-2">
                  <Label htmlFor={`start-${slot.day_of_week}`}>Start Time</Label>
                  <Input
                    id={`start-${slot.day_of_week}`}
                    type="time"
                    value={slot.start_time}
                    onChange={(e) => handleTimeChange(slot.day_of_week, 'start_time', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`end-${slot.day_of_week}`}>End Time</Label>
                  <Input
                    id={`end-${slot.day_of_week}`}
                    type="time"
                    value={slot.end_time}
                    onChange={(e) => handleTimeChange(slot.day_of_week, 'end_time', e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
        <Button
          onClick={handleSave}
          className="w-full mt-4 bg-saffron text-primary font-bold rounded-xl shadow-lg py-3 text-lg tracking-wide transition-all duration-200 hover:scale-105 hover:bg-saffron/90 active:scale-100 focus:ring-2 focus:ring-saffron focus:ring-offset-2 focus:outline-none flex items-center justify-center gap-2"
          disabled={isSaving}
        >
          {isSaving ? (
            <svg className="animate-spin h-5 w-5 mr-2 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
            </svg>
          ) : null}
          {isSaving ? 'Saving...' : 'Save Schedule'}
        </Button>
      </CardContent>
    </Card>
  )
}
