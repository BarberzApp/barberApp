"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'

interface TimeOff {
  id: string
  startDate: string
  endDate: string
  reason: string
}

interface TimeOffManagerProps {
  timeOff: TimeOff[]
  onAdd: (timeOff: TimeOff) => void
  onRemove: (id: string) => void
}

export function TimeOffManager({ timeOff, onAdd, onRemove }: TimeOffManagerProps) {
  const [newTimeOff, setNewTimeOff] = useState<Omit<TimeOff, 'id'>>({
    startDate: '',
    endDate: '',
    reason: ''
  })

  const handleAdd = () => {
    if (!newTimeOff.startDate || !newTimeOff.endDate) return
    onAdd({ ...newTimeOff, id: Date.now().toString() })
    setNewTimeOff({
      startDate: '',
      endDate: '',
      reason: ''
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Time Off</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={newTimeOff.startDate}
                onChange={(e) => setNewTimeOff({ ...newTimeOff, startDate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={newTimeOff.endDate}
                onChange={(e) => setNewTimeOff({ ...newTimeOff, endDate: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Reason (optional)</Label>
            <Input
              id="reason"
              value={newTimeOff.reason}
              onChange={(e) => setNewTimeOff({ ...newTimeOff, reason: e.target.value })}
              placeholder="e.g. Vacation, Personal Day"
            />
          </div>
          <Button onClick={handleAdd} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Time Off
          </Button>
        </div>

        <div className="space-y-2">
          {timeOff.length === 0 ? (
            <p className="text-sm text-muted-foreground">No time off scheduled.</p>
          ) : (
            timeOff.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-2 border rounded-md">
                <div>
                  <p className="font-medium">
                    {new Date(item.startDate).toLocaleDateString()} - {new Date(item.endDate).toLocaleDateString()}
                  </p>
                  {item.reason && (
                    <p className="text-sm text-muted-foreground">{item.reason}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(item.id)}
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
