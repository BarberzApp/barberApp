'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Badge } from '@/shared/components/ui/badge'
import { Switch } from '@/shared/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { 
  Scissors, 
  Users, 
  Calendar, 
  Star, 
  MapPin, 
  Clock, 
  DollarSign, 
  Settings,
  Heart,
  Share2,
  User,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'

export default function UITestPage() {
  const [activeTab, setActiveTab] = useState('components')

  const mockBarbers = [
    {
      id: '1',
      name: 'Alex Johnson',
      business: 'Elite Cuts',
      rating: 4.8,
      reviews: 127,
      price: '$25',
      location: 'Downtown',
      specialties: ['Fades', 'Beards', 'Styling'],
      image: '/placeholder.svg',
      isDeveloper: true,
      isTrending: true
    },
    {
      id: '2',
      name: 'Marcus Chen',
      business: 'Urban Barbershop',
      rating: 4.9,
      reviews: 89,
      price: '$30',
      location: 'Midtown',
      specialties: ['Classic Cuts', 'Color', 'Shaves'],
      image: '/placeholder.svg',
      isDeveloper: false,
      isTrending: false
    },
    {
      id: '3',
      name: 'David Rodriguez',
      business: 'Precision Cuts',
      rating: 4.7,
      reviews: 156,
      price: '$28',
      location: 'Westside',
      specialties: ['Modern Fades', 'Designs', 'Kids'],
      image: '/placeholder.svg',
      isDeveloper: true,
      isTrending: true
    }
  ]

  const mockServices = [
    { id: '1', name: 'Classic Haircut', price: 25, duration: 30, description: 'Traditional men\'s haircut' },
    { id: '2', name: 'Fade & Beard Trim', price: 35, duration: 45, description: 'Modern fade with beard grooming' },
    { id: '3', name: 'Full Service', price: 50, duration: 60, description: 'Haircut, beard, and styling' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-darkpurple to-secondary">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-xl border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Scissors className="h-8 w-8 text-saffron" />
              <h1 className="text-2xl font-bebas text-white tracking-wide">BOCM UI Test</h1>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button className="bg-saffron text-primary hover:bg-saffron/90">
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white/10 border border-white/20">
            <TabsTrigger value="components" className="text-white data-[state=active]:bg-white/20">
              Components
            </TabsTrigger>
            <TabsTrigger value="layouts" className="text-white data-[state=active]:bg-white/20">
              Layouts
            </TabsTrigger>
            <TabsTrigger value="cards" className="text-white data-[state=active]:bg-white/20">
              Cards
            </TabsTrigger>
            <TabsTrigger value="forms" className="text-white data-[state=active]:bg-white/20">
              Forms
            </TabsTrigger>
            <TabsTrigger value="navigation" className="text-white data-[state=active]:bg-white/20">
              Navigation
            </TabsTrigger>
            <TabsTrigger value="animations" className="text-white data-[state=active]:bg-white/20">
              Animations
            </TabsTrigger>
          </TabsList>

          {/* Components Tab */}
          <TabsContent value="components" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Buttons */}
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Buttons</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button className="w-full bg-saffron text-primary hover:bg-saffron/90">
                    Primary Button
                  </Button>
                  <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">
                    Secondary Button
                  </Button>
                  <Button variant="ghost" className="w-full text-white hover:bg-white/10">
                    Ghost Button
                  </Button>
                  <Button disabled className="w-full">
                    Disabled Button
                  </Button>
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                    Gradient Button
                  </Button>
                </CardContent>
              </Card>

              {/* Badges */}
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Badges</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-green-500">Success</Badge>
                    <Badge className="bg-red-500">Error</Badge>
                    <Badge className="bg-yellow-500">Warning</Badge>
                    <Badge className="bg-blue-500">Info</Badge>
                    <Badge className="bg-purple-500">Developer</Badge>
                    <Badge className="bg-saffron text-primary">Premium</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Switches */}
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Switches</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white">Developer Mode</span>
                    <Switch className="bg-green-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">Notifications</span>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">Dark Mode</span>
                    <Switch className="bg-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Layouts Tab */}
          <TabsContent value="layouts" className="space-y-8">
            {/* Hero Section */}
            <Card className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400/50">
              <CardContent className="p-12 text-center">
                <h2 className="text-4xl font-bebas text-white mb-4">Find Your Perfect Barber</h2>
                <p className="text-white/80 text-lg mb-8">Discover skilled barbers in your area</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-saffron text-primary hover:bg-saffron/90 px-8 py-3">
                    Browse Barbers
                  </Button>
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8 py-3">
                    Learn More
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500/20 to-blue-600/20 border-blue-400/50">
                <CardContent className="p-6 text-center">
                  <Users className="h-8 w-8 text-blue-300 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">150+</p>
                  <p className="text-blue-200 text-sm">Barbers</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-green-500/20 to-green-600/20 border-green-400/50">
                <CardContent className="p-6 text-center">
                  <Star className="h-8 w-8 text-green-300 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">4.8</p>
                  <p className="text-green-200 text-sm">Average Rating</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-500/20 to-purple-600/20 border-purple-400/50">
                <CardContent className="p-6 text-center">
                  <Calendar className="h-8 w-8 text-purple-300 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">2.5k</p>
                  <p className="text-purple-200 text-sm">Bookings</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-yellow-500/20 to-yellow-600/20 border-yellow-400/50">
                <CardContent className="p-6 text-center">
                  <MapPin className="h-8 w-8 text-yellow-300 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">25</p>
                  <p className="text-yellow-200 text-sm">Cities</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Cards Tab */}
          <TabsContent value="cards" className="space-y-8">
            {/* Barber Cards */}
            <div>
              <h3 className="text-2xl font-bebas text-white mb-6">Barber Cards</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {mockBarbers.map((barber) => (
                  <Card key={barber.id} className={`transition-all duration-300 hover:scale-105 ${
                    barber.isDeveloper 
                      ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/20 border-green-400/50 shadow-lg shadow-green-500/20' 
                      : 'bg-white/10 border-white/20'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-lg font-semibold text-white">{barber.name}</h4>
                          <p className="text-white/80">{barber.business}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {barber.isDeveloper && (
                            <Badge className="bg-green-500 text-white">🚀 DEV</Badge>
                          )}
                          {barber.isTrending && (
                            <Badge className="bg-orange-500 text-white">🔥 TRENDING</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 mb-3">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-white font-semibold">{barber.rating}</span>
                        <span className="text-white/60">({barber.reviews} reviews)</span>
                      </div>
                      
                      <div className="flex items-center gap-4 mb-4 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4 text-white/60" />
                          <span className="text-white/80">{barber.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4 text-white/60" />
                          <span className="text-white/80">From {barber.price}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1 mb-4">
                        {barber.specialties.map((specialty, index) => (
                          <Badge key={index} variant="outline" className="text-xs border-white/20 text-white/80">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button className="flex-1 bg-saffron text-primary hover:bg-saffron/90">
                          Book Now
                        </Button>
                        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                          <Heart className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                          <Share2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Service Cards */}
            <div>
              <h3 className="text-2xl font-bebas text-white mb-6">Service Cards</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mockServices.map((service) => (
                  <Card key={service.id} className="bg-white/10 border-white/20 hover:bg-white/15 transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-lg font-semibold text-white">{service.name}</h4>
                        <Badge className="bg-saffron text-primary">${service.price}</Badge>
                      </div>
                      <p className="text-white/80 text-sm mb-4">{service.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-white/60">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">{service.duration} min</span>
                        </div>
                        <Button size="sm" className="bg-saffron text-primary hover:bg-saffron/90">
                          Select
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Forms Tab */}
          <TabsContent value="forms" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Booking Form */}
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Booking Form</CardTitle>
                  <CardDescription className="text-white/80">Schedule your appointment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="service" className="text-white">Select Service</Label>
                    <Select>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Choose a service" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="haircut">Classic Haircut</SelectItem>
                        <SelectItem value="fade">Fade & Beard</SelectItem>
                        <SelectItem value="full">Full Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-white">Date</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-white">Time</Label>
                    <Select>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="9:00">9:00 AM</SelectItem>
                        <SelectItem value="10:00">10:00 AM</SelectItem>
                        <SelectItem value="11:00">11:00 AM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <Button className="w-full bg-saffron text-primary hover:bg-saffron/90">
                    Book Appointment
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Form */}
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Contact Form</CardTitle>
                  <CardDescription className="text-white/80">Get in touch with us</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Your name" 
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="your@email.com" 
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-white">Message</Label>
                    <textarea 
                      id="message" 
                      rows={4}
                      placeholder="Your message..."
                      className="w-full bg-white/10 border border-white/20 text-white placeholder:text-white/40 rounded-md p-3 resize-none"
                    />
                  </div>
                  
                  <Button className="w-full bg-saffron text-primary hover:bg-saffron/90">
                    Send Message
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Navigation Tab */}
          <TabsContent value="navigation" className="space-y-8">
            {/* Sidebar Navigation */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Sidebar Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2">
                  <Button variant="ghost" className="justify-start text-white hover:bg-white/10">
                    <Users className="h-4 w-4 mr-3" />
                    Browse Barbers
                  </Button>
                  <Button variant="ghost" className="justify-start text-white hover:bg-white/10">
                    <Calendar className="h-4 w-4 mr-3" />
                    My Bookings
                  </Button>
                  <Button variant="ghost" className="justify-start text-white hover:bg-white/10">
                    <Heart className="h-4 w-4 mr-3" />
                    Favorites
                  </Button>
                  <Button variant="ghost" className="justify-start text-white hover:bg-white/10">
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </Button>
                  <Button variant="ghost" className="justify-start text-white hover:bg-white/10">
                    <User className="h-4 w-4 mr-3" />
                    Profile
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Breadcrumb Navigation */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Breadcrumb Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="flex items-center space-x-2 text-sm">
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                    Home
                  </Button>
                  <ChevronRight className="h-4 w-4 text-white/40" />
                  <Button variant="ghost" size="sm" className="text-white/60 hover:text-white">
                    Browse
                  </Button>
                  <ChevronRight className="h-4 w-4 text-white/40" />
                  <span className="text-white font-medium">Alex Johnson</span>
                </nav>
              </CardContent>
            </Card>

            {/* Pagination */}
            <Card className="bg-white/10 border-white/20">
              <CardHeader>
                <CardTitle className="text-white">Pagination</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center space-x-2">
                  <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="sm" className="bg-saffron text-primary">1</Button>
                  <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">2</Button>
                  <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">3</Button>
                  <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Animations Tab */}
          <TabsContent value="animations" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Loading States */}
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Loading States</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="animate-pulse">
                    <div className="h-4 bg-white/20 rounded mb-2"></div>
                    <div className="h-4 bg-white/20 rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-white/20 rounded w-1/2"></div>
                  </div>
                  <Button disabled className="w-full">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading...
                  </Button>
                </CardContent>
              </Card>

              {/* Hover Effects */}
              <Card className="bg-white/10 border-white/20 transition-all duration-300 hover:scale-105 hover:bg-white/15">
                <CardHeader>
                  <CardTitle className="text-white">Hover Effects</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80">Hover over this card to see the effect</p>
                </CardContent>
              </Card>

              {/* Pulse Animation */}
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Pulse Animation</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="animate-pulse">
                    <div className="w-16 h-16 bg-saffron rounded-full mx-auto mb-4"></div>
                    <p className="text-white/80">Pulsing element</p>
                  </div>
                </CardContent>
              </Card>

              {/* Bounce Animation */}
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Bounce Animation</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="animate-bounce">
                    <div className="w-16 h-16 bg-purple-500 rounded-full mx-auto mb-4"></div>
                    <p className="text-white/80">Bouncing element</p>
                  </div>
                </CardContent>
              </Card>

              {/* Spin Animation */}
              <Card className="bg-white/10 border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Spin Animation</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="animate-spin">
                    <div className="w-16 h-16 border-4 border-saffron border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-white/80">Spinning loader</p>
                  </div>
                </CardContent>
              </Card>

              {/* Gradient Animation */}
              <Card className="bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-orange-500/20 border-purple-400/50 animate-pulse">
                <CardHeader>
                  <CardTitle className="text-white">Gradient Animation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80">Animated gradient background</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
} 