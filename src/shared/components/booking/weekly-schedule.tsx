"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import { Plus, Trash2 } from 'lucide-react'

interface TimeSlot {
  start: string
  end: string
}

interface Availability {
  day: string
  isAvailable: boolean
  slots: TimeSlot[]
}

interface WeeklyScheduleProps {
  availability: Availability[]
  onSave: (availability: Availability[]) => void
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export function WeeklySchedule({ availability, onSave }: WeeklyScheduleProps) {
  const [schedule, setSchedule] = useState<Availability[]>(() => {
    if (availability.length === 0) {
      return DAYS.map(day => ({
        day,
        isAvailable: day !== 'sunday',
        slots: [{ start: '09:00', end: '17:00' }]
      }))
    }
    return availability
  })

  const handleToggleDay = (day: string) => {
    setSchedule(schedule.map(item => 
      item.day === day ? { ...item, isAvailable: !item.isAvailable } : item
    ))
  }

  const handleAddSlot = (day: string) => {
    setSchedule(schedule.map(item =>
      item.day === day
        ? { ...item, slots: [...item.slots, { start: '09:00', end: '17:00' }] }
        : item
    ))
  }

  const handleRemoveSlot = (day: string, index: number) => {
    setSchedule(schedule.map(item =>
      item.day === day
        ? { ...item, slots: item.slots.filter((_, i) => i !== index) }
        : item
    ))
  }

  const handleSlotChange = (day: string, index: number, field: 'start' | 'end', value: string) => {
    setSchedule(schedule.map(item =>
      item.day === day
        ? {
            ...item,
            slots: item.slots.map((slot, i) =>
              i === index ? { ...slot, [field]: value } : slot
            )
          }
        : item
    ))
  }

  const handleSave = () => {
    onSave(schedule)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Schedule</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {schedule.map((day) => (
          <div key={day.day} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={day.isAvailable}
                  onCheckedChange={() => handleToggleDay(day.day)}
                />
                <Label className="capitalize">{day.day}</Label>
              </div>
              {day.isAvailable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddSlot(day.day)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Slot
                </Button>
              )}
            </div>

            {day.isAvailable && (
              <div className="space-y-2">
                {day.slots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={slot.start}
                      onChange={(e) => handleSlotChange(day.day, index, 'start', e.target.value)}
                      className="w-32"
                    />
                    <span>to</span>
                    <Input
                      type="time"
                      value={slot.end}
                      onChange={(e) => handleSlotChange(day.day, index, 'end', e.target.value)}
                      className="w-32"
                    />
                    {day.slots.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveSlot(day.day, index)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
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
