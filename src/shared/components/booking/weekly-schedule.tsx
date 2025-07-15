"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Plus, Trash2, Save, Clock, Calendar, Sparkles, Loader2 } from 'lucide-react'
import { useToast } from '@/shared/components/ui/use-toast'
import { supabase } from '@/shared/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'

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
        description: "Weekly schedule updated successfully",
      });
    } catch (error) {
      console.error('Error saving availability:', error);
      toast({
        title: "Error",
        description: "Failed to save schedule",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const availableDays = schedule.filter(day => day.isAvailable).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-saffron/20 rounded-xl flex items-center justify-center">
          <Calendar className="h-5 w-5 text-saffron" />
        </div>
        <div>
          <h3 className="text-xl font-bebas text-white">Weekly Schedule</h3>
          <p className="text-white/70 text-sm">Set your regular working hours for each day</p>
        </div>
      </div>

      {/* Stats Card */}
      <Card className="bg-white/5 border border-white/10 shadow-xl backdrop-blur-xl rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-saffron/20 rounded-lg">
                <Clock className="h-4 w-4 text-saffron" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Available Days</p>
                <p className="text-white font-semibold text-lg">{availableDays} of 7 days</p>
              </div>
            </div>
            <Badge variant="glassy-saffron" className="text-xs">
              {availableDays > 0 ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Grid */}
      <div className="space-y-4">
        {schedule.map((slot) => (
          <Card 
            key={slot.day_of_week} 
            className={`transition-all duration-200 rounded-2xl overflow-hidden ${
              slot.isAvailable 
                ? 'bg-white/5 border-saffron/30 shadow-lg shadow-saffron/10' 
                : 'bg-white/5 border-white/10 hover:border-white/20'
            }`}
          >
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
                      className="w-12 h-6 flex items-center transition-colors duration-200 rounded-full border-2 border-white/10 peer-checked:bg-saffron peer-checked:border-saffron bg-white/5 peer-focus:ring-2 peer-focus:ring-saffron peer-focus:ring-offset-2 peer-focus:ring-offset-darkpurple"
                    >
                      {/* Removed the knob/ball span for a flat toggle */}
                    </span>
                  </label>
                  <div>
                    <span className={`font-medium text-lg ${slot.isAvailable ? 'text-white' : 'text-white/60'}`}>
                      {DAYS[slot.day_of_week]}
                    </span>
                    {slot.isAvailable && (
                      <p className="text-sm text-saffron/80">Available for bookings</p>
                    )}
                  </div>
                </div>
                
                {slot.isAvailable && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                    <div className="space-y-2 w-full sm:w-auto">
                      <Label htmlFor={`start-${slot.day_of_week}`} className="text-white/80 text-sm">Start Time</Label>
                      <Input
                        id={`start-${slot.day_of_week}`}
                        type="time"
                        value={slot.start_time}
                        onChange={(e) => handleTimeChange(slot.day_of_week, 'start_time', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-saffron focus:ring-saffron rounded-xl"
                      />
                    </div>
                    <div className="space-y-2 w-full sm:w-auto">
                      <Label htmlFor={`end-${slot.day_of_week}`} className="text-white/80 text-sm">End Time</Label>
                      <Input
                        id={`end-${slot.day_of_week}`}
                        type="time"
                        value={slot.end_time}
                        onChange={(e) => handleTimeChange(slot.day_of_week, 'end_time', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-saffron focus:ring-saffron rounded-xl"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-saffron hover:bg-saffron/90 text-primary font-semibold shadow-lg px-8 py-3 rounded-xl transition-all duration-200 hover:scale-105 active:scale-100 focus:ring-2 focus:ring-saffron focus:ring-offset-2 focus:ring-offset-darkpurple"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Schedule
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
