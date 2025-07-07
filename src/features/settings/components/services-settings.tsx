import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/shared/lib/supabase'
import { useToast } from '@/shared/components/ui/use-toast'
import { useAuth } from '@/shared/hooks/use-auth-zustand'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Loader2, Plus, Edit, Trash2, Scissors, AlertCircle, CheckCircle, Sparkles, Clock, DollarSign } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'

interface Service {
  id?: string
  name: string
  duration: number // in minutes
  price: number
  description?: string
  barber_id: string
}

interface ServiceFormData {
  name: string
  price: number
  duration: number
  description: string
}

interface ServicesSettingsProps {
  onUpdate?: () => void
}

export function ServicesSettings({ onUpdate }: ServicesSettingsProps) {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [barberId, setBarberId] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({})
  const { toast } = useToast()
  const { user } = useAuth()
  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<ServiceFormData>()

  // Load barber ID and services
  useEffect(() => {
    if (user) {
      loadBarberId()
    }
  }, [user])

  const loadBarberId = async () => {
    try {
      const { data, error } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', user?.id)
        .single()

      if (error) throw error
      if (data) {
        setBarberId(data.id)
        loadServices(data.id)
      }
    } catch (error) {
      console.error('Error loading barber ID:', error)
      toast({
        title: 'Error',
        description: 'Failed to load barber information. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const loadServices = async (barberId: string) => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('barber_id', barberId)
        .order('name')

      if (error) throw error
      if (data) setServices(data)
    } catch (error) {
      console.error('Error loading services:', error)
      toast({
        title: 'Error',
        description: 'Failed to load services. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const validateForm = (data: ServiceFormData): boolean => {
    const errors: {[key: string]: string} = {}
    
    if (!data.name?.trim()) errors.name = 'Service name is required'
    if (!data.duration || data.duration < 1) errors.duration = 'Duration must be at least 1 minute'
    if (!data.price || data.price < 0) errors.price = 'Price must be at least $0'
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Add or update service
  const onSubmit = async (data: ServiceFormData) => {
    if (!barberId) {
      toast({
        title: 'Error',
        description: 'Barber information not found. Please try again.',
        variant: 'destructive',
      })
      return
    }

    // Validate form
    if (!validateForm(data)) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before saving.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsLoading(true)
      if (editingService) {
        // Update existing service
        const { error: updateError } = await supabase
          .from('services')
          .update({
            name: data.name,
            price: data.price,
            duration: data.duration,
            description: data.description,
          })
          .eq('id', editingService.id)

        if (updateError) {
          console.error('Error updating service:', updateError)
          toast({
            title: 'Error',
            description: 'Failed to update service. Please try again.',
            variant: 'destructive',
          })
          return
        }
        toast({
          title: 'Success',
          description: 'Service updated successfully',
        })
      } else {
        // Add new service
        const { error: insertError } = await supabase
          .from('services')
          .insert({
            barber_id: barberId,
            name: data.name,
            price: data.price,
            duration: data.duration,
            description: data.description,
          })

        if (insertError) {
          console.error('Error creating service:', insertError)
          toast({
            title: 'Error',
            description: 'Failed to create service. Please try again.',
            variant: 'destructive',
          })
          return
        }
        toast({
          title: 'Success',
          description: 'Service added successfully',
        })
      }
      
      await loadServices(barberId)
      reset()
      setEditingService(null)
      
      // Call onUpdate to refresh settings data
      onUpdate?.()
    } catch (error) {
      console.error('Error saving service:', error)
      toast({
        title: 'Error',
        description: 'Failed to save service. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Delete service
  const deleteService = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      setIsLoading(true)
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Service deleted successfully',
      })
      
      await loadServices(barberId!)
      onUpdate?.()
    } catch (error) {
      console.error('Error deleting service:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete service. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const editService = (service: Service) => {
    setEditingService(service)
    setValue('name', service.name)
    setValue('price', service.price)
    setValue('duration', service.duration)
    setValue('description', service.description || '')
  }

  const cancelEdit = () => {
    setEditingService(null)
    reset()
    setValidationErrors({})
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`.trim()
    }
    return `${mins}m`
  }

  if (isLoading && services.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-saffron/20 rounded-full">
              <Scissors className="h-6 w-6 text-saffron" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bebas text-white tracking-wide">
                Services
              </h3>
              <p className="text-white/80 mt-1">Manage your service offerings</p>
            </div>
          </div>
        </div>
        
        <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl backdrop-blur-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-center min-h-[200px]">
              <div className="text-center space-y-4">
                <div className="relative">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-saffron" />
                  <div className="absolute inset-0 rounded-full bg-saffron/20 animate-ping" />
                </div>
                <p className="text-white/60 font-medium">Loading services...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 bg-saffron/20 rounded-full">
            <Scissors className="h-6 w-6 text-saffron" />
          </div>
          <div>
            <h3 className="text-xl sm:text-2xl font-bebas text-white tracking-wide">
              Services
            </h3>
            <p className="text-white/80 mt-1">Manage your service offerings</p>
          </div>
        </div>
      </div>

      {/* Add Service Form */}
      <Card className="bg-darkpurple/90 border border-white/10 shadow-2xl backdrop-blur-xl">
        <CardHeader className="bg-white/5 border-b border-white/10">
          <CardTitle className="text-white flex items-center gap-2">
            {editingService ? (
              <>
                <Edit className="h-5 w-5 text-saffron" />
                Edit Service
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 text-saffron" />
                Add New Service
              </>
            )}
          </CardTitle>
          <CardDescription className="text-white/70">
            {editingService ? 'Update your service details' : 'Add a new service to your offerings'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white font-medium">Service Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  className="bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron"
                  placeholder="e.g., Haircut, Beard Trim"
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-400">{validationErrors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price" className="text-white font-medium">Price ($) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('price', { valueAsNumber: true })}
                  className="bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron"
                  placeholder="25.00"
                />
                {validationErrors.price && (
                  <p className="text-sm text-red-400">{validationErrors.price}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration" className="text-white font-medium">Duration (minutes) *</Label>
                <Input
                  id="duration"
                  type="number"
                  min="1"
                  {...register('duration', { valueAsNumber: true })}
                  className="bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron"
                  placeholder="30"
                />
                {validationErrors.duration && (
                  <p className="text-sm text-red-400">{validationErrors.duration}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description" className="text-white font-medium">Description</Label>
                <Input
                  id="description"
                  {...register('description')}
                  className="bg-white/10 border border-white/20 text-white placeholder:text-white/40 focus:border-saffron"
                  placeholder="Brief description of the service"
                />
              </div>
            </div>
            
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-saffron hover:bg-saffron/90 text-primary font-semibold shadow-lg"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                {editingService ? 'Update Service' : 'Add Service'}
              </Button>
              
              {editingService && (
                <Button
                  type="button"
                  onClick={cancelEdit}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Services List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-white">Your Services</h4>
          <Badge variant="glassy-saffron" className="text-xs">
            {services.length} {services.length === 1 ? 'Service' : 'Services'}
          </Badge>
        </div>
        
        {services.length === 0 ? (
          <Card className="bg-white/5 border border-white/10 shadow-xl backdrop-blur-xl">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-3 bg-saffron/20 rounded-full">
                  <Sparkles className="h-6 w-6 text-saffron" />
                </div>
                <div>
                  <h5 className="text-lg font-semibold text-white">No Services Yet</h5>
                  <p className="text-white/60 text-sm">Add your first service to start accepting bookings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {services.map((service) => (
              <Card key={service.id} className="bg-white/5 border border-white/10 shadow-xl backdrop-blur-xl hover:shadow-2xl transition-all duration-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h5 className="font-semibold text-white">{service.name}</h5>
                        <Badge variant="glassy-saffron" className="text-xs">
                          ${service.price}
                        </Badge>
                        <div className="flex items-center gap-1 text-white/60 text-sm">
                          <Clock className="h-3 w-3" />
                          {formatDuration(service.duration)}
                        </div>
                      </div>
                      {service.description && (
                        <p className="text-sm text-white/70">{service.description}</p>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => editService(service)}
                        className="text-white/70 hover:text-white hover:bg-white/10"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteService(service.id!)}
                        disabled={isLoading}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Tips Section */}
      <Card className="bg-gradient-to-br from-saffron/10 to-transparent border border-saffron/20 shadow-xl backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-saffron/20 rounded-full">
              <Sparkles className="h-4 w-4 text-saffron" />
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-white">Pro Tips</h4>
              <ul className="text-xs text-white/70 space-y-1">
                <li>• Set competitive prices based on your location and experience</li>
                <li>• Be accurate with duration estimates to avoid scheduling conflicts</li>
                <li>• Add detailed descriptions to help clients understand your services</li>
                <li>• Consider offering package deals for multiple services</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 