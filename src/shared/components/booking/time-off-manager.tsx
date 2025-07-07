"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'

interface TimeOff {
  id: string
  start_date: string
  end_date: string
  reason: string
}

interface TimeOffManagerProps {
  timeOff: TimeOff[]
  onAdd: (timeOff: Omit<TimeOff, 'id'>) => void
  onRemove: (id: string) => void
}

export function TimeOffManager({ timeOff, onAdd, onRemove }: TimeOffManagerProps) {
  const [newTimeOff, setNewTimeOff] = useState<Omit<TimeOff, 'id'>>({
    start_date: '',
    end_date: '',
    reason: ''
  })

  const handleAdd = () => {
    if (!newTimeOff.start_date || !newTimeOff.end_date) return
    onAdd(newTimeOff)
    setNewTimeOff({
      start_date: '',
      end_date: '',
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
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={newTimeOff.start_date}
                onChange={(e) => setNewTimeOff({ ...newTimeOff, start_date: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={newTimeOff.end_date}
                onChange={(e) => setNewTimeOff({ ...newTimeOff, end_date: e.target.value })}
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
                    {new Date(item.start_date).toLocaleDateString()} - {new Date(item.end_date).toLocaleDateString()}
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
