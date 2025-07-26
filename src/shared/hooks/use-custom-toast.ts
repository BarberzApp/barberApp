import { useToast } from '@/shared/components/ui/use-toast'

export function useCustomToast() {
  const { toast } = useToast()

  return {
    success: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'success',
      })
    },
    error: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'destructive',
      })
    },
    warning: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'warning',
      })
    },
    info: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'saffron',
      })
    },
    default: (title: string, description?: string) => {
      toast({
        title,
        description,
        variant: 'default',
      })
    },
  }
} 