"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Users, Star, DollarSign, Package, TrendingUp, AlertTriangle } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

// Mock data for revenue
const revenueData = [
  { name: 'Jan', revenue: 4000 },
  { name: 'Feb', revenue: 3000 },
  { name: 'Mar', revenue: 5000 },
  { name: 'Apr', revenue: 4500 },
  { name: 'May', revenue: 6000 },
  { name: 'Jun', revenue: 5500 },
]

// Mock data for bookings
const bookingData = [
  { name: 'Mon', bookings: 12 },
  { name: 'Tue', bookings: 15 },
  { name: 'Wed', bookings: 18 },
  { name: 'Thu', bookings: 14 },
  { name: 'Fri', bookings: 20 },
  { name: 'Sat', bookings: 25 },
  { name: 'Sun', bookings: 10 },
]

// Mock data for inventory
const inventoryItems = [
  {
    id: "1",
    name: "Premium Hair Gel",
    category: "Styling",
    quantity: 15,
    lowStock: 5,
    price: 24.99,
    status: "In Stock"
  },
  {
    id: "2",
    name: "Beard Oil",
    category: "Grooming",
    quantity: 8,
    lowStock: 10,
    price: 19.99,
    status: "Low Stock"
  },
  {
    id: "3",
    name: "Shaving Cream",
    category: "Shaving",
    quantity: 20,
    lowStock: 5,
    price: 14.99,
    status: "In Stock"
  },
  {
    id: "4",
    name: "Hair Clippers",
    category: "Equipment",
    quantity: 3,
    lowStock: 2,
    price: 89.99,
    status: "Low Stock"
  }
]

// Mock data for team members
const teamMembers = [
  {
    id: "1",
    name: "Alex Johnson",
    image: "/placeholder.svg?height=100&width=100",
    role: "Senior Barber",
    bookings: 28,
    rating: 4.8,
    earnings: "$1,240",
  },
  {
    id: "2",
    name: "Maria Garcia",
    image: "/placeholder.svg?height=100&width=100",
    role: "Stylist",
    bookings: 32,
    rating: 4.9,
    earnings: "$1,560",
  },
  {
    id: "3",
    name: "Jamal Williams",
    image: "/placeholder.svg?height=100&width=100",
    role: "Junior Barber",
    bookings: 18,
    rating: 4.7,
    earnings: "$920",
  },
]

export default function Dashboard() {
  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-8">Business Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Week's Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78</div>
            <p className="text-xs text-muted-foreground">+12% from last week</p>
            <Progress value={78} className="h-1 mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">+1 from last month</p>
            <Progress value={60} className="h-1 mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Review</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">+0.2 from last month</p>
            <Progress value={96} className="h-1 mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$3,720</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
            <Progress value={84} className="h-1 mt-3" />
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bookingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="bookings" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Section */}
      <Tabs defaultValue="team" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="team">Team</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => (
              <Card key={member.id}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={member.image || "/placeholder.svg"} alt={member.name} />
                      <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold">{member.name}</h3>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold">{member.bookings}</span>
                      <span className="text-xs text-muted-foreground">Bookings</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold">{member.rating}</span>
                      <span className="text-xs text-muted-foreground">Rating</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-2xl font-bold">{member.earnings}</span>
                      <span className="text-xs text-muted-foreground">Earnings</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Inventory Management</h2>
            <Button>
              <Package className="mr-2 h-4 w-4" />
              Add New Item
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {inventoryItems.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold">{item.name}</h3>
                      <p className="text-sm text-muted-foreground">{item.category}</p>
                    </div>
                    <Badge variant={item.status === "Low Stock" ? "destructive" : "default"}>
                      {item.status}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Quantity</p>
                      <p className="font-bold">{item.quantity}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-bold">${item.price}</p>
                    </div>
                  </div>
                  
                  {item.quantity <= item.lowStock && (
                    <div className="mt-4 flex items-center text-destructive">
                      <AlertTriangle className="h-4 w-4 mr-2" />
                      <span className="text-sm">Low stock alert</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Top Services</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Haircut + Beard</span>
                    <span className="font-bold">45%</span>
                  </div>
                  <Progress value={45} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span>Classic Haircut</span>
                    <span className="font-bold">30%</span>
                  </div>
                  <Progress value={30} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span>Beard Trim</span>
                    <span className="font-bold">25%</span>
                  </div>
                  <Progress value={25} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Customer Satisfaction</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>5 Stars</span>
                    <span className="font-bold">75%</span>
                  </div>
                  <Progress value={75} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span>4 Stars</span>
                    <span className="font-bold">15%</span>
                  </div>
                  <Progress value={15} className="h-2" />
                  
                  <div className="flex justify-between items-center">
                    <span>3 Stars & Below</span>
                    <span className="font-bold">10%</span>
                  </div>
                  <Progress value={10} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
