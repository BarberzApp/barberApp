"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MapPin, Phone, Mail, Users, Clock, Edit, Trash, Plus } from 'lucide-react'

// Mock locations data
const mockLocations = [
  {
    id: "loc1",
    name: "Downtown Shop",
    address: "123 Main St, New York, NY 10001",
    phone: "212-555-1234",
    email: "downtown@elitecuts.com",
    manager: "Alex Johnson",
    staff: 5,
    chairs: 4,
    openingHours: {
      monday: { open: "9:00 AM", close: "7:00 PM", isOpen: true },
      tuesday: { open: "9:00 AM", close: "7:00 PM", isOpen: true },
      wednesday: { open: "9:00 AM", close: "7:00 PM", isOpen: true },
      thursday: { open: "9:00 AM", close: "8:00 PM", isOpen: true },
      friday: { open: "9:00 AM", close: "8:00 PM", isOpen: true },
      saturday: { open: "10:00 AM", close: "6:00 PM", isOpen: true },
      sunday: { open: "11:00 AM", close: "5:00 PM", isOpen: false },
    },
  },
  {
    id: "loc2",
    name: "Uptown Branch",
    address: "456 Park Ave, New York, NY 10022",
    phone: "212-555-5678",
    email: "uptown@elitecuts.com",
    manager: "Maria Garcia",
    staff: 3,
    chairs: 3,
    openingHours: {
      monday: { open: "10:00 AM", close: "6:00 PM", isOpen: true },
      tuesday: { open: "10:00 AM", close: "6:00 PM", isOpen: true },
      wednesday: { open: "10:00 AM", close: "6:00 PM", isOpen: true },
      thursday: { open: "10:00 AM", close: "7:00 PM", isOpen: true },
      friday: { open: "10:00 AM", close: "7:00 PM", isOpen: true },
      saturday: { open: "10:00 AM", close: "5:00 PM", isOpen: true },
      sunday: { open: "12:00 PM", close: "5:00 PM", isOpen: true },
    },
  },
]

// Mock staff data
const mockStaff = [
  {
    id: "b1",
    name: "Alex Johnson",
    role: "Senior Barber",
    location: "loc1",
    image: "/placeholder.svg?height=100&width=100",
    email: "alex@elitecuts.com",
    phone: "212-555-9876",
  },
  {
    id: "b2",
    name: "Maria Garcia",
    role: "Master Stylist",
    location: "loc2",
    image: "/placeholder.svg?height=100&width=100",
    email: "maria@elitecuts.com",
    phone: "212-555-5432",
  },
  {
    id: "b3",
    name: "James Wilson",
    role: "Junior Barber",
    location: "loc1",
    image: "/placeholder.svg?height=100&width=100",
    email: "james@elitecuts.com",
    phone: "212-555-7890",
  },
]

export default function LocationsPage() {
  const [activeTab, setActiveTab] = useState("locations")
  const [showAddLocation, setShowAddLocation] = useState(false)

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Locations Management</h1>
        {activeTab === "locations" && (
          <Button onClick={() => setShowAddLocation(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Location
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="staff">Staff Assignment</TabsTrigger>
        </TabsList>

        <TabsContent value="locations">
          {showAddLocation ? (
            <Card>
              <CardHeader>
                <CardTitle>Add New Location</CardTitle>
                <CardDescription>Enter the details for your new location</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Location Name</Label>
                      <Input id="name" placeholder="Location name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input id="address" placeholder="Full address" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input id="phone" placeholder="Phone number" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" placeholder="Email address" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="manager">Manager</Label>
                      <Input id="manager" placeholder="Location manager" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="chairs">Number of Chairs</Label>
                      <Input id="chairs" type="number" min="1" placeholder="Number of chairs" />
                    </div>
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setShowAddLocation(false)}>Cancel</Button>
                <Button>Save Location</Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {mockLocations.map((location) => (
                <Card key={location.id}>
                  <CardHeader>
                    <CardTitle>{location.name}</CardTitle>
                    <CardDescription>{location.address}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{location.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{location.email}</span>
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Staff: {location.staff} | Chairs: {location.chairs}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <span>Manager: {location.manager}</span>
                      </div>
                      
                      <div className="mt-4">
                        <h4 className="font-medium mb-2">Opening Hours</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          {Object.entries(location.openingHours).map(([day, hours]) => (
                            <div key={day} className="flex justify-between">
                              <span className="capitalize">{day}:</span>
                              <span>{hours.isOpen ? `${hours.open} - ${hours.close}` : "Closed"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </Button>
                    <Button variant="destructive" size="sm">
                      <Trash className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="staff">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockStaff.map((staff) => {
              const location = mockLocations.find(loc => loc.id === staff.location);
              return (
                <Card key={staff.id}>
                  <CardHeader className="flex flex-row items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden">
                      <img 
                        src={staff.image || "/placeholder.svg"} 
                        alt={staff.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{staff.name}</CardTitle>
                      <CardDescription>{staff.role}</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{location?.name || "Unassigned"}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{staff.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        <span>{staff.email}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="w-full">
                      <Label htmlFor={`location-${staff.id}`} className="mb-2 block">Assign Location</Label>
                      <select 
                        id={`location-${staff.id}`}
                        className="w-full p-2 border rounded-md"
                        defaultValue={staff.location}
                      >
                        <option value="">-- Unassigned --</option>
                        {mockLocations.map(loc => (
                          <option key={loc.id} value={loc.id}>{loc.name}</option>
                        ))}
                      </select>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}