"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { WeeklySchedule } from "@/components/availability/weekly-schedule"
import { TimeOffManager } from "@/components/availability/time-off-manager"
import { SpecialHoursManager } from "@/components/availability/special-hours-manager"
import type { WeeklyAvailabilityType } from "@/components/availability/weekly-schedule"

// Mock data for availability
const defaultAvailability: WeeklyAvailabilityType = {
  monday: { isAvailable: true, slots: ["9:00 AM - 12:00 PM", "1:00 PM - 5:00 PM"] },
  tuesday: { isAvailable: true, slots: ["9:00 AM - 12:00 PM", "1:00 PM - 5:00 PM"] },
  wednesday: { isAvailable: true, slots: ["9:00 AM - 12:00 PM", "1:00 PM - 5:00 PM"] },
  thursday: { isAvailable: true, slots: ["9:00 AM - 12:00 PM", "1:00 PM - 5:00 PM"] },
  friday: { isAvailable: true, slots: ["9:00 AM - 12:00 PM", "1:00 PM - 5:00 PM"] },
  saturday: { isAvailable: true, slots: ["10:00 AM - 2:00 PM"] },
  sunday: { isAvailable: false, slots: [] },
}

// Mock data for time off
const defaultTimeOff = [
  { id: "1", startDate: "2023-12-24", endDate: "2023-12-26", reason: "Christmas Holiday" },
  { id: "2", startDate: "2024-01-01", endDate: "2024-01-01", reason: "New Year's Day" },
]

// Mock data for special hours
const defaultSpecialHours = [
  { id: "1", date: "2023-12-23", slots: ["10:00 AM - 3:00 PM"], note: "Christmas Eve Eve - Shorter Hours" },
  { id: "2", date: "2023-12-31", slots: ["10:00 AM - 4:00 PM"], note: "New Year's Eve - Shorter Hours" },
]

export function AvailabilityManager() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [availability, setAvailability] = useState(defaultAvailability)
  const [timeOff, setTimeOff] = useState(defaultTimeOff)
  const [specialHours, setSpecialHours] = useState(defaultSpecialHours)

  const handleSaveAvailability = () => {
    // In a real app, this would save to the backend
    toast({
      title: "Availability updated",
      description: "Your weekly availability has been updated successfully.",
    })
  }

  const handleAddTimeOff = (newTimeOff: { startDate: string; endDate: string; reason: string }) => {
    const id = `to_${Date.now()}`
    setTimeOff([...timeOff, { id, ...newTimeOff }])
    toast({
      title: "Time off added",
      description: `Time off from ${newTimeOff.startDate} to ${newTimeOff.endDate} has been added.`,
    })
  }

  const handleRemoveTimeOff = (id: string) => {
    setTimeOff(timeOff.filter((item) => item.id !== id))
    toast({
      title: "Time off removed",
      description: "The time off period has been removed.",
    })
  }

  const handleAddSpecialHours = (newSpecialHours: { date: string; slots: string[]; note: string }) => {
    const id = `sh_${Date.now()}`
    setSpecialHours([...specialHours, { id, ...newSpecialHours }])
    toast({
      title: "Special hours added",
      description: `Special hours for ${newSpecialHours.date} have been added.`,
    })
  }

  const handleRemoveSpecialHours = (id: string) => {
    setSpecialHours(specialHours.filter((item) => item.id !== id))
    toast({
      title: "Special hours removed",
      description: "The special hours have been removed.",
    })
  }

  if (!user || (user.role !== "barber" && user.role !== "business")) {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You must be logged in as a barber or business owner to access this page.</p>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability Management</CardTitle>
        <CardDescription>Set your regular hours, time off, and special hours</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="weekly" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
            <TabsTrigger value="timeoff">Time Off</TabsTrigger>
            <TabsTrigger value="special">Special Hours</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            <WeeklySchedule
              availability={availability}
              setAvailability={setAvailability}
              onSave={handleSaveAvailability}
            />
          </TabsContent>

          <TabsContent value="timeoff">
            <TimeOffManager timeOff={timeOff} onAdd={handleAddTimeOff} onRemove={handleRemoveTimeOff} />
          </TabsContent>

          <TabsContent value="special">
            <SpecialHoursManager
              specialHours={specialHours}
              onAdd={handleAddSpecialHours}
              onRemove={handleRemoveSpecialHours}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
