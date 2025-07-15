"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import { Plus, Trash2, Calendar, Clock, AlertCircle, Sparkles } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase'
import { useToast } from '@/shared/components/ui/use-toast'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'

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
  const [newHours, setNewHours] = useState<Omit<SpecialHours, 'id' | 'barber_id' | 'created_at' | 'updated_at'>>({
    date: '',
    start_time: '09:00',
    end_time: '17:00',
    is_closed: false,
    reason: ''
  })

  // Removed onboarding check and barberRecordId logic

  const handleAdd = () => {
    if (!newHours.date) {
      toast({
        title: 'Error',
        description: 'Please select a date',
        variant: 'destructive',
      })
      return
    }

    if (!newHours.is_closed && (!newHours.start_time || !newHours.end_time)) {
      toast({
        title: 'Error',
        description: 'Please set both start and end times',
        variant: 'destructive',
      })
      return
    }

    if (!newHours.is_closed && newHours.start_time >= newHours.end_time) {
      toast({
        title: 'Error',
        description: 'End time must be after start time',
        variant: 'destructive',
      })
      return
    }

    // Check for duplicate dates
    const existingDate = specialHours.find(hours => hours.date === newHours.date)
    if (existingDate) {
      toast({
        title: 'Error',
        description: 'Special hours already exist for this date',
        variant: 'destructive',
      })
      return
    }

    onAdd(newHours)
    setNewHours({
      date: '',
      start_time: '09:00',
      end_time: '17:00',
      is_closed: false,
      reason: ''
    })
  }

  // Always show the UI, no onboarding check
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-saffron/20 rounded-xl flex items-center justify-center">
          <Calendar className="h-5 w-5 text-saffron" />
        </div>
        <div>
          <h3 className="text-xl font-bebas text-white">Special Hours</h3>
          <p className="text-white/70 text-sm">Set special hours for specific dates</p>
        </div>
      </div>

      {/* Stats Card */}
      <Card className="bg-white/5 border border-white/10 shadow-xl backdrop-blur-xl rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-saffron/20 rounded-lg">
                <Clock className="h-4 w-4 text-saffron" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Special Hours</p>
                <p className="text-white font-semibold text-lg">{specialHours.length} dates</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="glassy-saffron" className="text-xs">
                {specialHours.filter(h => !h.is_closed).length} Modified
              </Badge>
              <Badge variant="outline" className="text-xs border-red-500/30 text-red-400">
                {specialHours.filter(h => h.is_closed).length} Closed
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add Form */}
      <Card className="bg-white/5 border border-white/10 shadow-2xl backdrop-blur-xl rounded-3xl">
        <CardHeader className="bg-white/5 border-b border-white/10">
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="h-5 w-5 text-saffron" />
            Add Special Hours
          </CardTitle>
          <CardDescription className="text-white/70">
            Override your regular schedule for holidays, events, or modified hours
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-white/80 text-sm font-medium">Date</Label>
              <Input
                id="date"
                type="date"
                value={newHours.date}
                onChange={(e) => setNewHours({ ...newHours, date: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-saffron focus:ring-saffron rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-white/80 text-sm font-medium">Reason</Label>
              <Input
                id="reason"
                value={newHours.reason}
                onChange={(e) => setNewHours({ ...newHours, reason: e.target.value })}
                placeholder="e.g. Holiday Hours, Special Event"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-saffron focus:ring-saffron rounded-xl"
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 bg-white/5 rounded-xl border border-white/10">
            <Switch
              checked={newHours.is_closed}
              onCheckedChange={(checked) => setNewHours({ ...newHours, is_closed: checked })}
              className="data-[state=checked]:bg-saffron"
            />
            <Label className="text-white/80 font-medium">Closed on this date</Label>
          </div>

          {!newHours.is_closed && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time" className="text-white/80 text-sm font-medium">Start Time</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={newHours.start_time}
                  onChange={(e) => setNewHours({ ...newHours, start_time: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-saffron focus:ring-saffron rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time" className="text-white/80 text-sm font-medium">End Time</Label>
                <Input
                  id="end_time"
                  type="time"
                  value={newHours.end_time}
                  onChange={(e) => setNewHours({ ...newHours, end_time: e.target.value })}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-saffron focus:ring-saffron rounded-xl"
                />
              </div>
            </div>
          )}

          <Button 
            onClick={handleAdd} 
            className="w-full bg-saffron hover:bg-saffron/90 text-primary font-semibold rounded-xl py-3 transition-all duration-200 hover:scale-105 active:scale-100 focus:ring-2 focus:ring-saffron focus:ring-offset-2 focus:ring-offset-darkpurple"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Special Hours
          </Button>
        </CardContent>
      </Card>

      {/* Current Special Hours */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h4 className="text-lg font-semibold text-white">Current Special Hours</h4>
          <Badge variant="outline" className="text-xs border-white/20 text-white/60">
            {specialHours.length} total
          </Badge>
        </div>
        
        {specialHours.length === 0 ? (
          <Card className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <Clock className="h-12 w-12 text-white/40 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No special hours added yet</h3>
            <p className="text-white/60 text-sm">
              Add special hours for holidays, events, or modified schedules
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {specialHours.map((hours) => (
              <Card 
                key={hours.id} 
                className="bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all duration-200 overflow-hidden"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-white">
                          {new Date(hours.date).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                        {hours.is_closed ? (
                          <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                            Closed
                          </Badge>
                        ) : (
                          <Badge variant="glassy-saffron" className="text-xs">
                            Modified Hours
                          </Badge>
                        )}
                      </div>
                      {hours.is_closed ? (
                        <p className="text-sm text-red-400 font-medium">Closed for the day</p>
                      ) : (
                        <p className="text-sm text-white/70">
                          {hours.start_time} - {hours.end_time}
                        </p>
                      )}
                      {hours.reason && (
                        <p className="text-sm text-white/60 mt-1">{hours.reason}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(hours.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
                    >
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
