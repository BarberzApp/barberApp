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
import { Calendar, MapPin, Star, Upload, DollarSign, Clock, X, Building2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import Image from "next/image"
import type { User } from "@/contexts/auth-context"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { Switch } from "@/components/ui/switch"
import { Service } from "@/types/service"
import { supabase } from "@/lib/supabase"

interface BarberProfileProps {
  user: User
}

export function BarberProfile({ user }: BarberProfileProps) {
  const { toast } = useToast()
  const { updateProfile } = useAuth()
  const { updateBarber, addPortfolioImage, removePortfolioImage, loading: dataLoading } = useData()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    location: user.location || "",
    bio: user.bio || "",
  })
  const [newService, setNewService] = useState({ 
    name: "", 
    price: "", 
    duration: "",
    description: "",
    barberId: user.id 
  })
  const [newSpecialty, setNewSpecialty] = useState("")
  const [services, setServices] = useState<Service[]>(
    (user.services || []).map(service => ({
      id: service.id,
      name: service.name,
      price: service.price,
      duration: service.duration,
      description: (service as any).description || "",
      barberId: (service as any).barberId || user.id
    }))
  )
  const [specialties, setSpecialties] = useState(user.specialties || [])

  const { barbers, loading, error } = useData()
  const barber = barbers.find(b => b.id === user.id) || {
    id: user.id,
    name: user.name || "",
    image: user.image || "",
    location: user.location || "",
    bio: user.bio || "",
    rating: 0,
    totalReviews: 0,
    totalClients: 0,
    totalBookings: 0,
    earnings: {
      thisWeek: 0,
      thisMonth: 0,
      lastMonth: 0
    },
    reviews: [],
    specialties: [],
    services: [],
    portfolio: user.portfolio || [],
    joinDate: new Date().toLocaleDateString(),
    nextAvailable: "Available now",
    isPublic: user.isPublic || false
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewService((prev) => ({ ...prev, [name]: value }))
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

      const newServiceObj: Service = {
        id: `service_${Math.random().toString(36).substr(2, 9)}`,
        name: newService.name,
        price,
        duration,
        description: newService.description || "",
        barberId: user.id
      }

      setServices([...services, newServiceObj])
      setNewService({ name: "", price: "", duration: "", description: "", barberId: user.id })
    }
  }

  const removeService = (id: string) => {
    setServices(services.filter((service) => service.id !== id))
  }

  const addSpecialty = () => {
    if (newSpecialty && !specialties.includes(newSpecialty)) {
      setSpecialties([...specialties, newSpecialty])
      setNewSpecialty("")
    }
  }

  const removeSpecialty = (specialty: string) => {
    setSpecialties(specialties.filter((s) => s !== specialty))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      
      // Check if user is logged in
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.error('No valid session:', sessionError)
        toast({
          title: "Error",
          description: "Please log in to update your profile",
          variant: "destructive",
        })
        return
      }

      // Only send fields that should be updated by the user
      const updatedBarber = {
        name: profileData.name,
        location: profileData.location,
        bio: profileData.bio,
        services: services.map(service => ({
          id: service.id,
          name: service.name,
          price: service.price,
          duration: service.duration,
          description: service.description || "",
          barberId: barber.id
        })),
        specialties: specialties,
        isPublic: barber.isPublic
      }
      
      await updateBarber(barber.id, updatedBarber)
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
      setIsEditing(false)
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const renderStars = (rating: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
      ))
  }

  const handlePortfolioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const imageUrl = URL.createObjectURL(file)
      addPortfolioImage(user.id, imageUrl)
      
      await updateProfile({
        ...profileData,
        portfolio: [...(user.portfolio || []), imageUrl]
      })

      toast({
        title: "Portfolio updated",
        description: "Your portfolio has been updated successfully",
      })
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload image",
        variant: "destructive",
      })
    }
  }

  const handleRemovePortfolioImage = async (index: number) => {
    try {
      const imageUrl = user.portfolio?.[index]
      if (imageUrl) {
        removePortfolioImage(user.id, imageUrl)
        
        const newPortfolio = (user.portfolio || []).filter((_, i) => i !== index)
        await updateProfile({
          ...profileData,
          portfolio: newPortfolio
        })

        toast({
          title: "Image removed",
          description: "The image has been removed from your portfolio",
        })
      }
    } catch (error) {
      toast({
        title: "Failed to remove image",
        description: "Please try again",
        variant: "destructive",
      })
    }
  }

  const handleToggleIsPublic = async () => {
    try {
      setIsSaving(true)
      const updatedBarber = {
        ...barber,
        isPublic: !barber.isPublic
      }
      
      await updateBarber(barber.id, updatedBarber)
      toast({
        title: "Success",
        description: `Profile is now ${!barber.isPublic ? 'public' : 'private'}`,
      })
    } catch (error) {
      console.error('Error toggling profile visibility:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update profile visibility',
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-barber-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">Error loading profile: {error}</p>
      </div>
    )
  }

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="grid w-full grid-cols-5 mb-8">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
        <TabsTrigger value="services">Services</TabsTrigger>
        <TabsTrigger value="reviews">Reviews</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your professional information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.image || "/placeholder.svg"} alt={user.name || "Barber"} />
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
              <h3 className="text-xl font-bold">{user.name}</h3>
              <div className="flex items-center mt-1">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                <span>
                  {barber.rating} ({barber.totalReviews} reviews)
                </span>
              </div>
              {user.businessName && (
                <div className="flex items-center text-sm text-barber-600 mt-1">
                  <Building2 className="h-4 w-4 mr-1" />
                  <span>{user.businessName}</span>
                </div>
              )}
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{barber.location}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Member since {barber.joinDate}</span>
              </div>
              <p className="mt-4 text-sm">{barber.bio}</p>
              <Button 
                variant="outline" 
                className="mt-4 w-full" 
                onClick={() => {
                  setIsEditing(true)
                  // Find the settings tab trigger and click it
                  const settingsTab = document.querySelector('[data-value="settings"]')
                  if (settingsTab instanceof HTMLElement) {
                    settingsTab.click()
                  }
                }}
              >
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
              <CardDescription>Your business metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <h4 className="text-2xl font-bold">{barber.totalClients}</h4>
                  <p className="text-sm text-muted-foreground">Total Clients</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <h4 className="text-2xl font-bold">{barber.totalBookings}</h4>
                  <p className="text-sm text-muted-foreground">Total Bookings</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-lg text-center">
                  <h4 className="text-2xl font-bold">{barber.rating}</h4>
                  <p className="text-sm text-muted-foreground">Average Rating</p>
                </div>
              </div>

              <h4 className="font-medium mb-3">Earnings</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="border p-4 rounded-lg">
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>This Week</span>
                  </div>
                  <p className="text-xl font-bold">${barber.earnings.thisWeek}</p>
                </div>
                <div className="border p-4 rounded-lg">
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>This Month</span>
                  </div>
                  <p className="text-xl font-bold">${barber.earnings.thisMonth}</p>
                </div>
                <div className="border p-4 rounded-lg">
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <DollarSign className="h-4 w-4 mr-1" />
                    <span>Last Month</span>
                  </div>
                  <p className="text-xl font-bold">${barber.earnings.lastMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="portfolio">
        <Card>
          <CardHeader>
            <CardTitle>Your Portfolio</CardTitle>
            <CardDescription>Showcase your best work</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {(user.portfolio || []).map((image: string, index: number) => (
                <div key={index} className="relative aspect-[3/4] bg-muted rounded-md overflow-hidden group">
                  <Image
                    src={image || "/placeholder.svg"}
                    alt={`Portfolio image ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" className="text-white border-white">
                      Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleRemovePortfolioImage(index)}>
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <label className="relative aspect-[3/4] bg-muted rounded-md border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePortfolioUpload}
                />
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Add Photo</p>
                <p className="text-xs text-muted-foreground">Upload a new image</p>
              </label>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="services">
        <Card>
          <CardHeader>
            <CardTitle>Services</CardTitle>
            <CardDescription>Manage your service offerings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  placeholder="Service name"
                  value={newService.name}
                  name="name"
                  onChange={handleServiceChange}
                />
                <Input
                  placeholder="Price"
                  value={newService.price}
                  name="price"
                  type="number"
                  onChange={handleServiceChange}
                />
                <Input
                  placeholder="Duration (minutes)"
                  value={newService.duration}
                  name="duration"
                  type="number"
                  onChange={handleServiceChange}
                />
              </div>
              <div className="mt-4">
                <Textarea
                  placeholder="Service description"
                  value={newService.description}
                  name="description"
                  onChange={handleServiceChange}
                />
              </div>
              <Button onClick={addService}>Add Service</Button>

              <div className="space-y-4 mt-6">
                {services.map((service) => (
                  <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        ${service.price} • {service.duration} minutes
                      </p>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeService(service.id)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="reviews">
        <Card>
          <CardHeader>
            <CardTitle>Client Reviews</CardTitle>
            <CardDescription>What your clients are saying about you</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="text-4xl font-bold">{barber.rating}</div>
                <div>
                  <div className="flex">{renderStars(barber.rating)}</div>
                  <div className="text-sm text-muted-foreground">Based on {barber.totalReviews} reviews</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{barber.totalClients}</div>
                <div className="text-sm text-muted-foreground">Happy clients</div>
              </div>
            </div>

            <div className="space-y-6">
              {barber.reviews.map((review) => (
                <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar>
                      <AvatarImage src={review.client.image || "/placeholder.svg"} alt={review.client.name} />
                      <AvatarFallback>{review.client.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{review.client.name}</h4>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{review.date}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex mb-2">{renderStars(review.rating)}</div>
                  <p className="text-sm">{review.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="settings">
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your account preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Professional Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" value={profileData.name} onChange={handleChange} disabled={!isEditing} />
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
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Specialties</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a specialty"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                />
                <Button onClick={addSpecialty}>Add</Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {specialties.map((specialty) => (
                  <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
                    {specialty}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:bg-transparent"
                      onClick={() => removeSpecialty(specialty)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
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
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Security</h3>
              <Button variant="outline">Change Password</Button>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Danger Zone</h3>
              <Button variant="destructive">Delete Account</Button>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Profile Visibility</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-4">
                  <span className="font-medium">Show in Browse Page</span>
                  <Switch
                    checked={barber.isPublic}
                    onCheckedChange={handleToggleIsPublic}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={handleSave} 
                disabled={isSaving || dataLoading}
              >
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}