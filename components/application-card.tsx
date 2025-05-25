"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, MapPin, Star } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"

export type Application = {
  id: string
  jobId: string
  barberId: string
  barber: {
    id: string
    name: string
    image: string
    experience: string
    location: string
  }
  status: "pending" | "reviewing" | "accepted" | "rejected"
  appliedDate: string
  coverLetter: string
}

interface ApplicationCardProps {
  application: Application
  onStatusChange: (applicationId: string, status: Application["status"]) => void
}

export function ApplicationCard({ application, onStatusChange }: ApplicationCardProps) {
  const [showDetails, setShowDetails] = useState(false)

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    reviewing: "bg-blue-100 text-blue-800",
    accepted: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  }

  const statusLabels = {
    pending: "Pending",
    reviewing: "Reviewing",
    accepted: "Accepted",
    rejected: "Rejected",
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex gap-4 flex-1">
            <Avatar className="h-16 w-16">
              <AvatarImage src={application.barber.image || "/placeholder.svg"} alt={application.barber.name} />
              <AvatarFallback>{application.barber.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-bold text-lg">{application.barber.name}</h3>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                <span>{application.barber.location}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Star className="h-4 w-4 mr-1" />
                <span>Experience: {application.barber.experience}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Applied: {application.appliedDate}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-4 mt-4 md:mt-0">
            <Badge className={statusColors[application.status]}>{statusLabels[application.status]}</Badge>

            <div className="flex gap-2">
              <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
                    <DialogTitle>Application from {application.barber.name}</DialogTitle>
                    <DialogDescription>Applied on {application.appliedDate}</DialogDescription>
                  </DialogHeader>

                  <div className="flex items-center gap-4 my-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={application.barber.image || "/placeholder.svg"} alt={application.barber.name} />
                      <AvatarFallback>{application.barber.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-lg">{application.barber.name}</h3>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{application.barber.location}</span>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Star className="h-4 w-4 mr-1" />
                        <span>Experience: {application.barber.experience}</span>
                      </div>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div>
                    <h4 className="font-medium mb-2">Cover Letter</h4>
                    <div className="bg-muted p-4 rounded-md text-sm whitespace-pre-line">{application.coverLetter}</div>
                  </div>

                  <DialogFooter className="mt-6">
                    <Button variant="outline" onClick={() => setShowDetails(false)}>
                      Close
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="secondary" size="sm">
                    Change Status
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onStatusChange(application.id, "pending")}>
                    Mark as Pending
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(application.id, "reviewing")}>
                    Mark as Reviewing
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(application.id, "accepted")}>
                    Accept Application
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onStatusChange(application.id, "rejected")}>
                    Reject Application
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
