"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'

interface SpecialHours {
  id: string
  date: string
  startTime: string
  endTime: string
  reason: string
}

interface SpecialHoursManagerProps {
  specialHours: SpecialHours[]
  onAdd: (hours: SpecialHours) => void
  onRemove: (id: string) => void
}

export function SpecialHoursManager({ specialHours, onAdd, onRemove }: SpecialHoursManagerProps) {
  const [newHours, setNewHours] = useState<Omit<SpecialHours, 'id'>>({
    date: '',
    startTime: '',
    endTime: '',
    reason: ''
  })

  const handleAdd = () => {
    if (!newHours.date || !newHours.startTime || !newHours.endTime) return
    onAdd({ ...newHours, id: Date.now().toString() })
    setNewHours({
      date: '',
      startTime: '',
      endTime: '',
      reason: ''
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Special Hours</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={newHours.date}
                onChange={(e) => setNewHours({ ...newHours, date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Input
                id="reason"
                value={newHours.reason}
                onChange={(e) => setNewHours({ ...newHours, reason: e.target.value })}
                placeholder="e.g. Holiday Hours"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={newHours.startTime}
                onChange={(e) => setNewHours({ ...newHours, startTime: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={newHours.endTime}
                onChange={(e) => setNewHours({ ...newHours, endTime: e.target.value })}
              />
            </div>
          </div>
          <Button onClick={handleAdd} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Special Hours
          </Button>
        </div>

        <div className="space-y-2">
          {specialHours.length === 0 ? (
            <p className="text-sm text-muted-foreground">No special hours added yet.</p>
          ) : (
            specialHours.map((hours) => (
              <div key={hours.id} className="flex items-center justify-between p-2 border rounded-md">
                <div>
                  <p className="font-medium">{new Date(hours.date).toLocaleDateString()}</p>
                  <p className="text-sm text-muted-foreground">
                    {hours.startTime} - {hours.endTime}
                  </p>
                  {hours.reason && (
                    <p className="text-sm text-muted-foreground">{hours.reason}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(hours.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
