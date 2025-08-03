'use client'

import { Button } from '@/shared/components/ui/button'
import { useToast } from '@/shared/components/ui/use-toast'
import { requestJob } from '@/features/jobs/request-job'
import { useUser } from '@/features/auth/hooks/use-auth'

export default function RequestBarberPage() {
  const { toast } = useToast()
  const { user } = useUser()

  const handleRequest = async () => {
    try {
      await requestJob(user.id, 'Haircut')
      toast({ title: 'Request sent', description: 'Waiting for barbers nearby...' })
    } catch (err) {
      toast({ title: 'Error', description: 'Could not request barber', variant: 'destructive' })
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6">
      <h1 className="text-2xl font-bold">Request a Barber</h1>
      <Button onClick={handleRequest} className="h-12 w-48">Request Now</Button>
    </div>
  )
}
