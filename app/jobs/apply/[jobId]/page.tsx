"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { MapPin, DollarSign, Calendar, Check } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"

export default function JobApplicationPage() {
  const params = useParams<{ jobId: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const { jobPosts, submitApplication } = useData()
  const { toast } = useToast()

  const [job, setJob] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [coverLetter, setCoverLetter] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [applicationSubmitted, setApplicationSubmitted] = useState(false)

  useEffect(() => {
    if (params.jobId) {
      const jobPost = jobPosts.find((j) => j.id === params.jobId)
      if (jobPost) {
        setJob(jobPost)
      }
      setIsLoading(false)
    }
  }, [params.jobId, jobPosts])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || user.role !== "barber" || !job) return

    setIsSubmitting(true)

    // Submit application
    submitApplication({
      jobId: job.id,
      barberId: user.id,
      barber: {
        id: user.id,
        name: user.name || "Anonymous Barber",
        image: user.image || "/placeholder.svg",
        experience: "5+ years", // This would come from the user profile in a real app
        location: user.location || "New York, NY",
      },
      status: "pending",
      appliedDate: "Just now",
      coverLetter,
    })

    setIsSubmitting(false)
    setApplicationSubmitted(true)

    toast({
      title: "Application Submitted",
      description: "Your application has been submitted successfully.",
    })
  }

  // Access control - only barbers can apply for jobs
  if (!user || user.role !== "barber") {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only barbers can apply for jobs.</CardDescription>
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

  if (!job) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Job Not Found</CardTitle>
            <CardDescription>The job posting you are looking for does not exist.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/jobs")}>Browse Jobs</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (job.status === "closed") {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Job Posting Closed</CardTitle>
            <CardDescription>This job posting is no longer accepting applications.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push("/jobs")}>Browse Jobs</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (applicationSubmitted) {
    return (
      <div className="container py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Application Submitted!</CardTitle>
            <CardDescription>
              Your application for {job.title} at {job.businessName} has been submitted successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <span className="mr-2">1.</span>
                  <span>The business owner will review your application.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">2.</span>
                  <span>You'll receive a notification when they respond.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">3.</span>
                  <span>If they're interested, they may contact you for an interview or make an offer.</span>
                </li>
              </ul>
            </div>

            <div className="flex items-center gap-4 p-4 border rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarImage src={job.businessImage || "/placeholder.svg"} alt={job.businessName} />
                <AvatarFallback>{job.businessName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold">{job.businessName}</h3>
                <p className="text-sm text-muted-foreground">{job.location}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => router.push("/barber/applications")}>
              View My Applications
            </Button>
            <Button onClick={() => router.push("/jobs")}>Browse More Jobs</Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Apply for {job.title}</CardTitle>
            <CardDescription>
              Complete the application form below to apply for this position at {job.businessName}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <Avatar className="h-16 w-16">
                <AvatarImage src={job.businessImage || "/placeholder.svg"} alt={job.businessName} />
                <AvatarFallback>{job.businessName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-bold text-lg">{job.businessName}</h3>
                <h4 className="text-lg font-medium text-barber-600">{job.title}</h4>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{job.location}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Job Description</h3>
              <p className="text-muted-foreground">{job.description}</p>
            </div>

            <div>
              <h3 className="font-medium mb-2">Requirements</h3>
              <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                {job.requirements.map((req: string, index: number) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 p-3 border rounded-md">
                <div className="flex items-center text-sm mb-1">
                  <DollarSign className="h-4 w-4 mr-1 text-barber-500" />
                  <span className="font-medium">Compensation</span>
                </div>
                <p className="text-muted-foreground">{job.salary}</p>
              </div>
              <div className="flex-1 p-3 border rounded-md">
                <div className="flex items-center text-sm mb-1">
                  <Calendar className="h-4 w-4 mr-1 text-barber-500" />
                  <span className="font-medium">Posted</span>
                </div>
                <p className="text-muted-foreground">{job.postedDate}</p>
              </div>
            </div>

            <Separator />

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="coverLetter">Cover Letter</Label>
                  <Textarea
                    id="coverLetter"
                    placeholder="Tell the business owner why you're a good fit for this position..."
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    rows={8}
                    required
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <Button type="button" variant="outline" onClick={() => router.push("/jobs")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting || coverLetter.trim() === ""}>
                  {isSubmitting ? "Submitting..." : "Submit Application"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
