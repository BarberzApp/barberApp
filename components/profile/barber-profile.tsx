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
import { useData } from "@/contexts/data-context"

interface BarberProfileProps {
  user: User
}

export function BarberProfile({ user }: BarberProfileProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [profileData, setProfileData] = useState({
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    location: user.location || "",
    bio: user.bio || "",
  })
  const [newService, setNewService] = useState({ name: "", price: "", duration: "" })
  const [newSpecialty, setNewSpecialty] = useState("")
  const [services, setServices] = useState(user.services || [])
  const [specialties, setSpecialties] = useState(user.specialties || [])

  const { barbers, loading, error } = useData()
  const barber = barbers[0] // TODO: Get barber by ID from URL or props

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  if (!barber) {
    return <div>Barber not found</div>
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({ ...prev, [name]: value }))
  }

  const handleServiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

      setServices([
        ...services,
        {
          id: `service_${Math.random().toString(36).substr(2, 9)}`,
          name: newService.name,
          price,
          duration,
        },
      ])
      setNewService({ name: "", price: "", duration: "" })
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

  const handleSave = () => {
    // In a real app, this would call an API to update the profile
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully",
    })
    setIsEditing(false)
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
              <Button variant="outline" className="mt-4 w-full" onClick={() => setIsEditing(true)}>
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

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Specialties & Services</CardTitle>
              <CardDescription>Your expertise and offerings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Specialties</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {specialties.map((specialty) => (
                      <Badge key={specialty} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-3">Services</h4>
                  <div className="space-y-2">
                    {services.slice(0, 4).map((service) => (
                      <div key={service.id} className="flex justify-between items-center p-2 bg-muted/30 rounded">
                        <span>{service.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-sm">{service.duration} min</span>
                          <span className="font-medium">${service.price}</span>
                        </div>
                      </div>
                    ))}
                    {services.length > 4 && (
                      <div className="text-center mt-2">
                        <Button variant="link">
                          <Link href="#services">View all services</Link>
                        </Button>
                      </div>
                    )}
                  </div>
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
              {barber.portfolio.map((image, index) => (
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
                    <Button variant="destructive" size="sm">
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <div className="relative aspect-[3/4] bg-muted rounded-md border-2 border-dashed flex flex-col items-center justify-center">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Add Photo</p>
                <p className="text-xs text-muted-foreground">Upload a new image</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="services">
        <Card>
          <CardHeader>
            <CardTitle>Services & Pricing</CardTitle>
            <CardDescription>Manage your service offerings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Your Services</h3>
                <div className="space-y-2">
                  {services.map((service) => (
                    <div key={service.id} className="flex justify-between items-center p-3 border rounded-md">
                      <span className="font-medium">{service.name}</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>{service.duration} min</span>
                        </div>
                        <div className="flex items-center text-sm font-medium">
                          <DollarSign className="h-4 w-4 mr-1 text-muted-foreground" />
                          <span>${service.price}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => removeService(service.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Add New Service</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <Button onClick={addService}>Add Service</Button>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Specialties</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary" className="flex items-center gap-1">
                      {specialty}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => removeSpecialty(specialty)} />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a specialty"
                    value={newSpecialty}
                    onChange={(e) => setNewSpecialty(e.target.value)}
                  />
                  <Button onClick={addSpecialty}>Add</Button>
                </div>
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
              <h3 className="text-lg font-medium">Availability</h3>
              <div className="space-y-3">
                {Object.entries(barber.availability).map(([day, schedule]) => (
                  <div key={day} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="font-medium capitalize">{day}</div>
                    <div className="flex items-center gap-4">
                      {schedule.available ? (
                        <span className="text-sm">
                          {schedule.start} - {schedule.end}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Unavailable</span>
                      )}
                      <input type="checkbox" checked={schedule.available} className="toggle" onChange={() => {}} />
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

            <Button variant="link" href={`/barber/${user.id}`}>
              View Public Profile
            </Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
