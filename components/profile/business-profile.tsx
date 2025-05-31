"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Star, Upload, DollarSign, Scissors, Plus, Edit, Trash2, Clock, Mail } from "lucide-react"
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
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

interface Business {
  id: string;
  photos: string[];
  barbers: Array<{
    id: string;
    name: string;
    image?: string;
    role: string;
    rating: number;
    specialties: string[];
    joinDate: string;
    bookings: number;
  }>;
  services: Array<{
    id: string;
    name: string;
    price: number;
    duration: number;
  }>;
  rating: number;
  totalReviews: number;
  location: string;
  joinDate: string;
  description: string;
  totalBarbers: number;
  totalClients: number;
  totalBookings: number;
  earnings: {
    thisWeek: number;
    thisMonth: number;
    lastMonth: number;
  };
}

interface BusinessProfileProps {
  user: User;
}

export function BusinessProfile({ user }: BusinessProfileProps) {
  const { toast } = useToast()
  const { updateProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [showAddBarberDialog, setShowAddBarberDialog] = useState(false)
  const [showAddServiceDialog, setShowAddServiceDialog] = useState(false)
  const [newBarber, setNewBarber] = useState({
    name: "",
    email: "",
    role: "",
    specialties: ""
  })
  const [newService, setNewService] = useState({
    name: "",
    price: "",
    duration: ""
  })
  const [profileData, setProfileData] = useState({
    name: user.name || "",
    email: user.email || "",
    businessName: user.businessName || "",
    phone: user.phone || "",
    location: user.location || "",
    description: user.description || "",
  })
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBusinessData = async () => {
      try {
        setLoading(true)
        // First try to get the business record
        const { data: businessData, error: businessError } = await supabase
          .from('businesses')
          .select('*')
          .eq('id', user.id)
          .single()

        if (businessError) {
          // If business record doesn't exist, create it
          if (businessError.code === 'PGRST116') {
            const { data: newBusiness, error: createError } = await supabase
              .from('businesses')
              .insert([
                {
                  id: user.id,
                  business_name: user.businessName || user.name,
                  description: '',
                  address: '',
                  city: '',
                  state: '',
                  zip_code: '',
                  phone: '',
                  website: '',
                  operating_hours: {},
                  photos: [],
                  barbers: [],
                  services: [],
                  rating: 0,
                  total_reviews: 0,
                  total_barbers: 0,
                  total_clients: 0,
                  total_bookings: 0,
                  earnings: {
                    thisWeek: 0,
                    thisMonth: 0,
                    lastMonth: 0
                  },
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                }
              ])
              .select()
              .single()

            if (createError) throw createError
            setBusiness(newBusiness)
          } else {
            throw businessError
          }
        } else {
          setBusiness(businessData)
        }

        // Update profile data with business data
        if (businessData) {
          setProfileData(prev => ({
            ...prev,
            businessName: businessData.business_name || prev.businessName,
            phone: businessData.phone || prev.phone,
            location: businessData.address || prev.location,
            description: businessData.description || prev.description,
          }))
        }
      } catch (err) {
        console.error('Error fetching/creating business data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch business data')
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchBusinessData()
    }
  }, [user?.id, user?.name, user?.businessName])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-destructive">
        Error: {error}
      </div>
    )
  }

  if (!business) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        Business not found
      </div>
    )
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    try {
      await updateProfile(profileData)
      toast({
        title: "Profile updated",
        description: "Your business profile has been updated successfully",
      })
      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Profile update failed",
        description: "Failed to update your profile",
        variant: "destructive",
      })
    }
  }

  const handleBarberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewBarber(prev => ({ ...prev, [name]: value }))
  }

  const addBarber = async () => {
    try {
      // First create a new user account for the barber
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newBarber.email,
        password: Math.random().toString(36).slice(-8), // Generate random password
        options: {
          data: {
            name: newBarber.name,
            role: 'barber',
            business_id: user.id
          }
        }
      })

      if (authError) throw authError

      // Then create the barber profile
      const { data: barberData, error: barberError } = await supabase
        .from('barbers')
        .insert({
          id: authData.user?.id,
          name: newBarber.name,
          email: newBarber.email,
          business_id: user.id,
          specialties: newBarber.specialties.split(',').map(s => s.trim()),
          is_public: false,
          role: 'barber'
        })
        .select()
        .single()

      if (barberError) throw barberError

      toast({
        title: "Success",
        description: "Barber added successfully. They will receive an email to set up their account.",
      })

      // Reset form and close dialog
      setShowAddBarberDialog(false)
      setNewBarber({ name: "", email: "", role: "", specialties: "" })

      // Refresh the business data
      // You might want to implement a refresh function in your data context
    } catch (error) {
      console.error('Error adding barber:', error)
      toast({
        title: "Error",
        description: "Failed to add barber. Please try again.",
        variant: "destructive"
      })
    }
  }

  const removeBarber = async (barberId: string) => {
    try {
      // Update the barber's business_id to null
      const { error } = await supabase
        .from('barbers')
        .update({ business_id: null })
        .eq('id', barberId)

      if (error) throw error

      toast({
        title: "Success",
        description: "Barber removed from your team.",
      })

      // Refresh the business data
      // You might want to implement a refresh function in your data context
    } catch (error) {
      console.error('Error removing barber:', error)
      toast({
        title: "Error",
        description: "Failed to remove barber. Please try again.",
        variant: "destructive"
      })
    }
  }

  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewService(prev => ({ ...prev, [name]: value }))
  }

  const addService = () => {
    // TODO: Implement service addition logic
    setShowAddServiceDialog(false)
    setNewService({ name: "", price: "", duration: "" })
  }

  const removeService = (id: string) => {
    // TODO: Implement service removal logic
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
                  {business.rating} ({business.totalReviews} reviews)
                </span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{business.location}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Member since {business.joinDate}</span>
              </div>
              <p className="mt-4 text-sm">{business.description}</p>
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
                  <h4 className="text-2xl font-bold">{business.totalBarbers}</h4>
                  <p className="text-sm text-muted-foreground">Team Members</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <h4 className="text-2xl font-bold">{business.totalClients}</h4>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <h4 className="text-2xl font-bold">{business.totalBookings}</h4>
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
                  <p className="text-xl font-bold">${business.earnings.thisWeek}</p>
                </div>
                <div className="border p-4 rounded-lg">
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>This Month</span>
                  </div>
                  <p className="text-xl font-bold">${business.earnings.thisMonth}</p>
                </div>
                <div className="border p-4 rounded-lg">
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>Last Month</span>
                  </div>
                  <p className="text-xl font-bold">${business.earnings.lastMonth}</p>
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
                {(business?.photos || []).map((photo: string, index: number) => (
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
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="barber-email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={newBarber.email}
                        onChange={handleBarberChange}
                        className="pl-9"
                      />
                    </div>
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
              {business.barbers.map((barber) => (
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
              {business.services.map((service) => (
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
                  <p className="text-2xl font-bold">${business.earnings.thisWeek}</p>
                  <p className="text-sm text-green-600">+12% from last week</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">This Month</p>
                  <p className="text-2xl font-bold">${business.earnings.thisMonth}</p>
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
                {business.barbers.slice(0, 4).map((barber, index) => (
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
