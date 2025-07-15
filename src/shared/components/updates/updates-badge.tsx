"use client"
import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { UpdatesModal } from './updates-modal'

interface Update {
  id: string
  title: string
  description: string
  date: string
  type: 'feature' | 'bugfix' | 'improvement'
  isNew?: boolean
}

// Mock updates data - in a real app, this would come from an API
const mockUpdates: Update[] = [
  {
    id: '9',
    title: 'Barber Onboarding Redirect',
    description: 'Barbers are now correctly redirected to onboarding after Google sign-up, instead of the settings page.',
    date: '2024-07-08',
    type: 'bugfix',
    isNew: true
  },
  {
    id: '8',
    title: 'Settings Page Visual Improvements',
    description: 'The top section of the settings page is now visually modernized with a centered icon, improved spacing, and a glassy, polished look.',
    date: '2024-07-08',
    type: 'improvement',
    isNew: true
  },
  {
    id: '7',
    title: 'Logout Button Accessibility & Color',
    description: 'The logout button is now always accessible (scrollable) and styled in red for clarity.',
    date: '2024-07-08',
    type: 'improvement',
    isNew: true
  },
  {
    id: '6',
    title: '"Book Now" Button Anchored on Barber Cards',
    description: 'The "Book Now" button on barber cards is now anchored at the bottom for consistent card heights.',
    date: '2024-07-08',
    type: 'improvement',
    isNew: true
  },
  {
    id: '5',
    title: 'Cuts Page: "Book" Button Modal',
    description: 'On the cuts page, the "Book" button now opens a booking form modal for the specified barber, with correct barber ID and default date.',
    date: '2024-07-08',
    type: 'feature',
    isNew: true
  },
  {
    id: '4.5',
    title: 'Accessibility Fixes for Dialogs',
    description: 'Added missing DialogTitle to Radix UI dialogs to resolve accessibility warnings.',
    date: '2024-07-08',
    type: 'bugfix',
    isNew: true
  },
  {
    id: '4.4',
    title: 'Web & Mobile Navbar Consistency',
    description: 'Web navbar now matches the mobile navbar: vertical icon+label layout, saffron active states, and consistent spacing.',
    date: '2024-07-08',
    type: 'improvement',
    isNew: true
  },
  {
    id: '4.3',
    title: 'Specialties List Update',
    description: 'Only "Lashes" and "Brows" are available as specialties, removing the long list of cuts/styles.',
    date: '2024-07-08',
    type: 'improvement',
    isNew: true
  },
  {
    id: '4.2',
    title: 'Specialty Filter Logic Fix',
    description: 'Improved specialty filter on the cuts page for exact, case-insensitive matching, ensuring only relevant videos are shown.',
    date: '2024-07-08',
    type: 'bugfix',
    isNew: true
  },
  {
    id: '1',
    title: 'Video Preview on Profile',
    description: 'You can now preview your cuts directly on your profile page. Hover over videos to see them in action!',
    date: '2024-01-15',
    type: 'feature',
    isNew: true
  },
  {
    id: '2',
    title: 'Enhanced Location Display',
    description: 'Profile pages now show cleaner location formatting (Town, State) instead of full addresses.',
    date: '2024-01-14',
    type: 'improvement',
    isNew: true
  },
  {
    id: '3',
    title: 'Saffron Button Consistency',
    description: 'All service buttons now use consistent saffron styling for better visual harmony.',
    date: '2024-01-13',
    type: 'improvement',
    isNew: false
  },
  {
    id: '4',
    title: 'Multiline Service Descriptions',
    description: 'Service descriptions now support multiple lines and line breaks for better formatting.',
    date: '2024-01-12',
    type: 'feature',
    isNew: false
  }
]

export function UpdatesBadge() {
  const [hasNewUpdates, setHasNewUpdates] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [updates, setUpdates] = useState<Update[]>([])

  useEffect(() => {
    // In a real app, this would fetch from an API
    setUpdates(mockUpdates)
    const hasNew = mockUpdates.some(update => update.isNew)
    setHasNewUpdates(hasNew)
  }, [])

  const handleMarkAsRead = () => {
    // In a real app, this would update the backend
    setUpdates(prev => prev.map(update => ({ ...update, isNew: false })))
    setHasNewUpdates(false)
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsModalOpen(true)}
        className="relative rounded-full p-2 hover:bg-saffron/20 transition-colors"
      >
        <Bell className="h-5 w-5 text-white" />
        {hasNewUpdates && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
        )}
      </Button>
      
      <UpdatesModal 
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        updates={updates}
        onMarkAsRead={handleMarkAsRead}
      />
    </>
  )
} 