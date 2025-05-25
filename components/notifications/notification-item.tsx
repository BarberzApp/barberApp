"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calendar, MessageSquare, DollarSign, Star, Briefcase, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { markNotificationAsRead, type Notification } from "@/lib/notification-service"

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
}

export function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const getIcon = () => {
    switch (notification.type) {
      case "booking_created":
      case "booking_confirmed":
      case "booking_cancelled":
      case "booking_reminder":
        return <Calendar className="h-5 w-5 text-barber-500" />
      case "payment_success":
      case "payment_failed":
        return <DollarSign className="h-5 w-5 text-green-500" />
      case "new_message":
        return <MessageSquare className="h-5 w-5 text-blue-500" />
      case "new_review":
        return <Star className="h-5 w-5 text-yellow-500" />
      case "application_status":
        return <Briefcase className="h-5 w-5 text-purple-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-500" />
    }
  }

  const handleClick = async () => {
    setIsLoading(true)

    try {
      if (!notification.read) {
        await markNotificationAsRead(notification.id, notification.userId)
        onMarkAsRead(notification.id)
      }

      // Navigate based on notification type
      if (notification.data) {
        switch (notification.type) {
          case "booking_created":
          case "booking_confirmed":
          case "booking_cancelled":
          case "booking_reminder":
            router.push(`/bookings`)
            break
          case "new_message":
            router.push(`/messages/${notification.data.conversationId}`)
            break
          case "new_review":
            router.push(`/profile`)
            break
          case "application_status":
            router.push(`/jobs`)
            break
          default:
            break
        }
      }
    } catch (error) {
      console.error("Failed to handle notification:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const timeAgo = () => {
    const now = new Date()
    const notificationDate = new Date(notification.createdAt)
    const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return "just now"
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} ${hours === 1 ? "hour" : "hours"} ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} ${days === 1 ? "day" : "days"} ago`
    }
  }

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors",
        notification.read ? "opacity-70" : "bg-muted/30",
      )}
      onClick={handleClick}
    >
      <div className="mt-0.5">{getIcon()}</div>
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm", !notification.read && "font-medium")}>{notification.title}</p>
        <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
        <p className="text-xs text-muted-foreground mt-1">{timeAgo()}</p>
      </div>
      {!notification.read && <div className="w-2 h-2 rounded-full bg-barber-500 mt-1.5" />}
    </div>
  )
}
