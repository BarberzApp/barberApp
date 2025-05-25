"use client"

import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MapPin, DollarSign, Calendar, Users } from "lucide-react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"

export type Job = {
  id: string
  businessId: string
  businessName: string
  businessImage: string
  title: string
  description: string
  requirements: string[]
  location: string
  salary: string
  postedDate: string
  status: "open" | "closed"
}

interface JobPostingCardProps {
  job: Job
  onClick?: () => void
  showApplicationCount?: boolean
  applicationCount?: number
}

export function JobPostingCard({ job, onClick, showApplicationCount, applicationCount = 0 }: JobPostingCardProps) {
  return (
    <motion.div whileHover={{ y: -5 }} transition={{ type: "spring", stiffness: 300 }}>
      <Card className="overflow-hidden h-full">
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={job.businessImage || "/placeholder.svg"} alt={job.businessName} />
              <AvatarFallback>{job.businessName ? job.businessName.charAt(0) : "J"}</AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <div className="flex justify-between">
                <h3 className="font-bold text-lg">{job.businessName || "Unknown Business"}</h3>
                {job.status === "closed" && (
                  <Badge variant="secondary" className="bg-red-100 text-red-800">
                    Closed
                  </Badge>
                )}
              </div>
              <h4 className="text-xl font-semibold text-barber-600 mt-1">Hiring: {job.title || "Position"}</h4>

              <div className="flex flex-col sm:flex-row sm:gap-4 mt-3">
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span>{job.location}</span>
                </div>

                <div className="flex items-center text-sm text-muted-foreground mt-1 sm:mt-0">
                  <DollarSign className="h-4 w-4 mr-1" />
                  <span>{job.salary}</span>
                </div>
              </div>

              <div className="flex items-center text-sm text-muted-foreground mt-1">
                <Calendar className="h-4 w-4 mr-1" />
                <span>Posted {job.postedDate}</span>
              </div>

              {showApplicationCount && (
                <div className="flex items-center text-sm font-medium mt-2">
                  <Users className="h-4 w-4 mr-1 text-barber-500" />
                  <span>
                    {applicationCount} {applicationCount === 1 ? "application" : "applications"}
                  </span>
                </div>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="p-6 pt-0 flex gap-3">
          {onClick ? (
            <Button className="flex-1" onClick={onClick}>
              {showApplicationCount ? "View Applications" : "Apply"}
            </Button>
          ) : (
            <Button className="flex-1">Apply</Button>
          )}
          <Button variant="outline" className="flex-1">
            View Details
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}
