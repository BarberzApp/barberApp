"use client"

import * as React from "react"
import { Bell } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover"
import { Notification } from "./booking-notifications"
import { format } from "date-fns"

interface NotificationBellProps {
  notifications: Notification[]
  onNotificationClick?: (notification: Notification) => void
  onMarkAllRead?: () => void
}

export function NotificationBell({
  notifications,
  onNotificationClick,
  onMarkAllRead,
}: NotificationBellProps) {
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b p-4">
          <h4 className="font-medium">Notifications</h4>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[300px] overflow-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          ) : (
            notifications.map((notification) => (
              <div
                key={notification.id}
                className={`cursor-pointer border-b p-4 hover:bg-accent ${
                  !notification.read ? "bg-accent/50" : ""
                }`}
                onClick={() => onNotificationClick?.(notification)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{notification.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {notification.message}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(notification.createdAt, "MMM d, h:mm a")}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
} 