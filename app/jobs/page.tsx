"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useData } from "@/contexts/data-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Filter, Briefcase } from "lucide-react"
import { JobPostingCard } from "@/components/job-posting-card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"

export default function JobsPage() {
  const { user } = useAuth()
  const { jobPosts, applications, submitApplication } = useData()
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [coverLetter, setCoverLetter] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [activeTab, setActiveTab] = useState("all")

  // Filter jobs based on search query
  const filteredJobs = jobPosts.filter(
    (job) =>
      job.status === "open" &&
      (job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.businessName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.location.toLowerCase().includes(searchQuery.toLowerCase())),
  )

  // Get user's applications
  const userApplications = user?.role === "barber" ? applications.filter((app) => app.barberId === user.id) : []

  const handleApply = (jobId: string) => {
    if (!user || user.role !== "barber") {
      toast({
        title: "Authentication required",
        description: "You must be logged in as a barber to apply for jobs",
        variant: "destructive",
      })
      return
    }

    // Check if already applied
    const alreadyApplied = applications.some((app) => app.jobId === jobId && app.barberId === user.id)

    if (alreadyApplied) {
      toast({
        title: "Already applied",
        description: "You have already applied for this job",
        variant: "destructive",
      })
      return
    }

    setSelectedJobId(jobId)
    setShowDialog(true)
  }

  const handleSubmitApplication = () => {
    if (!user || user.role !== "barber" || !selectedJobId) return

    setIsSubmitting(true)

    const job = jobPosts.find((j) => j.id === selectedJobId)
    if (!job) return

    const newApplication = {
      jobId: selectedJobId,
      barberId: user.id,
      barber: {
        id: user.id,
        name: user.name || "Anonymous Barber",
        image: user.image || "/placeholder.svg",
        experience: "5+ years", // This would come from the user profile in a real app
        location: user.location || "New York, NY",
      },
      status: "pending" as const,
      appliedDate: "Just now",
      coverLetter,
    }

    submitApplication(newApplication)

    setIsSubmitting(false)
    setShowDialog(false)
    setCoverLetter("")
    setActiveTab("applied")

    toast({
      title: "Application submitted",
      description: `Your application for ${job.title} at ${job.businessName} has been submitted successfully.`,
    })
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Job Board</h1>
          <p className="text-muted-foreground">Find your next opportunity</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[200px]">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All Jobs</TabsTrigger>
            <TabsTrigger value="applied">Applied</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Search bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, company, or location"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="md:w-auto w-full">
          <Filter className="mr-2 h-4 w-4" />
          Filters
        </Button>
      </div>

      {activeTab === "all" ? (
        <>
          {filteredJobs.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No job postings found</h3>
              <p className="text-muted-foreground mb-4">Try adjusting your search criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredJobs.map((job) => (
                <JobPostingCard key={job.id} job={job} onClick={() => handleApply(job.id)} />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          {userApplications.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-lg">
              <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No applications yet</h3>
              <p className="text-muted-foreground mb-4">
                You haven't applied to any jobs yet. Browse available positions and apply today!
              </p>
              <Button onClick={() => setActiveTab("all")}>Browse Jobs</Button>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Your Applications</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userApplications.map((application) => {
                  const job = jobPosts.find((j) => j.id === application.jobId)
                  if (!job) return null
                  return (
                    <Card key={application.id} className="overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-bold">{job.title}</h3>
                                <p className="text-sm">{job.businessName}</p>
                                <p className="text-sm text-muted-foreground mt-1">Applied: {application.appliedDate}</p>
                              </div>
                              <div
                                className={`px-2 py-1 text-xs rounded-full ${
                                  application.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : application.status === "reviewing"
                                      ? "bg-blue-100 text-blue-800"
                                      : application.status === "accepted"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-red-100 text-red-800"
                                }`}
                              >
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </div>
                            </div>
                            <div className="mt-4">
                              <h4 className="text-sm font-medium mb-1">Your Cover Letter</h4>
                              <p className="text-sm text-muted-foreground line-clamp-3">{application.coverLetter}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Application Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Apply for {selectedJobId && jobPosts.find((j) => j.id === selectedJobId)?.title}</DialogTitle>
            <DialogDescription>
              {selectedJobId && `at ${jobPosts.find((j) => j.id === selectedJobId)?.businessName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="coverLetter">Cover Letter</Label>
              <Textarea
                id="coverLetter"
                placeholder="Tell us about your experience and why you're a good fit for this position..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={8}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitApplication} disabled={isSubmitting || !coverLetter.trim()}>
              {isSubmitting ? "Submitting..." : "Submit Application"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
