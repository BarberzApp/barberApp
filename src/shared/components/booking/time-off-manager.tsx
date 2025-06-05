"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { Calendar, Trash2 } from "lucide-react"

interface TimeOff {
  id: string
  startDate: string
  endDate: string
  reason: string
}

interface TimeOffManagerProps {
  timeOff: TimeOff[]
  onAdd: (timeOff: Omit<TimeOff, "id">) => void
  onRemove: (id: string) => void
}

export function TimeOffManager({ timeOff, onAdd, onRemove }: TimeOffManagerProps) {
  const [newTimeOff, setNewTimeOff] = useState({
    startDate: "",
    endDate: "",
    reason: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewTimeOff((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(newTimeOff)
    setNewTimeOff({
      startDate: "",
      endDate: "",
      reason: "",
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 border rounded-md p-4">
        <h3 className="font-medium">Add Time Off</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startDate">Start Date</Label>
            <Input
              id="startDate"
              name="startDate"
              type="date"
              value={newTimeOff.startDate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="endDate">End Date</Label>
            <Input
              id="endDate"
              name="endDate"
              type="date"
              value={newTimeOff.endDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="reason">Reason (optional)</Label>
          <Textarea
            id="reason"
            name="reason"
            placeholder="Vacation, personal day, etc."
            value={newTimeOff.reason}
            onChange={handleChange}
          />
        </div>
        <Button type="submit">Add Time Off</Button>
      </form>

      <div className="space-y-4">
        <h3 className="font-medium">Scheduled Time Off</h3>
        {timeOff.length === 0 ? (
          <p className="text-sm text-muted-foreground">No time off scheduled.</p>
        ) : (
          <div className="space-y-4">
            {timeOff.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">
                          {item.startDate === item.endDate ? item.startDate : `${item.startDate} to ${item.endDate}`}
                        </p>
                        {item.reason && <p className="text-sm text-muted-foreground">{item.reason}</p>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onRemove(item.id)} className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
