"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/shared/components/ui/button"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Textarea } from "@/shared/components/ui/textarea"
import { Calendar, Plus, Trash2 } from "lucide-react"

interface SpecialHours {
  id: string
  date: string
  slots: string[]
  note: string
}

interface SpecialHoursManagerProps {
  specialHours: SpecialHours[]
  onAdd: (specialHours: Omit<SpecialHours, "id">) => void
  onRemove: (id: string) => void
}

export function SpecialHoursManager({ specialHours, onAdd, onRemove }: SpecialHoursManagerProps) {
  const [newSpecialHours, setNewSpecialHours] = useState({
    date: "",
    slots: ["9:00 AM - 5:00 PM"],
    note: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewSpecialHours((prev) => ({ ...prev, [name]: value }))
  }

  const handleSlotChange = (index: number, value: string) => {
    setNewSpecialHours((prev) => {
      const newSlots = [...prev.slots]
      newSlots[index] = value
      return { ...prev, slots: newSlots }
    })
  }

  const handleAddSlot = () => {
    setNewSpecialHours((prev) => ({
      ...prev,
      slots: [...prev.slots, "9:00 AM - 5:00 PM"],
    }))
  }

  const handleRemoveSlot = (index: number) => {
    setNewSpecialHours((prev) => ({
      ...prev,
      slots: prev.slots.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(newSpecialHours)
    setNewSpecialHours({
      date: "",
      slots: ["9:00 AM - 5:00 PM"],
      note: "",
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 border rounded-md p-4">
        <h3 className="font-medium">Add Special Hours</h3>
        <div className="space-y-2">
          <Label htmlFor="date">Date</Label>
          <Input id="date" name="date" type="date" value={newSpecialHours.date} onChange={handleChange} required />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-2">
            <Label>Time Slots</Label>
            <Button type="button" variant="outline" size="sm" onClick={handleAddSlot}>
              <Plus className="h-4 w-4 mr-1" />
              Add Slot
            </Button>
          </div>
          {newSpecialHours.slots.map((slot, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={slot}
                onChange={(e) => handleSlotChange(index, e.target.value)}
                placeholder="e.g. 9:00 AM - 5:00 PM"
                className="flex-1"
              />
              {newSpecialHours.slots.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveSlot(index)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <Label htmlFor="note">Note (optional)</Label>
          <Textarea
            id="note"
            name="note"
            placeholder="Holiday hours, special event, etc."
            value={newSpecialHours.note}
            onChange={handleChange}
          />
        </div>
        <Button type="submit">Add Special Hours</Button>
      </form>

      <div className="space-y-4">
        <h3 className="font-medium">Scheduled Special Hours</h3>
        {specialHours.length === 0 ? (
          <p className="text-sm text-muted-foreground">No special hours scheduled.</p>
        ) : (
          <div className="space-y-4">
            {specialHours.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{item.date}</p>
                        <div className="text-sm">
                          {item.slots.map((slot, index) => (
                            <p key={index}>{slot}</p>
                          ))}
                        </div>
                        {item.note && <p className="text-sm text-muted-foreground mt-1">{item.note}</p>}
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
