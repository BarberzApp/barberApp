"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Alert, AlertDescription } from '@/shared/components/ui/alert'
import { 
  Search, 
  Filter, 
  MapPin, 
  Scissors, 
  DollarSign, 
  Eye, 
  Instagram,
  Twitter,
  Facebook,
  Music,
  CheckCircle,
  Info
} from 'lucide-react'

interface BrowseIntegrationGuideProps {
  className?: string
}

export function BrowseIntegrationGuide({ className = '' }: BrowseIntegrationGuideProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          How Your Profile Appears in Search
        </CardTitle>
        <CardDescription>
          Learn how your profile settings affect your visibility in the browse page
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Search Visibility */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Search Visibility
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Public Profile</span>
              </div>
              <p className="text-xs text-muted-foreground">
                When enabled, clients can find you in search results and browse page
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Private Profile</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Only existing clients with your direct link can book appointments
              </p>
            </div>
          </div>
        </div>

        {/* Search Filters */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Search Filters
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Scissors className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Specialties</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Clients can filter by your specialties (e.g., "Fade", "Beard Trim")
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Price Range</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Clients can filter by Budget, Mid-range, or Premium pricing
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Location</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Clients can search and filter by your location
              </p>
            </div>
          </div>
        </div>

        {/* Search Results */}
        <div className="space-y-3">
          <h4 className="font-semibold">What Clients See</h4>
          <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
            <div className="flex items-start justify-between">
              <div>
                <h5 className="font-medium">Your Name</h5>
                <p className="text-sm text-muted-foreground">Business Name</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium">4.5</span>
                <span className="text-yellow-400">★</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>Your Location</span>
            </div>
            
            <p className="text-sm text-muted-foreground line-clamp-2">
              Your bio appears here to help clients understand your expertise...
            </p>
            
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary" className="text-xs">Specialty 1</Badge>
              <Badge variant="secondary" className="text-xs">Specialty 2</Badge>
              <Badge variant="secondary" className="text-xs">Specialty 3</Badge>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span>Your Price Range</span>
            </div>
          </div>
        </div>

        {/* Social Media Integration */}
        <div className="space-y-3">
          <h4 className="font-semibold">Social Media Integration</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2 p-2 rounded border">
              <Instagram className="h-4 w-4 text-pink-500" />
              <span className="text-xs">Instagram</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded border">
              <Twitter className="h-4 w-4 text-blue-500" />
              <span className="text-xs">Twitter/X</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded border">
              <Music className="h-4 w-4 text-black" />
              <span className="text-xs">TikTok</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded border">
              <Facebook className="h-4 w-4 text-blue-600" />
              <span className="text-xs">Facebook</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Social media links appear on your profile card and help clients discover your work
          </p>
        </div>

        {/* Tips */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Pro Tips:</strong> Keep your bio engaging, add relevant specialties, and ensure your location is accurate. 
            Complete profiles with social media links receive 40% more bookings on average.
          </AlertDescription>
        </Alert>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="text-xs">
            <Search className="h-3 w-3 mr-1" />
            View Browse Page
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            <Eye className="h-3 w-3 mr-1" />
            Preview Profile
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 