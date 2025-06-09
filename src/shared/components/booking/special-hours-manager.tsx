"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Plus, Trash2 } from 'lucide-react'
import { Switch } from '@/shared/components/ui/switch'
import { useToast } from '@/shared/components/ui/use-toast'
import { supabase } from '@/shared/lib/supabase'

interface SpecialHours {
  id: string
  barber_id: string
  date: string
  start_time: string
  end_time: string
  is_closed: boolean
  reason: string
  created_at: string
  updated_at: string
}

interface SpecialHoursManagerProps {
  specialHours: SpecialHours[]
  onAdd: (hours: Omit<SpecialHours, 'id' | 'barber_id' | 'created_at' | 'updated_at'>) => void
  onRemove: (id: string) => void
  barberId: string
}

export function SpecialHoursManager({ specialHours, onAdd, onRemove, barberId }: SpecialHoursManagerProps) {
  const { toast } = useToast()
  const [barberRecordId, setBarberRecordId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [newHours, setNewHours] = useState<Omit<SpecialHours, 'id' | 'barber_id' | 'created_at' | 'updated_at'>>({
    date: '',
    start_time: '',
    end_time: '',
    is_closed: false,
    reason: ''
  })

  useEffect(() => {
    const fetchBarberRecord = async () => {
      if (!barberId) {
        toast({
          title: "Error",
          description: "Barber ID is required",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        const { data, error } = await supabase
          .from('barbers')
          .select('id')
          .eq('user_id', barberId)
          .single()

        if (error) throw error
        if (data) {
          setBarberRecordId(data.id)
        } else {
          toast({
            title: "Error",
            description: "Barber not found",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Error fetching barber record:', error)
        toast({
          title: "Error",
          description: "Failed to load barber information",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchBarberRecord()
  }, [barberId, toast])

  const handleAdd = async () => {
    if (!barberRecordId) {
      toast({
        title: "Error",
        description: "Barber information not loaded",
        variant: "destructive",
      })
      return
    }

    if (!newHours.date) {
      toast({
        title: "Error",
        description: "Please select a date",
        variant: "destructive",
      })
      return
    }

    if (!newHours.is_closed && (!newHours.start_time || !newHours.end_time)) {
      toast({
        title: "Error",
        description: "Please provide both start and end times",
        variant: "destructive",
      })
      return
    }

    try {
      const specialHoursData = {
        barber_id: barberRecordId,
        date: newHours.date,
        start_time: newHours.is_closed ? null : newHours.start_time,
        end_time: newHours.is_closed ? null : newHours.end_time,
        is_closed: newHours.is_closed,
        reason: newHours.reason || null
      }

      const { error } = await supabase
        .from('special_hours')
        .insert(specialHoursData)

      if (error) throw error

      onAdd(newHours)
      setNewHours({
        date: '',
        start_time: '',
        end_time: '',
        is_closed: false,
        reason: ''
      })
    } catch (error) {
      console.error('Error adding special hours:', error)
      toast({
        title: "Error",
        description: "Failed to add special hours",
        variant: "destructive",
      })
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Special Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    )
  }

  if (!barberRecordId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Special Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Unable to load barber information</p>
        </CardContent>
      </Card>
    )
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
          <div className="flex items-center space-x-2">
            <Switch
              checked={newHours.is_closed}
              onCheckedChange={(checked) => setNewHours({ ...newHours, is_closed: checked })}
            />
            <Label>Closed</Label>
          </div>
          {!newHours.is_closed && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={newHours.start_time}
                  onChange={(e) => setNewHours({ ...newHours, start_time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={newHours.end_time}
                  onChange={(e) => setNewHours({ ...newHours, end_time: e.target.value })}
                />
              </div>
            </div>
          )}
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
                  {hours.is_closed ? (
                    <p className="text-sm text-destructive">Closed</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {hours.start_time} - {hours.end_time}
                    </p>
                  )}
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
