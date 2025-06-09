import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/shared/components/ui/use-toast'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Loader2 } from 'lucide-react'

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

export function ServicesSettings() {
  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [barberId, setBarberId] = useState<string | null>(null)
  const supabase = createClient()
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

      {/* Add/Edit Service Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground">
              Service Name
            </label>
            <Input
              type="text"
              id="name"
              {...register('name', { required: 'Service name is required' })}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-foreground">
              Duration (minutes)
            </label>
            <Input
              type="number"
              id="duration"
              min="1"
              {...register('duration', { 
                required: 'Duration is required',
                min: { value: 1, message: 'Duration must be at least 1 minute' }
              })}
            />
            {errors.duration && (
              <p className="mt-1 text-sm text-destructive">{errors.duration.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-foreground">
              Price ($)
            </label>
            <Input
              type="number"
              id="price"
              min="0"
              step="0.01"
              {...register('price', { 
                required: 'Price is required',
                min: { value: 0, message: 'Price must be at least $0' }
              })}
            />
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
              editingService ? 'Update Service' : 'Add Service'
            )}
          </Button>
        </div>
      </form>

      {/* Services List */}
      <div className="mt-8">
        <h4 className="text-sm font-medium text-foreground">Your Services</h4>
        <div className="mt-4 divide-y divide-border">
          {services.map((service) => (
            <div key={service.id} className="py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">{service.name}</p>
                <p className="text-sm text-muted-foreground">
                  {service.duration} minutes • ${service.price.toFixed(2)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editService(service)}
                  disabled={isLoading}
                >
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => service.id && deleteService(service.id)}
                  disabled={isLoading}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
} 