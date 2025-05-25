"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, MapPin, Briefcase, Check } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useToast } from "@/components/ui/use-toast"
import { BeforeAfterGallery } from "@/components/gallery/before-after-gallery"
import { ReviewList } from "@/components/reviews/review-list"

// Mock data for before/after images
const mockPortfolioImages = [
  {
    id: "1",
    before: "/thoughtful-long-hair.png",
    after: "/stylish-fade.png",
    title: "Classic Fade",
    description: "Clean fade with textured top",
    style: "fade",
    date: "2023-10-15",
  },
  {
    id: "2",
    before: "/contemplative-man.png",
    after: "/thoughtful-man.png",
    title: "Beard Trim",
    description: "Beard shaping and grooming",
    style: "beard",
    date: "2023-09-22",
  },
  {
    id: "3",
    before: "/disheveled-thinker.png",
    after: "/placeholder.svg?height=400&width=400&query=man with pompadour",
    title: "Modern Pompadour",
    description: "Classic style with a modern twist",
    style: "pompadour",
    date: "2023-10-05",
  },
]

export default function HireBarberPage() {
  const params = useParams<{ barberId: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { getBarberById, getReviewsByBarberId } = useData()
  const { toast } = useToast()

  const [barber, setBarber] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("about")
  const [hiringStep, setHiringStep] = useState(1)

  // Form state
  const [offerDetails, setOfferDetails] = useState({
    position: "barber",
    compensationType: "salary",
    compensation: "",
    startDate: "",
    message: "",
  })

  useEffect(() => {
    if (params.barberId) {
      const barberData = getBarberById(params.barberId)
      if (barberData) {
        setBarber(barberData)
        setReviews(getReviewsByBarberId(params.barberId))
      }
      setIsLoading(false)
    }
  }, [params.barberId, getBarberById, getReviewsByBarberId])

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setOfferDetails((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle radio button changes
  const handleRadioChange = (name: string, value: string) => {
    setOfferDetails((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  // Handle form submission
  const handleSubmitOffer = () => {
    // In a real app, this would send the offer to the barber
    toast({
      title: "Offer Sent!",
      description: `Your hiring offer has been sent to ${barber?.name}. You'll be notified when they respond.`,
    })

    // Navigate to confirmation page
    setHiringStep(3)
  }

  // Access control - only business owners can access this page
  if (!user || user.role !== "business") {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only business owners can access the hiring page.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/")}>Return to Home</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center h-64">
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  if (!barber) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Barber Not Found</CardTitle>
            <CardDescription>
              The barber you are looking for does not exist or is not available for hire.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/browse")}>Browse Barbers</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!barber.openToHire) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Not Available for Hire</CardTitle>
            <CardDescription>{barber.name} is currently not open to job offers.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/browse")}>Browse Barbers</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      {hiringStep === 1 && (
        <div className="grid gap-6 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-col items-center text-center">
                  <Avatar className="h-32 w-32 mb-4">
                    <AvatarImage src={barber.image || "/placeholder.svg"} alt={barber.name} />
                    <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <h1 className="text-2xl font-bold">{barber.name}</h1>
                  <p className="text-muted-foreground">{barber.role}</p>
                  <div className="flex items-center mt-2">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                    <span>
                      {barber.rating} ({barber.totalReviews} reviews)
                    </span>
                  </div>
                  <div className="flex items-center mt-1 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>{barber.location}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {barber.specialties.map((specialty: string) => (
                      <Badge key={specialty} variant="secondary">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                  <div className="mt-6 w-full">
                    <Button className="w-full" onClick={() => setHiringStep(2)}>
                      <Briefcase className="h-4 w-4 mr-2" />
                      Make Hiring Offer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>About {barber.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{barber.bio}</p>
                    <div className="mt-6">
                      <h3 className="font-medium mb-2">Experience & Skills</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-3 border rounded-md">
                          <div>
                            <p className="font-medium">Experience</p>
                            <p className="text-sm text-muted-foreground">7+ years in professional barbering</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 border rounded-md">
                          <div>
                            <p className="font-medium">Specialties</p>
                            <p className="text-sm text-muted-foreground">{barber.specialties.join(", ")}</p>
                          </div>
                        </div>
                        <div className="flex justify-between items-center p-3 border rounded-md">
                          <div>
                            <p className="font-medium">Price Range</p>
                            <p className="text-sm text-muted-foreground">{barber.priceRange}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <ReviewList barberId={barber.id} />
              </TabsContent>

              <TabsContent value="portfolio" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Portfolio Gallery</CardTitle>
                    <CardDescription>Check out some of {barber.name}'s recent work</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <BeforeAfterGallery images={mockPortfolioImages} />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      )}

      {hiringStep === 2 && (
        <Card className="max-w-3xl mx-auto">
          <CardHeader>
            <CardTitle>Make a Hiring Offer to {barber.name}</CardTitle>
            <CardDescription>Fill out the details below to send a hiring offer to this barber.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Avatar className="h-16 w-16">
                <AvatarImage src={barber.image || "/placeholder.svg"} alt={barber.name} />
                <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-lg">{barber.name}</h3>
                <div className="flex items-center text-sm">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 mr-1" />
                  <span>
                    {barber.rating} ({barber.totalReviews} reviews)
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {barber.specialties.slice(0, 2).map((specialty: string) => (
                    <Badge key={specialty} variant="secondary" className="text-xs">
                      {specialty}
                    </Badge>
                  ))}
                  {barber.specialties.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{barber.specialties.length - 2} more
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div>
                <Label htmlFor="position">Position</Label>
                <RadioGroup
                  id="position"
                  value={offerDetails.position}
                  onValueChange={(value) => handleRadioChange("position", value)}
                  className="flex flex-col space-y-1 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="barber" id="barber" />
                    <Label htmlFor="barber">Barber</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="senior-barber" id="senior-barber" />
                    <Label htmlFor="senior-barber">Senior Barber</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="master-barber" id="master-barber" />
                    <Label htmlFor="master-barber">Master Barber</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="compensationType">Compensation Type</Label>
                <RadioGroup
                  id="compensationType"
                  value={offerDetails.compensationType}
                  onValueChange={(value) => handleRadioChange("compensationType", value)}
                  className="flex flex-col space-y-1 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="salary" id="salary" />
                    <Label htmlFor="salary">Salary</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="commission" id="commission" />
                    <Label htmlFor="commission">Commission</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="booth-rental" id="booth-rental" />
                    <Label htmlFor="booth-rental">Booth Rental</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hybrid" id="hybrid" />
                    <Label htmlFor="hybrid">Hybrid (Base + Commission)</Label>
                  </div>
                </RadioGroup>
              </div>

              <div>
                <Label htmlFor="compensation">Compensation Amount</Label>
                <Input
                  id="compensation"
                  name="compensation"
                  placeholder={
                    offerDetails.compensationType === "salary"
                      ? "e.g. $50,000/year"
                      : offerDetails.compensationType === "commission"
                        ? "e.g. 60% commission"
                        : offerDetails.compensationType === "booth-rental"
                          ? "e.g. $200/week"
                          : "e.g. $30,000 + 40% commission"
                  }
                  value={offerDetails.compensation}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="startDate">Preferred Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={offerDetails.startDate}
                  onChange={handleInputChange}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="message">Message to Barber</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Tell the barber why you'd like them to join your team..."
                  value={offerDetails.message}
                  onChange={handleInputChange}
                  className="mt-1"
                  rows={5}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setHiringStep(1)}>
              Back
            </Button>
            <Button onClick={handleSubmitOffer} disabled={!offerDetails.compensation || !offerDetails.startDate}>
              Send Offer
            </Button>
          </CardFooter>
        </Card>
      )}

      {hiringStep === 3 && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Hiring Offer Sent!</CardTitle>
            <CardDescription>
              Your offer has been sent to {barber.name}. You'll be notified when they respond.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">Offer Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Position:</span>
                  <span className="font-medium">
                    {offerDetails.position.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Compensation:</span>
                  <span className="font-medium">
                    {offerDetails.compensation} ({offerDetails.compensationType.replace("-", " ")})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Start Date:</span>
                  <span className="font-medium">{new Date(offerDetails.startDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={barber.image || "/placeholder.svg"} alt={barber.name} />
                <AvatarFallback>{barber.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold">{barber.name}</h3>
                <p className="text-sm text-muted-foreground">{barber.specialties.slice(0, 2).join(", ")}</p>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium flex items-center text-yellow-800 mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                What happens next?
              </h3>
              <ul className="space-y-2 text-sm text-yellow-800">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>{barber.name} will receive your offer and can accept, decline, or negotiate.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>You'll receive a notification when they respond.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>If accepted, you can finalize the details and onboard them to your business.</span>
                </li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => router.push("/business/hiring")}>
              View All Job Postings
            </Button>
            <Button onClick={() => router.push("/browse")}>Browse More Barbers</Button>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
