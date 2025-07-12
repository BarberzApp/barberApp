import { useState, useEffect } from 'react'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Package, DollarSign, Plus } from 'lucide-react'
import { ServiceAddon } from '@/shared/types/addon'
import { AddonService } from '@/shared/lib/addon-service'

interface AddonSelectorProps {
  barberId: string
  selectedAddonIds: string[]
  onAddonChange: (addonIds: string[]) => void
  className?: string
}

export function AddonSelector({ 
  barberId, 
  selectedAddonIds, 
  onAddonChange, 
  className = "" 
}: AddonSelectorProps) {
  const [addons, setAddons] = useState<ServiceAddon[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAddons()
  }, [barberId])

  const loadAddons = async () => {
    try {
      setLoading(true)
      const barberAddons = await AddonService.getBarberAddons(barberId)
      setAddons(barberAddons)
    } catch (error) {
      console.error('Error loading add-ons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddonToggle = (addonId: string, checked: boolean) => {
    if (checked) {
      onAddonChange([...selectedAddonIds, addonId])
    } else {
      onAddonChange(selectedAddonIds.filter(id => id !== addonId))
    }
  }

  const getSelectedAddons = () => {
    return addons.filter(addon => selectedAddonIds.includes(addon.id))
  }

  const getTotalAddonCost = () => {
    return getSelectedAddons().reduce((total, addon) => total + addon.price, 0)
  }

  if (loading) {
    return (
      <Card className={`bg-white/5 border border-white/10 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-saffron"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (addons.length === 0) {
    return null // Don't show anything if no add-ons available
  }

  return (
    <Card className={`bg-white/5 border border-white/10 ${className}`}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-saffron/20 rounded-lg">
            <Package className="h-4 w-4 text-saffron" />
          </div>
          <CardTitle className="text-lg font-semibold text-white">
            Additional Services
          </CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {addons.map((addon) => (
            <div
              key={addon.id}
              className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
            >
              <Checkbox
                id={addon.id}
                checked={selectedAddonIds.includes(addon.id)}
                onCheckedChange={(checked) => handleAddonToggle(addon.id, checked as boolean)}
                className="mt-1"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor={addon.id}
                    className="font-medium text-white cursor-pointer flex-1"
                  >
                    {addon.name}
                  </label>
                  <div className="flex items-center gap-1 text-saffron font-semibold">
                    <Plus className="h-3 w-3" />
                    <DollarSign className="h-3 w-3" />
                    <span>{addon.price.toFixed(2)}</span>
                  </div>
                </div>
                
                {addon.description && (
                  <p className="text-white/60 text-sm">{addon.description}</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {selectedAddonIds.length > 0 && (
          <div className="pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-saffron" />
                <span className="text-white font-medium">Selected Add-ons:</span>
                <Badge variant="outline" className="border-saffron/20 text-saffron">
                  {selectedAddonIds.length}
                </Badge>
              </div>
              <div className="flex items-center gap-1 text-saffron font-semibold text-lg">
                <DollarSign className="h-4 w-4" />
                <span>+{getTotalAddonCost().toFixed(2)}</span>
              </div>
            </div>
            
            <div className="mt-2 space-y-1">
              {getSelectedAddons().map((addon) => (
                <div key={addon.id} className="flex items-center justify-between text-sm">
                  <span className="text-white/70">{addon.name}</span>
                  <span className="text-saffron">+${addon.price.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 