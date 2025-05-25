"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useData, type Application } from "@/contexts/data-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Briefcase, Plus, FileText } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { JobPostingCard } from "@/components/job-posting-card"
import { ApplicationCard } from "@/components/application-card"
import { CreateJobPostForm } from "@/components/business/create-job-post-form"

export default function HiringPage() {
  const { user } = useAuth()
  const { jobPosts, applications, getJobPostsByBusinessId, getApplicationsByJobId, updateApplicationStatus } = useData()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("job-posts")
  const [showCreateJobDialog, setShowCreateJobDialog] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)

  // Filter job posts by business ID
  const businessJobPosts = user?.businessId ? getJobPostsByBusinessId(user.businessId) : []

  // Get applications for the selected job
  const jobApplications = selectedJobId ? getApplicationsByJobId(selectedJobId) : []

  // Handle application status change
  const handleStatusChange = (applicationId: string, status: Application["status"]) => {
    updateApplicationStatus(applicationId, status)
    toast({
      title: "Application updated",
      description: `Application status changed to ${status}`,
    })
  }

  // Handle job post creation success
  const handleJobPostCreated = () => {
    setShowCreateJobDialog(false)
    toast({
      title: "Job post created",
      description: "Your job post has been published successfully",
    })
  }

  if (!user || user.role !== "business") {
    return (
      <div className="container py-8">
        <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
        <p>You must be logged in as a business owner to access this page.</p>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Hiring Board</h1>
          <p className="text-muted-foreground">Manage your job postings and applications</p>
        </div>

        <Dialog open={showCreateJobDialog} onOpenChange={setShowCreateJobDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Post New Job
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Job Posting</DialogTitle>
              <DialogDescription>
                Fill out the details below to create a new job posting for your business.
              </DialogDescription>
            </DialogHeader>
            <CreateJobPostForm onSuccess={handleJobPostCreated} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="job-posts">Job Postings</TabsTrigger>
          <TabsTrigger value="applications">Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="job-posts" className="space-y-6">
          {businessJobPosts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Job Postings Yet</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Create your first job posting to start hiring barbers for your business.
                </p>
                <Button onClick={() => setShowCreateJobDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Post New Job
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {businessJobPosts.map((job) => (
                <JobPostingCard
                  key={job.id}
                  job={job}
                  onClick={() => {
                    setSelectedJobId(job.id)
                    setActiveTab("applications")
                  }}
                  showApplicationCount
                  applicationCount={getApplicationsByJobId(job.id).length}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-6">
          {!selectedJobId ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Job Posting</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Please select a job posting to view its applications.
                </p>
                <Button variant="outline" onClick={() => setActiveTab("job-posts")}>
                  View Job Postings
                </Button>
              </CardContent>
            </Card>
          ) : jobApplications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Applications Yet</h3>
                <p className="text-muted-foreground text-center mb-6">
                  This job posting hasn't received any applications yet.
                </p>
                <Button variant="outline" onClick={() => setActiveTab("job-posts")}>
                  Back to Job Postings
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  Applications for:{" "}
                  <span className="text-barber-600">
                    {businessJobPosts.find((job) => job.id === selectedJobId)?.title}
                  </span>
                </h2>
                <Button variant="outline" onClick={() => setActiveTab("job-posts")}>
                  Back to Job Postings
                </Button>
              </div>

              <div className="space-y-6">
                {jobApplications.map((application) => (
                  <ApplicationCard key={application.id} application={application} onStatusChange={handleStatusChange} />
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
