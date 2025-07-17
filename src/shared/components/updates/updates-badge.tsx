"use client"
import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { UpdatesModal } from './updates-modal'
import { cn } from '@/shared/lib/utils'

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
    title: 'Mobile Navigation Improvements',
    description: 'Enhanced mobile navigation with better glass morphism, improved touch targets, and consistent styling across all pages.',
    date: '2024-07-08',
    type: 'improvement',
    isNew: true
  },
  {
    id: '4.2',
    title: 'Cuts Page Video Improvements',
    description: 'Fixed video aspect ratios, added mute toggle, improved autoplay behavior, and enhanced mobile video experience.',
    date: '2024-07-08',
    type: 'improvement',
    isNew: true
  },
  {
    id: '4.1',
    title: 'Filter Bar Enhancements',
    description: 'Made filter bar transparent and locked over videos with subtle highlights instead of heavy gradients.',
    date: '2024-07-08',
    type: 'improvement',
    isNew: true
  },
  {
    id: '4',
    title: 'Cuts Page Layout Refinements',
    description: 'Refined cuts page layout to match design specifications with profile icon and username together, description below, and tags and location at the bottom.',
    date: '2024-07-08',
    type: 'improvement',
    isNew: true
  },
  {
    id: '3',
    title: 'Like & Comment Count Updates',
    description: 'Like and comment counts now update immediately and smoothly when users interact with the buttons, with transition animations and proper React re-rendering.',
    date: '2024-07-08',
    type: 'improvement',
    isNew: true
  },
  {
    id: '2',
    title: 'Page Scrolling Fixes',
    description: 'Disabled page scrolling on cuts page so only video scrolling is allowed, and added more scrolling space on browse and calendar pages.',
    date: '2024-07-08',
    type: 'bugfix',
    isNew: true
  },
  {
    id: '1',
    title: 'Onboarding Flow Improvements',
    description: 'Removed automatic redirect logic that was sending barbers to their profile after 70% completion, ensuring they stay on onboarding until manually completed.',
    date: '2024-07-08',
    type: 'improvement',
    isNew: true
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
        className="relative p-2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all duration-300 hover:border-saffron/30 hover:shadow-lg hover:shadow-saffron/20 group"
      >
        <Bell className="h-5 w-5 text-white group-hover:text-saffron transition-colors duration-300" />
        {hasNewUpdates && (
          <>
            {/* Red blinker dot */}
            <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50" />
            {/* Count badge */}
            <span className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center shadow-lg shadow-red-500/50">
              {updates.filter(u => u.isNew).length > 99 ? '99+' : updates.filter(u => u.isNew).length}
            </span>
          </>
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