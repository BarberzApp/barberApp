"use client"

import { useState } from 'react'
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
  const [schedule, setSchedule] = useState<Availability[]>(
    initialSchedule || DAYS.map((_, index) => ({
      barber_id: barberId,
      day_of_week: index,
      start_time: '',
      end_time: '',
      isAvailable: false
    }))
  )

  const handleToggleDay = (dayOfWeek: number) => {
    setSchedule(schedule.map(item => 
      item.day_of_week === dayOfWeek 
        ? { 
            ...item, 
            start_time: item.start_time ? '' : '09:00',
            end_time: item.end_time ? '' : '17:00'
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

      const { error } = await supabase
        .from('availability')
        .upsert(
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
              <Switch
                checked={slot.isAvailable}
                onCheckedChange={(checked) => handleToggleDay(slot.day_of_week)}
              />
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
        <Button onClick={handleSave} className="w-full">
          Save Schedule
        </Button>
      </CardContent>
    </Card>
  )
}
