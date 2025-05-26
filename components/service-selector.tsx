"use client"

import * as React from "react"
import { useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Clock, DollarSign } from "lucide-react"

interface Service {
  id: string
  name: string
  description: string
  price: number
  duration: number
}

interface ServiceSelectorProps {
  services: Service[]
  onSelectServices: (serviceIds: string[]) => void
}

export function ServiceSelector({ services, onSelectServices }: ServiceSelectorProps) {
  const [selectedServices, setSelectedServices] = React.useState<string[]>([])

  const toggleService = useCallback((serviceId: string) => {
    setSelectedServices((prev) => {
      if (prev.includes(serviceId)) {
        return prev.filter((id) => id !== serviceId)
      } else {
        return [...prev, serviceId]
      }
    })
  }, [])

  const handleServiceClick = useCallback((serviceId: string) => {
    toggleService(serviceId)
  }, [toggleService])

  const handleContinue = useCallback(() => {
    onSelectServices(selectedServices)
  }, [onSelectServices, selectedServices])

  const totalPrice = selectedServices.reduce((total, serviceId) => {
    const service = services.find((s) => s.id === serviceId)
    return total + (service?.price || 0)
  }, 0)

  const totalDuration = selectedServices.reduce((total, serviceId) => {
    const service = services.find((s) => s.id === serviceId)
    return total + (service?.duration || 0)
  }, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4">
        {services.map((service) => (
          <Card key={service.id} className={selectedServices.includes(service.id) ? "border-barber-500" : ""}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Checkbox
                  id={`service-${service.id}`}
                  checked={selectedServices.includes(service.id)}
                  onCheckedChange={() => handleServiceClick(service.id)}
                />
                <div className="flex-1">
                  <label htmlFor={`service-${service.id}`} className="text-base font-medium cursor-pointer">
                    {service.name}
                  </label>
                  <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>{service.duration} min</span>
                    </div>
                    <div className="flex items-center text-sm font-medium">
                      <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                      <span>${service.price}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedServices.length > 0 && (
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex justify-between mb-2">
            <span className="font-medium">Total Duration:</span>
            <span>{totalDuration} minutes</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Total Price:</span>
            <span className="font-bold">${totalPrice}</span>
          </div>
        </div>
      )}

      <Button
        className="w-full"
        disabled={selectedServices.length === 0}
        onClick={handleContinue}
      >
        {selectedServices.length === 0
          ? "Select at least one service"
          : `Continue with ${selectedServices.length} service${selectedServices.length > 1 ? "s" : ""}`}
      </Button>
    </div>
  )
}
