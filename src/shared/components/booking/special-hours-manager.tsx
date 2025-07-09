"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Switch } from '@/shared/components/ui/switch'
import { Plus, Trash2, Calendar, Clock, AlertCircle } from 'lucide-react'
import { supabase } from '@/shared/lib/supabase'
import { useToast } from '@/shared/components/ui/use-toast'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'

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

      {/* Add Form */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
        <h4 className="text-lg font-semibold text-white">Add Special Hours</h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-white/80 text-sm">Date</Label>
            <Input
              id="date"
              type="date"
              value={newHours.date}
              onChange={(e) => setNewHours({ ...newHours, date: e.target.value })}
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-saffron focus:ring-saffron"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-white/80 text-sm">Reason</Label>
            <Input
              id="reason"
              value={newHours.reason}
              onChange={(e) => setNewHours({ ...newHours, reason: e.target.value })}
              placeholder="e.g. Holiday Hours, Special Event"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-saffron focus:ring-saffron"
            />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Switch
            checked={newHours.is_closed}
            onCheckedChange={(checked) => setNewHours({ ...newHours, is_closed: checked })}
            className="data-[state=checked]:bg-saffron"
          />
          <Label className="text-white/80">Closed on this date</Label>
        </div>

        {!newHours.is_closed && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time" className="text-white/80 text-sm">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={newHours.start_time}
                onChange={(e) => setNewHours({ ...newHours, start_time: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-saffron focus:ring-saffron"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time" className="text-white/80 text-sm">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={newHours.end_time}
                onChange={(e) => setNewHours({ ...newHours, end_time: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-saffron focus:ring-saffron"
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
      </div>

      {/* Current Special Hours */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white">Current Special Hours</h4>
        
        {specialHours.length === 0 ? (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <Clock className="h-8 w-8 text-white/40 mx-auto mb-2" />
            <p className="text-white/60">No special hours added yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {specialHours.map((hours) => (
              <div 
                key={hours.id} 
                className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all duration-200"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white">
                      {new Date(hours.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                    {hours.is_closed && (
                      <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded-full">Closed</span>
                    )}
                  </div>
                  {hours.is_closed ? (
                    <p className="text-sm text-red-400">Closed for the day</p>
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
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
