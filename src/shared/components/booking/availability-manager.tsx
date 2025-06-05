"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { useToast } from "@/shared/components/ui/use-toast"
import { WeeklySchedule, WeeklyAvailabilityType } from "@/shared/components/booking/weekly-schedule"
import { TimeOffManager } from "@/shared/components/booking/time-off-manager"
import { SpecialHoursManager } from "@/shared/components/booking/special-hours-manager"
import { AvailabilityCalendar } from "@/shared/components/booking/availability-calendar"

interface TimeOff {
  id: string
  startDate: string
  endDate: string
  reason: string
}

interface SpecialHours {
  id: string
  date: string
  slots: string[]
  note: string
}

interface AvailabilityManagerProps {
  barberId: string
}

export function AvailabilityManager({ barberId }: AvailabilityManagerProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("schedule")
  const [specialHours, setSpecialHours] = useState<SpecialHours[]>([])
  const [timeOff, setTimeOff] = useState<TimeOff[]>([])
  const [availability, setAvailability] = useState<WeeklyAvailabilityType>({
    monday: { isAvailable: true, slots: [] },
    tuesday: { isAvailable: true, slots: [] },
    wednesday: { isAvailable: true, slots: [] },
    thursday: { isAvailable: true, slots: [] },
    friday: { isAvailable: true, slots: [] },
    saturday: { isAvailable: true, slots: [] },
    sunday: { isAvailable: false, slots: [] }
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Availability Management</CardTitle>
        <CardDescription>
          Manage your working hours, time off, and special hours
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="schedule">Weekly Schedule</TabsTrigger>
            <TabsTrigger value="time-off">Time Off</TabsTrigger>
            <TabsTrigger value="special-hours">Special Hours</TabsTrigger>
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule">
            <WeeklySchedule 
              availability={availability}
              setAvailability={setAvailability}
              onSave={() => toast({ title: "Schedule saved" })}
            />
          </TabsContent>

          <TabsContent value="time-off">
            <TimeOffManager 
              timeOff={timeOff}
              onAdd={(item) => setTimeOff([...timeOff, { ...item, id: Date.now().toString() }])}
              onRemove={(id) => setTimeOff(timeOff.filter(t => t.id !== id))}
            />
          </TabsContent>

          <TabsContent value="special-hours">
            <SpecialHoursManager 
              specialHours={specialHours}
              onAdd={(item) => setSpecialHours([...specialHours, { ...item, id: Date.now().toString() }])}
              onRemove={(id) => setSpecialHours(specialHours.filter(s => s.id !== id))}
            />
          </TabsContent>

          <TabsContent value="calendar">
            <AvailabilityCalendar barberId={barberId} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}