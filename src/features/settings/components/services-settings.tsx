import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { supabase } from '@/shared/lib/supabase'
import { useToast } from '@/shared/components/ui/use-toast'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Loader2, Plus, Edit, Trash2, Scissors, AlertCircle, CheckCircle } from 'lucide-react'

interface Service {
  id?: string
  name: string
  duration: number // in minutes
  price: number
  barber_id: string
}

interface ServiceFormData {
  name: string
  duration: number
  price: number
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
        const { error } = await supabase
          .from('services')
          .update(data)
          .eq('id', editingService.id)
          .eq('barber_id', barberId)

        if (error) throw error
        toast({
          title: 'Success',
          description: 'Service updated successfully',
        })
      } else {
        // Add new service
        const { error } = await supabase
          .from('services')
          .insert([{ ...data, barber_id: barberId }])

        if (error) throw error
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
  const deleteService = async (id: string) => {
    if (!barberId) {
      toast({
        title: 'Error',
        description: 'Barber information not found. Please try again.',
        variant: 'destructive',
      })
      return
    }

    try {
      setIsLoading(true)
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id)
        .eq('barber_id', barberId)

      if (error) throw error
      
      await loadServices(barberId)
      toast({
        title: 'Success',
        description: 'Service deleted successfully',
      })
      
      // Call onUpdate to refresh settings data
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

  // Edit service
  const editService = (service: Service) => {
    setEditingService(service)
    setValue('name', service.name)
    setValue('duration', service.duration)
    setValue('price', service.price)
  }

  // Cancel editing
  const cancelEdit = () => {
    setEditingService(null)
    reset()
    setValidationErrors({})
  }

  if (!barberId) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium leading-6 text-foreground">Services</h3>
        <p className="mt-1 text-sm text-muted-foreground">Manage your services and pricing.</p>
      </div>

      {/* Services Status */}
      {services.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            You haven't added any services yet. Add your first service to start accepting bookings.
          </AlertDescription>
        </Alert>
      )}

      {services.length > 0 && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            You have {services.length} service{services.length !== 1 ? 's' : ''} configured.
          </AlertDescription>
        </Alert>
      )}

      {/* Add/Edit Service Form */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-foreground">
                  Service Name *
                </Label>
                <Input
                  type="text"
                  id="name"
                  className={validationErrors.name ? 'border-red-500' : ''}
                  {...register('name', { required: 'Service name is required' })}
                  placeholder="e.g., Haircut"
                />
                {validationErrors.name && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.name}</p>
                )}
                {errors.name && (
                  <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="duration" className="block text-sm font-medium text-foreground">
                  Duration (minutes) *
                </Label>
                <Input
                  type="number"
                  id="duration"
                  min="1"
                  className={validationErrors.duration ? 'border-red-500' : ''}
                  {...register('duration', { 
                    required: 'Duration is required',
                    min: { value: 1, message: 'Duration must be at least 1 minute' }
                  })}
                  placeholder="30"
                />
                {validationErrors.duration && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.duration}</p>
                )}
                {errors.duration && (
                  <p className="mt-1 text-sm text-destructive">{errors.duration.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="price" className="block text-sm font-medium text-foreground">
                  Price ($) *
                </Label>
                <Input
                  type="number"
                  id="price"
                  min="0"
                  step="0.01"
                  className={validationErrors.price ? 'border-red-500' : ''}
                  {...register('price', { 
                    required: 'Price is required',
                    min: { value: 0, message: 'Price must be at least $0' }
                  })}
                  placeholder="25.00"
                />
                {validationErrors.price && (
                  <p className="mt-1 text-sm text-red-500">{validationErrors.price}</p>
                )}
                {errors.price && (
                  <p className="mt-1 text-sm text-destructive">{errors.price.message}</p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              {editingService && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEdit}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {editingService ? 'Updating...' : 'Adding...'}
                  </>
                ) : (
                  <>
                    {editingService ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                    {editingService ? 'Update Service' : 'Add Service'}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Services List */}
      {services.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <h4 className="text-sm font-medium text-foreground mb-4">Your Services</h4>
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Scissors className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {service.duration} minutes • ${service.price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => editService(service)}
                      disabled={isLoading}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => service.id && deleteService(service.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 