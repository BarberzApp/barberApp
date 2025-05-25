"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, MapPin, Phone, Mail, Calendar, Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"

export default function BusinessTeamPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { businesses, getBusinessById } = useData()
  const { toast } = useToast()

  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")

  // Get business data
  const business = user?.businessId ? getBusinessById(user.businessId) : null
  const barbers = business?.barbers || []

  // Filter barbers based on search query
  const filteredBarbers = barbers.filter(
    (barber) =>
      barber.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      barber.specialties.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Filter barbers based on active tab
  const getFilteredBarbers = () => {
    if (activeTab === "all") return filteredBarbers
    if (activeTab === "senior") return filteredBarbers.filter((b) => b.role.toLowerCase().includes("senior"))
    if (activeTab === "master") return filteredBarbers.filter((b) => b.role.toLowerCase().includes("master"))
    return filteredBarbers
  }

  const displayBarbers = getFilteredBarbers()

  // Access control - only business owners can access this page
  if (!user || user.role !== "business") {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only business owners can access the team management page.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/")}>Return to Home</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!business) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Business Not Found</CardTitle>
            <CardDescription>We couldn't find your business information.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/")}>Return to Home</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Team Management</h1>
          <p className="text-muted-foreground">Manage your barbers and staff</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/business/hiring")}>
            <Calendar className="mr-2 h-4 w-4" />
            Hiring Board
          </Button>
          <Button onClick={() => router.push("/browse?openToHire=true")}>
            <Plus className="mr-2 h-4 w-4" />
            Hire Barbers
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        <Card className="md:w-1/3">
          <CardHeader>
            <CardTitle>{business.name}</CardTitle>
            <CardDescription>{business.location}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 mb-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={business.image || "/placeholder.svg"} alt={business.name} />
                <AvatarFallback>{business.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                  <span>
                    {business.rating} ({business.totalReviews} reviews)
                  </span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{business.totalBarbers} barbers</p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{business.location}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{business.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{user.email}</span>
              </div>
            </div>

            <Separator className="my-4" />

            <div>
              <h3 className="font-medium mb-2">Business Hours</h3>
              <div className="space-y-1 text-sm">
                {Object.entries(business.hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between">
                    <span className="capitalize">{day}</span>
                    <span>{hours.isOpen ? `${hours.open} - ${hours.close}` : "Closed"}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="md:w-2/3 space-y-6">
          <Card>
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search barbers by name or specialty..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="all">All Barbers</TabsTrigger>
              <TabsTrigger value="senior">Senior Barbers</TabsTrigger>
              <TabsTrigger value="master">Master Barbers</TabsTrigger>
            </TabsList>

            <div className="space-y-4">
              {displayBarbers.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Barbers Found</h3>
                    <p className="text-muted-foreground text-center mb-6">
                      {searchQuery
                        ? "No barbers match your search criteria."
                        : "You don't have any barbers in your team yet."}
                    </p>
                    <Button onClick={() => router.push("/browse?openToHire=true")}>Hire Barbers</Button>
                  </CardContent>
                </Card>
              ) : (
                displayBarbers.map((barber) => (
                  <Card key={barber.id}>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex gap-4 flex-1">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={barber.image || "/placeholder.svg"} alt={barber.name} />
                            <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-bold text-lg">{barber.name}</h3>
                            <p className="text-barber-600">{barber.role}</p>
                            <div className="flex items-center text-sm mt-1">
                              <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
                              <span>
                                {barber.rating} ({barber.totalReviews} reviews)
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {barber.specialties.map((specialty) => (
                                <Badge key={specialty} variant="secondary" className="text-xs">
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mt-4 md:mt-0">
                          <Button variant="outline" size="sm" onClick={() => router.push(`/barber/${barber.id}`)}>
                            View Profile
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => router.push(`/messages/${barber.id}`)}>
                            Message
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
