"use client"

import React from "react"

import { useState } from "react"
import { useRouter } from "next/router"
import { useAuth } from "@/shared/hooks/use-auth-zustand"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/shared/components/ui/avatar"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Badge } from "@/shared/components/ui/badge"
import { Calendar, MapPin, Scissors, Heart, Upload, Camera } from "lucide-react"
import { useToast } from "@/shared/components/ui/use-toast"
import Link from "next/link"
import type { User } from "@/features/auth/hooks/use-auth"
import { useData } from "@/shared/hooks/use-data"
import type { Booking, Barber, Service } from "@/shared/hooks/use-data"
import { supabase } from "@/shared/lib/supabase"

interface ClientProfileProps {
  user: User
}

export function ClientProfile({ user }: ClientProfileProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const { bookings, barbers, loading, error } = useData()
  const userBookings = bookings.filter(b => b.clientId === user.id)
  const client = barbers.find((b) => b.id === user.id) || {
    id: user.id,
    name: user.name || "",
    email: user.email || "",
    phone: user.phone || "",
    location: user.location || "",
    bio: user.bio || "",
    totalClients: 0,
    totalBookings: 0,
    specialties: [],
    services: [],
    joinDate: new Date().toLocaleDateString(),
    nextAvailable: "Available now",
    isPublic: false
  }

  const [avatarUrl, setAvatarUrl] = useState((user as any)?.avatar_url || "")
  const [avatarLoading, setAvatarLoading] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || !e.target.files[0]) return
      const file = e.target.files[0]
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Invalid file type', description: 'Please select an image file.', variant: 'destructive' })
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'File too large', description: 'Please select an image smaller than 5MB.', variant: 'destructive' })
        return
      }
      setAvatarLoading(true)
      const fileExt = file.name.split('.').pop()
      const fileName = `${user?.id}-${Date.now()}.${fileExt}`
      const { data, error } = await supabase.storage.from('avatars').upload(fileName, file)
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
      const { error: updateError } = await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user?.id)
      if (updateError) throw updateError
      setAvatarUrl(publicUrl)
      toast({ title: 'Success', description: 'Avatar updated successfully!' })
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast({ title: 'Error', description: 'Failed to upload avatar. Please try again.', variant: 'destructive' })
    } finally {
      setAvatarLoading(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl lg:text-6xl font-bebas font-bold text-white mb-4">
          Welcome back, <span className="text-saffron">{user.name}</span>
        </h1>
        <p className="text-xl text-white/80 max-w-2xl mx-auto">
          Manage your bookings and profile settings all in one place.
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-darkpurple/90 backdrop-blur-sm border border-white/10">
          <TabsTrigger value="overview" className="text-white data-[state=active]:bg-saffron data-[state=active]:text-primary">Overview</TabsTrigger>
          <TabsTrigger value="bookings" className="text-white data-[state=active]:bg-saffron data-[state=active]:text-primary">Bookings</TabsTrigger>
          <TabsTrigger value="settings" className="text-white data-[state=active]:bg-saffron data-[state=active]:text-primary">Settings</TabsTrigger>
        </TabsList>

      <TabsContent value="overview">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-1 bg-darkpurple/90 backdrop-blur-sm border border-white/10 shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-white">Profile</CardTitle>
              <CardDescription className="text-white/80">Your personal information</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center text-center">
              <div className="relative mb-4">
                <Avatar className="h-24 w-24 border-4 border-saffron/20">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt={user.name || 'Avatar'} />}
                  <AvatarFallback className="bg-saffron text-primary font-bold text-xl">{user.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  className="absolute right-[-18px] bottom-[-8px] bg-yellow-400 border-4 border-red-500 rounded-full p-3 shadow-xl focus:outline-none focus:ring-2 focus:ring-saffron z-50 transition-transform hover:scale-110"
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Upload profile picture"
                  disabled={avatarLoading}
                  style={{ width: 48, height: 48 }}
                >
                  {avatarLoading ? (
                    <span className="w-6 h-6 animate-spin border-2 border-white border-t-transparent rounded-full block" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={avatarLoading}
                />
              </div>
              <h3 className="text-xl font-bold text-white">{user.name}</h3>
              <p className="text-sm text-white/60">{user.email}</p>
              <div className="flex items-center text-sm text-white/60 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{user.location || 'Location not set'}</span>
              </div>
              <div className="flex items-center text-sm text-white/60 mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Member since {user.joinDate || 'Recently'}</span>
              </div>
              <Button 
                className="mt-4 w-full bg-saffron text-primary font-semibold hover:bg-saffron/90" 
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 bg-darkpurple/90 backdrop-blur-sm border border-white/10 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-white">Recent Bookings</CardTitle>
              <CardDescription className="text-white/80">Your recent appointments</CardDescription>
            </CardHeader>
            <CardContent>
              {userBookings.length > 0 ? (
                <div className="space-y-4">
                  {userBookings.map((booking: Booking) => (
                    <div key={booking.id} className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/20 transition-colors">
                      <Avatar className="border-2 border-saffron/20">
                        <AvatarImage src={booking.barber.image || "/placeholder.svg"} alt={booking.barber.name} />
                        <AvatarFallback className="bg-saffron text-primary font-semibold">{booking.barber.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <h4 className="font-medium text-white">{booking.barber.name}</h4>
                          <span className="text-sm font-medium text-saffron">${booking.price}</span>
                        </div>
                        <p className="text-sm text-white/80">{booking.service}</p>
                        <div className="flex items-center text-xs text-white/60 mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          <span>{new Date(booking.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Scissors className="h-16 w-16 mx-auto text-saffron/60 mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-white">No bookings yet</h3>
                  <p className="text-white/60 mb-6">You haven't made any bookings yet</p>
                  <Button className="bg-saffron text-primary font-semibold hover:bg-saffron/90" asChild>
                    <Link href="/browse">Book a Barber</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-3">
            <CardHeader>
              <CardTitle>Your Bookings</CardTitle>
              <CardDescription>Your recent appointments</CardDescription>
            </CardHeader>
            <CardContent>
              {userBookings.length > 0 ? (
                <div className="space-y-6">
                  {userBookings.map((booking: Booking) => (
                    <div key={booking.id} className="border-b pb-6 last:border-0 last:pb-0">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar>
                          <AvatarFallback>{booking.barber.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{booking.barber.name}</h4>
                          <div className="flex items-center text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 mr-1" />
                            <span>{booking.date}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm">{booking.service}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Scissors className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
                  <p className="text-muted-foreground">You haven't made any bookings yet</p>
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

      {/* Favorites tab removed */}

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
    </div>
  )
}
