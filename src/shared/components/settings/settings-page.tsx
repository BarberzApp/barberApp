import { useState } from 'react'
import { ProfileSettings } from '@/features/settings/components/profile-settings'
import { ServicesSettings } from './services-settings'
import { EarningsDashboard } from '@/shared/components/payment/earnings-dashboard'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { DollarSign } from 'lucide-react'

type Tab = 'profile' | 'services' | 'earnings'

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const { user } = useAuth()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h2 className="text-lg font-medium leading-6 text-gray-900">Settings</h2>
            <p className="mt-1 text-sm text-gray-600">
              Manage your profile and services.
            </p>
          </div>
          <div className="mt-4">
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab('profile')}
                className={`${
                  activeTab === 'profile'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full truncate`}
              >
                Profile
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`${
                  activeTab === 'services'
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                } group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full truncate`}
              >
                Services
              </button>
              {user?.role === 'barber' && (
                <button
                  onClick={() => setActiveTab('earnings')}
                  className={`${
                    activeTab === 'earnings'
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-3 py-2 text-sm font-medium rounded-md w-full truncate`}
                >
                  <DollarSign className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Earnings</span>
                </button>
              )}
            </nav>
          </div>
        </div>

        <div className="mt-5 md:mt-0 md:col-span-2">
          <div className="shadow sm:rounded-md sm:overflow-hidden">
            <div className="px-4 py-5 bg-white space-y-6 sm:p-6">
              {activeTab === 'profile' ? (
                <ProfileSettings />
              ) : activeTab === 'services' ? (
                <ServicesSettings />
              ) : (
                user?.role === 'barber' && <EarningsDashboard barberId={user.id} />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 