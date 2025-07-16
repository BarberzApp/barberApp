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
  onUpdate?: () => void
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function WeeklySchedule({ barberId, initialSchedule, onUpdate }: WeeklyScheduleProps) {
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
      
      // Call onUpdate to refresh settings data
      onUpdate?.();
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
    <div className="space-y-8 bg-black">
      {/* Enhanced Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-4 mb-6">
          <div className="p-4 bg-gradient-to-br from-saffron/20 to-saffron/10 rounded-2xl shadow-lg">
            <Calendar className="h-8 w-8 text-saffron" />
        </div>
        <div>
            <h2 className="text-3xl sm:text-4xl font-bebas text-white tracking-wide">
              Weekly Schedule
            </h2>
            <p className="text-white/70 text-lg mt-2">Set your regular working hours for each day</p>
          </div>
        </div>
      </div>



      {/* Enhanced Schedule Grid */}
      <div className="space-y-6">
        {schedule.map((slot) => (
          <Card 
            key={slot.day_of_week} 
            className={`transition-all duration-300 rounded-3xl overflow-hidden group ${
              slot.isAvailable 
                ? 'bg-gradient-to-br from-white/5 to-white/3 border-saffron/30 shadow-xl shadow-saffron/10 hover:shadow-2xl' 
                : 'bg-gradient-to-br from-white/5 to-white/3 border-white/10 hover:border-white/20 hover:shadow-lg'
            }`}
          >
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="flex items-center space-x-6">
                  {/* Enhanced toggle switch */}
                  <label className="relative inline-flex items-center cursor-pointer group focus:outline-none">
                    <input
                      type="checkbox"
                      checked={slot.isAvailable}
                      onChange={() => handleToggleDay(slot.day_of_week)}
                      className="sr-only peer"
                      aria-label={`Toggle ${DAYS[slot.day_of_week]}`}
                    />
                    <span
                      className="w-14 h-7 flex items-center transition-all duration-300 rounded-full border-2 border-white/20 peer-checked:bg-gradient-to-r from-saffron to-saffron/90 peer-checked:border-saffron bg-white/10 peer-focus:ring-2 peer-focus:ring-saffron peer-focus:ring-offset-2 peer-focus:ring-offset-darkpurple hover:scale-105"
                    >
                      <span className={`w-3 h-3 bg-white rounded-full transition-transform duration-300 ml-1 ${slot.isAvailable ? 'translate-x-7' : 'translate-x-0'}`} />
                    </span>
                  </label>
                  <div>
                    <span className={`font-bebas text-2xl tracking-wide ${slot.isAvailable ? 'text-white' : 'text-white/60'}`}>
                      {DAYS[slot.day_of_week]}
                    </span>
                    {slot.isAvailable && (
                      <p className="text-sm text-saffron/80 flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        Available for bookings
                      </p>
                    )}
                  </div>
                </div>
                
                {slot.isAvailable && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6 w-full lg:w-auto">
                    <div className="space-y-3 w-full sm:w-auto">
                      <Label htmlFor={`start-${slot.day_of_week}`} className="text-white/80 text-sm font-medium flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        Start Time
                      </Label>
                      <Input
                        id={`start-${slot.day_of_week}`}
                        type="time"
                        value={slot.start_time}
                        onChange={(e) => handleTimeChange(slot.day_of_week, 'start_time', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-saffron focus:ring-saffron rounded-xl h-12 text-lg"
                      />
                    </div>
                    <div className="space-y-3 w-full sm:w-auto">
                      <Label htmlFor={`end-${slot.day_of_week}`} className="text-white/80 text-sm font-medium flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        End Time
                      </Label>
                      <Input
                        id={`end-${slot.day_of_week}`}
                        type="time"
                        value={slot.end_time}
                        onChange={(e) => handleTimeChange(slot.day_of_week, 'end_time', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-saffron focus:ring-saffron rounded-xl h-12 text-lg"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Save Button */}
      <div className="flex justify-center pt-8">
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-gradient-to-r from-saffron to-saffron/90 hover:from-saffron/90 hover:to-saffron/80 text-primary font-semibold shadow-xl px-12 py-4 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-100 focus:ring-2 focus:ring-saffron focus:ring-offset-2 focus:ring-offset-darkpurple text-lg"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-3" />
              Saving Schedule...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-3" />
              Save Weekly Schedule
            </>
          )}
        </Button>
      </div>
      
      {/* Tips Section */}
      <Card className="bg-gradient-to-br from-saffron/10 via-saffron/5 to-transparent border border-saffron/20 shadow-xl backdrop-blur-xl rounded-3xl">
        <CardContent className="p-8">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-saffron/20 to-saffron/10 rounded-2xl">
              <Sparkles className="h-6 w-6 text-saffron" />
            </div>
            <div className="space-y-4">
              <h4 className="text-xl font-bebas text-white tracking-wide">Schedule Tips</h4>
              <ul className="text-white/70 space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-saffron rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-base">Set realistic hours that you can consistently maintain</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-saffron rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-base">Consider travel time between appointments when setting hours</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-saffron rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-base">Leave buffer time for breaks and unexpected delays</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-saffron rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-base">Update your schedule regularly to reflect your availability</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
