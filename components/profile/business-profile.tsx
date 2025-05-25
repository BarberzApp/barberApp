"use client"

import type React from "react"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Star, Upload, DollarSign, Scissors, Plus, Edit, Trash2, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Image from "next/image"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { User } from "@/contexts/auth-context"

interface BusinessProfileProps {
  user: User
}

// Mock data for business profile
const mockBusinessData = {
  phone: "555-789-1234",
  location: "123 Main St, New York, NY",
  description:
    "Elite Cuts is a premium barbershop offering top-notch haircuts and grooming services in a modern, comfortable environment.",
  joinDate: "January 2021",
  rating: 4.9,
  totalReviews: 256,
  totalBarbers: 5,
  totalClients: 312,
  totalBookings: 1842,
  services: [
    { id: "1", name: "Haircut", price: 30, duration: 30 },
    { id: "2", name: "Haircut & Beard Trim", price: 45, duration: 45 },
    { id: "3", name: "Fade", price: 35, duration: 30 },
    { id: "4", name: "Beard Trim", price: 15, duration: 15 },
    { id: "5", name: "Hot Towel Shave", price: 30, duration: 30 },
  ],
  barbers: [
    {
      id: "b1",
      name: "Alex Johnson",
      image: "/placeholder.svg?height=200&width=200",
      role: "Senior Barber",
      specialties: ["Fades", "Beard Trim", "Designs"],
      rating: 4.8,
      bookings: 423,
      joinDate: "March 2021",
    },
    {
      id: "b2",
      name: "Maria Garcia",
      image: "/placeholder.svg?height=200&width=200",
      role: "Master Stylist",
      specialties: ["Braids", "Color", "Extensions"],
      rating: 4.9,
      bookings: 387,
      joinDate: "April 2021",
    },
    {
      id: "b3",
      name: "Jamal Williams",
      image: "/placeholder.svg?height=200&width=200",
      role: "Barber",
      specialties: ["Tapers", "Waves", "Hot Towel"],
      rating: 4.7,
      bookings: 312,
      joinDate: "June 2021",
    },
    {
      id: "b4",
      name: "Sarah Thompson",
      image: "/placeholder.svg?height=200&width=200",
      role: "Junior Stylist",
      specialties: ["Pixie Cuts", "Balayage", "Styling"],
      rating: 4.6,
      bookings: 245,
      joinDate: "September 2021",
    },
    {
      id: "b5",
      name: "David Chen",
      image: "/placeholder.svg?height=200&width=200",
      role: "Barber",
      specialties: ["Asian Hair", "Texture", "Modern Styles"],
      rating: 4.9,
      bookings: 475,
      joinDate: "February 2021",
    },
  ],
  earnings: {
    thisWeek: 3250,
    thisMonth: 14200,
    lastMonth: 12800,
  },
  photos: [
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
    "/placeholder.svg?height=400&width=600",
  ],
}

export function BusinessProfile({ user }: BusinessProfileProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user.name || "",
    email: user.email || "",
    businessName: user.businessName || "Elite Cuts",
    phone: mockBusinessData.phone,
    location: mockBusinessData.location,
    description: mockBusinessData.description,
  })
  const [barbers, setBarbers] = useState(mockBusinessData.barbers)
  const [services, setServices] = useState(mockBusinessData.services)
  const [showAddBarberDialog, setShowAddBarberDialog] = useState(false)
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false)
  const [newBarber, setNewBarber] = useState({
    name: "",
    email: "",
    role: "Barber",
    specialties: "",
  })
  const [newService, setNewService] = useState({
    name: "",
    price: "",
    duration: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handleBarberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewBarber((prev) => ({ ...prev, [name]: value }))
  }

  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewService((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = () => {
    // In a real app, this would call an API to update the profile
    toast({
      title: "Profile updated",
      description: "Your business profile has been updated successfully",
    })
    setIsEditing(false)
  }

  const addBarber = () => {
    if (newBarber.name && newBarber.email && newBarber.role) {
      const specialtiesArray = newBarber.specialties
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s)

      const newBarberObj = {
        id: `b${barbers.length + 1}`,
        name: newBarber.name,
        image: "/placeholder.svg?height=200&width=200",
        role: newBarber.role,
        specialties: specialtiesArray.length > 0 ? specialtiesArray : ["Haircuts"],
        rating: 0,
        bookings: 0,
        joinDate: new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" }),
      }

      setBarbers([...barbers, newBarberObj])
      setNewBarber({
        name: "",
        email: "",
        role: "Barber",
        specialties: "",
      })
      setShowAddBarberDialog(false)

      toast({
        title: "Barber added",
        description: `${newBarber.name} has been added to your team`,
      })
    }
  }

  const removeBarber = (id: string) => {
    setBarbers(barbers.filter((barber) => barber.id !== id))
    toast({
      title: "Barber removed",
      description: "The barber has been removed from your team",
    })
  }

  const addService = () => {
    if (newService.name && newService.price && newService.duration) {
      const price = Number.parseInt(newService.price)
      const duration = Number.parseInt(newService.duration)

      if (isNaN(price) || isNaN(duration)) {
        toast({
          title: "Invalid input",
          description: "Price and duration must be numbers",
          variant: "destructive",
        })
        return
      }

      const newServiceObj = {
        id: `service_${Math.random().toString(36).substr(2, 9)}`,
        name: newService.name,
        price,
        duration,
      }

      setServices([...services, newServiceObj])
      setNewService({
        name: "",
        price: "",
        duration: "",
      })
      setShowAddServiceDialog(false)

      toast({
        title: "Service added",
        description: `${newService.name} has been added to your services`,
      })
    }
  }

  const removeService = (id: string) => {
    setServices(services.filter((service) => service.id !== id))
    toast({
      title: "Service removed",
      description: "The service has been removed from your offerings",
    })
  }

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
      ))
  }

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-8">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="team">Team</TabsTrigger>
        <TabsTrigger value="services">Services</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Business Profile</CardTitle>
              <CardDescription>Your business information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.image || "/placeholder.svg"} alt={user.name || "Business"} />
                  <AvatarFallback>{user.name?.charAt(0) || "B"}</AvatarFallback>
                </Avatar>
                <Button
                  variant="outline"
                  size="icon"
                  className="absolute bottom-0 right-0 rounded-full bg-background border"
                >
                  <Upload className="h-4 w-4" />
                  <span className="sr-only">Upload avatar</span>
                </Button>
              </div>
              <h3 className="text-xl font-bold">{user.businessName || profileData.businessName}</h3>
              <div className="flex items-center mt-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                <span>
                  {mockBusinessData.rating} ({mockBusinessData.totalReviews} reviews)
                </span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{mockBusinessData.location}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Member since {mockBusinessData.joinDate}</span>
              </div>
              <p className="mt-4 text-sm">{mockBusinessData.description}</p>
              <Button variant="outline" className="mt-4 w-full" onClick={() => setIsEditing(true)}>
                Edit Business Profile
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Business Overview</CardTitle>
              <CardDescription>Key metrics for your business</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <h4 className="text-2xl font-bold">{mockBusinessData.totalBarbers}</h4>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <h4 className="text-2xl font-bold">{mockBusinessData.totalClients}</h4>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <h4 className="text-2xl font-bold">{mockBusinessData.totalBookings}</h4>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                </div>
              </div>

              <h4 className="font-medium mb-3">Revenue</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="border p-4 rounded-lg">
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>This Week</span>
                  </div>
                  <p className="text-xl font-bold">${mockBusinessData.earnings.thisWeek}</p>
                </div>
                <div className="border p-4 rounded-lg">
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>This Month</span>
                  </div>
                  <p className="text-xl font-bold">${mockBusinessData.earnings.thisMonth}</p>
                </div>
                <div className="border p-4 rounded-lg">
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>Last Month</span>
                  </div>
                  <p className="text-xl font-bold">${mockBusinessData.earnings.lastMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Shop Photos</CardTitle>
              <CardDescription>Showcase your business</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {mockBusinessData.photos.map((photo, index) => (
                  <div key={index} className="relative aspect-video bg-muted rounded-md overflow-hidden group">
                    <Image
                      src={photo || "/placeholder.svg"}
                      alt={`Shop photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button variant="outline" size="sm" className="text-white border-white">
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm">
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <div className="relative aspect-video bg-muted rounded-md border-2 border-dashed flex flex-col items-center justify-center">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Add Photo</p>
                  <p className="text-xs text-muted-foreground">Upload a new image</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="team">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Your Team</CardTitle>
              <CardDescription>Manage your barbers and stylists</CardDescription>
            </div>
            <Dialog open={showAddBarberDialog} onOpenChange={setShowAddBarberDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Barber
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Team Member</DialogTitle>
                  <DialogDescription>Add a new barber or stylist to your team.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="barber-name">Full Name</Label>
                    <Input
                      id="barber-name"
                      name="name"
                      placeholder="John Doe"
                      value={newBarber.name}
                      onChange={handleBarberChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barber-email">Email</Label>
                    <Input
                      id="barber-email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={newBarber.email}
                      onChange={handleBarberChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barber-role">Role</Label>
                    <Select
                      value={newBarber.role}
                      onValueChange={(value) => setNewBarber((prev) => ({ ...prev, role: value }))}
                    >
                      <SelectTrigger id="barber-role">
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Junior Barber">Junior Barber</SelectItem>
                        <SelectItem value="Barber">Barber</SelectItem>
                        <SelectItem value="Senior Barber">Senior Barber</SelectItem>
                        <SelectItem value="Master Barber">Master Barber</SelectItem>
                        <SelectItem value="Junior Stylist">Junior Stylist</SelectItem>
                        <SelectItem value="Stylist">Stylist</SelectItem>
                        <SelectItem value="Senior Stylist">Senior Stylist</SelectItem>
                        <SelectItem value="Master Stylist">Master Stylist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="barber-specialties">Specialties (comma separated)</Label>
                    <Input
                      id="barber-specialties"
                      name="specialties"
                      placeholder="Fades, Beard Trim, Designs"
                      value={newBarber.specialties}
                      onChange={handleBarberChange}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddBarberDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addBarber}>Add Team Member</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {barbers.map((barber) => (
                <div key={barber.id} className="flex items-start gap-4 p-4 border rounded-lg">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={barber.image || "/placeholder.svg"} alt={barber.name} />
                    <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{barber.name}</h3>
                        <p className="text-sm text-barber-600">{barber.role}</p>
                      </div>
                      <div className="flex items-center">
                        <div className="flex mr-2">{renderStars(barber.rating)}</div>
                        <span className="text-sm">{barber.rating}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {barber.specialties.map((specialty) => (
                        <Badge key={specialty} variant="secondary">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Joined {barber.joinDate}</span>
                      </div>
                      <div className="flex items-center">
                        <Scissors className="h-4 w-4 mr-1" />
                        <span>{barber.bookings} bookings</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => removeBarber(barber.id)}>
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="services">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Services & Pricing</CardTitle>
              <CardDescription>Manage your service offerings</CardDescription>
            </div>
            <Dialog open={showAddServiceDialog} onOpenChange={setShowAddServiceDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Service
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Service</DialogTitle>
                  <DialogDescription>Add a new service to your offerings.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="service-name">Service Name</Label>
                    <Input
                      id="service-name"
                      name="name"
                      placeholder="e.g. Haircut"
                      value={newService.name}
                      onChange={handleServiceChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service-price">Price ($)</Label>
                    <Input
                      id="service-price"
                      name="price"
                      type="number"
                      placeholder="e.g. 30"
                      value={newService.price}
                      onChange={handleServiceChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="service-duration">Duration (minutes)</Label>
                    <Input
                      id="service-duration"
                      name="duration"
                      type="number"
                      placeholder="e.g. 30"
                      value={newService.duration}
                      onChange={handleServiceChange}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddServiceDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addService}>Add Service</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.id} className="flex justify-between items-center p-4 border rounded-md">
                  <div>
                    <h3 className="font-medium">{service.name}</h3>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>{service.duration} minutes</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-lg font-bold">${service.price}</div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => removeService(service.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="analytics">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Overview</CardTitle>
              <CardDescription>Financial performance of your business</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-md">
                <p className="text-muted-foreground">Revenue chart will be displayed here</p>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">${mockBusinessData.earnings.thisWeek}</p>
                  <p className="text-sm text-green-600">+12% from last week</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">${mockBusinessData.earnings.thisMonth}</p>
                  <p className="text-sm text-green-600">+8% from last month</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">This Year</p>
                  <p className="text-2xl font-bold">$168,400</p>
                  <p className="text-sm text-green-600">+15% from last year</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Booking Analytics</CardTitle>
              <CardDescription>Booking trends and patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center bg-muted/30 rounded-md">
                <p className="text-muted-foreground">Booking chart will be displayed here</p>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">87</p>
                  <p className="text-sm text-green-600">+5% from last week</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">342</p>
                  <p className="text-sm text-green-600">+10% from last month</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Avg. Duration</p>
                  <p className="text-2xl font-bold">38 min</p>
                  <p className="text-sm text-muted-foreground">Per appointment</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Services</CardTitle>
              <CardDescription>Most popular services by bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-8 bg-barber-500 rounded-full"></div>
                    <div>
                      <p className="font-medium">Haircut & Beard Trim</p>
                      <p className="text-sm text-muted-foreground">45 minutes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">423 bookings</p>
                    <p className="text-sm text-muted-foreground">$19,035 revenue</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-8 bg-barber-400 rounded-full"></div>
                    <div>
                      <p className="font-medium">Fade</p>
                      <p className="text-sm text-muted-foreground">30 minutes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">387 bookings</p>
                    <p className="text-sm text-muted-foreground">$13,545 revenue</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-8 bg-barber-300 rounded-full"></div>
                    <div>
                      <p className="font-medium">Haircut</p>
                      <p className="text-sm text-muted-foreground">30 minutes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">356 bookings</p>
                    <p className="text-sm text-muted-foreground">$10,680 revenue</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-8 bg-barber-200 rounded-full"></div>
                    <div>
                      <p className="font-medium">Hot Towel Shave</p>
                      <p className="text-sm text-muted-foreground">30 minutes</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">245 bookings</p>
                    <p className="text-sm text-muted-foreground">$7,350 revenue</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Performing Barbers</CardTitle>
              <CardDescription>Most productive team members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {barbers.slice(0, 4).map((barber, index) => (
                  <div key={barber.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={barber.image || "/placeholder.svg"} alt={barber.name} />
                        <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{barber.name}</p>
                        <p className="text-sm text-muted-foreground">{barber.role}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{barber.bookings} bookings</p>
                      <div className="flex">{renderStars(barber.rating)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle>Business Settings</CardTitle>
            <CardDescription>Manage your business information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="business-name">Business Name</Label>
                  <Input
                    id="business-name"
                    name="businessName"
                    value={profileData.businessName}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="owner-name">Owner Name</Label>
                  <Input
                    id="owner-name"
                    name="name"
                    value={profileData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={profileData.location}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="description">Business Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={profileData.description}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows={4}
                  />
                </div>
              </div>

              {isEditing ? (
                <div className="flex gap-2">
                  <Button onClick={handleSave}>Save Changes</Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Information
                </Button>
              )}
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Business Hours</h3>
              <div className="space-y-3">
                {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map((day) => (
                  <div key={day} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="font-medium capitalize">{day}</div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2">
                        <Input className="w-24" defaultValue="9:00 AM" disabled={day === "sunday"} />
                        <span className="flex items-center">to</span>
                        <Input className="w-24" defaultValue="5:00 PM" disabled={day === "sunday"} />
                      </div>
                      <input type="checkbox" className="toggle" defaultChecked={day !== "sunday"} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Notification Preferences</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <input type="checkbox" id="email-notifications" className="toggle" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-notifications">SMS Notifications</Label>
                  <input type="checkbox" id="sms-notifications" className="toggle" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="booking-reminders">Booking Reminders</Label>
                  <input type="checkbox" id="booking-reminders" className="toggle" defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="marketing-emails">Marketing Emails</Label>
                  <input type="checkbox" id="marketing-emails" className="toggle" />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Security</h3>
              <Button variant="outline">Change Password</Button>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Danger Zone</h3>
              <Button variant="destructive">Delete Business Account</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
