"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/router"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Badge } from "@/shared/components/ui/badge"
import { Calendar, MapPin, Star, Scissors, Heart, Upload } from "lucide-react"
import { useToast } from "@/shared/components/ui/use-toast"
import Link from "next/link"
import type { User } from "@/features/auth/hooks/use-auth"
import { useData } from "@/shared/hooks/use-data"
import type { Booking, Review, Barber, Service } from "@/shared/hooks/use-data"

interface ClientProfileProps {
  user: User
}

export function ClientProfile({ user }: ClientProfileProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const { bookings, reviews, barbers, loading, error } = useData()
  const userBookings = bookings.filter(b => b.clientId === user.id)
  const userReviews = reviews.filter(r => r.clientId === user.id)
  const client = barbers.find((b) => b.id === user.id) || {
    id: user.id,
    name: user.name || "",
    image: user.image || "",
    email: user.email || "",
    phone: user.phone || "",
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
    portfolio: [],
    joinDate: new Date().toLocaleDateString(),
    nextAvailable: "Available now",
    isPublic: false
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    // Implementation of handleChange function
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
      <TabsList className="grid w-full grid-cols-4 mb-8">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="bookings">Bookings</TabsTrigger>
        <TabsTrigger value="favorites">Favorites</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Profile</CardTitle>
              <CardDescription>Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.image || "/placeholder.svg"} alt={user.name || "User"} />
                  <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
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
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{user.location}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Member since {user.joinDate}</span>
              </div>
              <Button variant="outline" className="mt-4 w-full" onClick={() => setIsEditing(true)}>
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Recent Bookings</CardTitle>
              <CardDescription>Your recent appointments</CardDescription>
            </CardHeader>
            <CardContent>
              {userBookings.length > 0 ? (
                <div className="space-y-4">
                  {userBookings.map((booking: Booking) => (
                    <div key={booking.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                      <Avatar>
                        <AvatarImage src={booking.barber.image || "/placeholder.svg"} alt={booking.barber.name} />
                        <AvatarFallback>{booking.barber.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium">{booking.barber.name}</h4>
                          <span className="text-sm font-medium">${booking.price}</span>
                        </div>
                        <p className="text-sm">{booking.service}</p>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{new Date(booking.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground mb-4">You haven't made any bookings yet</p>
                  <Button href="/browse">Book a Barber</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Your Reviews</CardTitle>
              <CardDescription>Reviews you've left for barbers</CardDescription>
            </CardHeader>
            <CardContent>
              {userReviews.length > 0 ? (
                <div className="space-y-6">
                  {userReviews.map((review: Review) => (
                    <div key={review.id} className="border-b pb-6 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar>
                          <AvatarImage src={review.barber.image || "/placeholder.svg"} alt={review.barber.name} />
                          <AvatarFallback>{review.barber.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{review.barber.name}</h4>
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
              ) : (
                <div className="text-center py-6">
                  <Star className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No reviews yet</h3>
                  <p className="text-muted-foreground">You haven't left any reviews yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="bookings">
        <Card>
          <CardHeader>
            <CardTitle>Booking History</CardTitle>
            <CardDescription>View all your past and upcoming appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {userBookings.length > 0 ? (
              <div className="space-y-6">
                {userBookings.map((booking: Booking) => (
                  <div key={booking.id} className="flex items-center gap-4 p-4 border rounded-lg">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={booking.barber.image || "/placeholder.svg"} alt={booking.barber.name} />
                      <AvatarFallback>{booking.barber.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h4 className="font-medium">{booking.barber.name}</h4>
                        <span className="font-medium">${booking.price}</span>
                      </div>
                      <p>{booking.service}</p>
                      <div className="flex items-center text-sm text-muted-foreground mt-1">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{new Date(booking.date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" href={`/book/${booking.barber.id}`}>
                        Book Again
                      </Button>
                      <Button size="sm" href={`/messages/${booking.barber.id}`}>
                        Message
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
                <p className="text-muted-foreground mb-6">You haven't made any bookings yet</p>
                <Button href="/browse">Book a Barber</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="favorites">
        <Card>
          <CardHeader>
            <CardTitle>Favorite Barbers</CardTitle>
            <CardDescription>Barbers you've saved as favorites</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Implementation of favorites section */}
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
              <h3 className="text-lg font-medium">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" name="name" value={user.name || ""} onChange={handleChange} disabled={!isEditing} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={user.email || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={user.phone || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    name="location"
                    value={user.location || ""}
                    onChange={handleChange}
                    disabled={!isEditing}
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
              <Button variant="destructive">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
