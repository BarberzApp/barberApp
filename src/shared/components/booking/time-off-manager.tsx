"use client"

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Plus, Trash2, Umbrella, Calendar, Clock, Sparkles } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'

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
    if (!newTimeOff.start_date || !newTimeOff.end_date) {
      return
    }

    // Validate that end date is not before start date
    if (new Date(newTimeOff.end_date) < new Date(newTimeOff.start_date)) {
      return
    }

    onAdd(newTimeOff)
    setNewTimeOff({
      start_date: '',
      end_date: '',
      reason: ''
    })
  }

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    
    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
    
    return `${start.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })} - ${end.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })}`
  }

  const getDaysCount = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    return diffDays
  }

  const totalDays = timeOff.reduce((total, item) => total + getDaysCount(item.start_date, item.end_date), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-saffron/20 rounded-xl flex items-center justify-center">
          <Umbrella className="h-5 w-5 text-saffron" />
        </div>
        <div>
          <h3 className="text-xl font-bebas text-white">Time Off</h3>
          <p className="text-white/70 text-sm">Schedule your vacation and personal time off</p>
        </div>
      </div>

      {/* Stats Card */}
      <Card className="bg-white/5 border border-white/10 shadow-xl backdrop-blur-xl rounded-2xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-saffron/20 rounded-lg">
                <Calendar className="h-4 w-4 text-saffron" />
              </div>
              <div>
                <p className="text-white/60 text-sm">Time Off</p>
                <p className="text-white font-semibold text-lg">{timeOff.length} periods</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Badge variant="glassy-saffron" className="text-xs">
                {totalDays} total days
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
            Add Time Off
          </CardTitle>
          <CardDescription className="text-white/70">
            Schedule vacation, personal days, or sick leave
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-white/80 text-sm font-medium">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={newTimeOff.start_date}
                onChange={(e) => setNewTimeOff({ ...newTimeOff, start_date: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-saffron focus:ring-saffron rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date" className="text-white/80 text-sm font-medium">End Date</Label>
              <Input
                id="end_date"
                type="date"
                value={newTimeOff.end_date}
                onChange={(e) => setNewTimeOff({ ...newTimeOff, end_date: e.target.value })}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-saffron focus:ring-saffron rounded-xl"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-white/80 text-sm font-medium">Reason (optional)</Label>
            <Input
              id="reason"
              value={newTimeOff.reason}
              onChange={(e) => setNewTimeOff({ ...newTimeOff, reason: e.target.value })}
              placeholder="e.g. Vacation, Personal Day, Sick Leave"
              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-saffron focus:ring-saffron rounded-xl"
            />
          </div>

          <Button 
            onClick={handleAdd} 
            className="w-full bg-saffron hover:bg-saffron/90 text-primary font-semibold rounded-xl py-3 transition-all duration-200 hover:scale-105 active:scale-100 focus:ring-2 focus:ring-saffron focus:ring-offset-2 focus:ring-offset-darkpurple"
            disabled={!newTimeOff.start_date || !newTimeOff.end_date}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Time Off
          </Button>
        </CardContent>
      </Card>

      {/* Current Time Off */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h4 className="text-lg font-semibold text-white">Scheduled Time Off</h4>
          <Badge variant="outline" className="text-xs border-white/20 text-white/60">
            {timeOff.length} periods
          </Badge>
        </div>
        
        {timeOff.length === 0 ? (
          <Card className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
            <Calendar className="h-12 w-12 text-white/40 mx-auto mb-4" />
            <h3 className="text-white font-semibold mb-2">No time off scheduled</h3>
            <p className="text-white/60 text-sm">
              Add vacation, personal days, or sick leave periods
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {timeOff.map((item) => (
              <Card 
                key={item.id} 
                className="bg-white/5 border border-white/10 rounded-2xl hover:border-white/20 transition-all duration-200 overflow-hidden"
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-white">
                          {formatDateRange(item.start_date, item.end_date)}
                        </span>
                        <Badge variant="glassy-saffron" className="text-xs">
                          {getDaysCount(item.start_date, item.end_date)} day{getDaysCount(item.start_date, item.end_date) !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                      {item.reason && (
                        <p className="text-sm text-white/60">{item.reason}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onRemove(item.id)}
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
