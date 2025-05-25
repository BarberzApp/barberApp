"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useData, type Application, type JobPost } from "@/contexts/data-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Briefcase, Clock, MapPin, DollarSign } from "lucide-react"

export default function BarberApplicationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { applications, getApplicationsByBarberId, jobPosts } = useData()
  const [activeTab, setActiveTab] = useState("active")
  const [barberApplications, setBarberApplications] = useState<Application[]>([])

  useEffect(() => {
    if (user?.id && user.role === "barber") {
      const apps = getApplicationsByBarberId(user.id)
      setBarberApplications(apps)
    }
  }, [user, getApplicationsByBarberId])

  // Filter applications by status
  const activeApplications = barberApplications.filter((app) => app.status === "pending" || app.status === "reviewing")

  const completedApplications = barberApplications.filter(
    (app) => app.status === "accepted" || app.status === "rejected",
  )

  // Get job post details for an application
  const getJobPostDetails = (jobId: string): JobPost | undefined => {
    return jobPosts.find((job) => job.id === jobId)
  }

  // Status badge colors
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    reviewing: "bg-blue-100 text-blue-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  }

  // Status labels
  const statusLabels = {
    pending: "Pending",
    reviewing: "Under Review",
    accepted: "Accepted",
    rejected: "Rejected",
  }

  if (!user || user.role !== "barber") {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>Only barbers can access the applications page.</CardDescription>
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
          <h1 className="text-3xl font-bold">My Job Applications</h1>
          <p className="text-muted-foreground">Track and manage your job applications</p>
        </div>

        <Button onClick={() => router.push("/jobs")}>
          <Briefcase className="mr-2 h-4 w-4" />
          Browse Job Postings
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="active">
            Active Applications
            {activeApplications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeApplications.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed Applications
            {completedApplications.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {completedApplications.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-6">
          {activeApplications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Active Applications</h3>
                <p className="text-muted-foreground text-center mb-6">
                  You don't have any active job applications at the moment.
                </p>
                <Button onClick={() => router.push("/jobs")}>Browse Job Postings</Button>
              </CardContent>
            </Card>
          ) : (
            activeApplications.map((application) => {
              const jobPost = getJobPostDetails(application.jobId)

              if (!jobPost) return null

              return (
                <Card key={application.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-xl">{jobPost.title}</h3>
                          <Badge className={statusColors[application.status]}>{statusLabels[application.status]}</Badge>
                        </div>

                        <h4 className="text-lg font-medium text-barber-600 mb-3">{jobPost.businessName}</h4>

                        <div className="flex flex-col sm:flex-row sm:gap-4">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{jobPost.location}</span>
                          </div>

                          <div className="flex items-center text-sm text-muted-foreground mt-1 sm:mt-0">
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span>{jobPost.salary}</span>
                          </div>
                        </div>

                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Applied: {application.appliedDate}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 min-w-[120px]">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                        <Button variant="outline" size="sm" className="w-full">
                          Contact Business
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          {completedApplications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Briefcase className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No Completed Applications</h3>
                <p className="text-muted-foreground text-center mb-6">
                  You don't have any completed job applications yet.
                </p>
                <Button onClick={() => router.push("/jobs")}>Browse Job Postings</Button>
              </CardContent>
            </Card>
          ) : (
            completedApplications.map((application) => {
              const jobPost = getJobPostDetails(application.jobId)

              if (!jobPost) return null

              return (
                <Card key={application.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-bold text-xl">{jobPost.title}</h3>
                          <Badge className={statusColors[application.status]}>{statusLabels[application.status]}</Badge>
                        </div>

                        <h4 className="text-lg font-medium text-barber-600 mb-3">{jobPost.businessName}</h4>

                        <div className="flex flex-col sm:flex-row sm:gap-4">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{jobPost.location}</span>
                          </div>

                          <div className="flex items-center text-sm text-muted-foreground mt-1 sm:mt-0">
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span>{jobPost.salary}</span>
                          </div>
                        </div>

                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="h-4 w-4 mr-1" />
                          <span>Applied: {application.appliedDate}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 min-w-[120px]">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                        {application.status === "accepted" && (
                          <Button size="sm" className="w-full">
                            Accept Offer
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
