"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Plus, Trash2 } from "lucide-react"

type DayAvailability = {
  isAvailable: boolean
  slots: string[]
}

export type WeeklyAvailabilityType = {
  monday: DayAvailability
  tuesday: DayAvailability
  wednesday: DayAvailability
  thursday: DayAvailability
  friday: DayAvailability
  saturday: DayAvailability
  sunday: DayAvailability
}

interface WeeklyScheduleProps {
  availability: WeeklyAvailabilityType
  setAvailability: React.Dispatch<React.SetStateAction<WeeklyAvailabilityType>>
  onSave: () => void
}

export function WeeklySchedule({ availability, setAvailability, onSave }: WeeklyScheduleProps) {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const

  const handleToggleDay = (day: keyof WeeklyAvailabilityType) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        isAvailable: !prev[day].isAvailable,
      },
    }))
  }

  const handleAddSlot = (day: keyof WeeklyAvailabilityType) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: [...prev[day].slots, "9:00 AM - 5:00 PM"],
      },
    }))
  }

  const handleRemoveSlot = (day: keyof WeeklyAvailabilityType, index: number) => {
    setAvailability((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.filter((_, i) => i !== index),
      },
    }))
  }

  const handleChangeSlot = (day: keyof WeeklyAvailabilityType, index: number, value: string) => {
    setAvailability((prev) => {
      const newSlots = [...prev[day].slots]
      newSlots[index] = value
      return {
        ...prev,
        [day]: {
          ...prev[day],
          slots: newSlots,
        },
      }
    })
  }

  return (
    <div className="space-y-6">
      {days.map((day) => (
        <div key={day} className="border rounded-md p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Switch
                id={`${day}-toggle`}
                checked={availability[day].isAvailable}
                onCheckedChange={() => handleToggleDay(day)}
              />
              <Label htmlFor={`${day}-toggle`} className="capitalize font-medium">
                {day}
              </Label>
            </div>
            {availability[day].isAvailable && (
              <Button variant="outline" size="sm" onClick={() => handleAddSlot(day)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Time Slot
              </Button>
            )}
          </div>

          {availability[day].isAvailable && (
            <div className="space-y-2">
              {availability[day].slots.length === 0 ? (
                <p className="text-sm text-muted-foreground">No time slots added yet.</p>
              ) : (
                availability[day].slots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={slot}
                      onChange={(e) => handleChangeSlot(day, index, e.target.value)}
                      placeholder="e.g. 9:00 AM - 5:00 PM"
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveSlot(day, index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}

      <Button onClick={onSave} className="w-full">
        Save Weekly Schedule
      </Button>
    </div>
  )
}
