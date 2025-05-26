"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, Smartphone, Mail, MessageSquare } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { requestNotificationPermission, sendTestNotification } from "@/lib/push-notification-service"
import { useToast } from "../ui/use-toast"

export function NotificationSettings() {
  const [pushEnabled, setPushEnabled] = useState(false)
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [smsEnabled, setSmsEnabled] = useState(false)
  const [inAppEnabled, setInAppEnabled] = useState(true)
  const { toast } = useToast()

  // Check if push notifications are enabled
  useEffect(() => {
    if (typeof window !== "undefined") {
      setPushEnabled(Notification.permission === "granted")
    }
  }, [])

  // Request push notification permission
  const handlePushToggle = useCallback(async () => {
    if (!pushEnabled) {
      const granted = await requestNotificationPermission()
      setPushEnabled(granted)

      if (granted) {
        toast({
          title: "Push notifications enabled",
          description: "You will now receive push notifications from BarberHub.",
        })
      } else {
        toast({
          title: "Permission denied",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Cannot disable push notifications",
        description: "Please disable notifications in your browser settings.",
      })
    }
  }, [pushEnabled, toast])

  const handleEmailToggle = useCallback((checked: boolean) => {
    setEmailEnabled(checked)
  }, [])

  const handleSmsToggle = useCallback((checked: boolean) => {
    setSmsEnabled(checked)
  }, [])

  const handleInAppToggle = useCallback((checked: boolean) => {
    setInAppEnabled(checked)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Settings</CardTitle>
        <CardDescription>Manage how you receive notifications from BarberHub.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="push-notifications" className="text-base">
                  Push Notifications
                </Label>
                <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
              </div>
            </div>
            <Switch id="push-notifications" checked={pushEnabled} onCheckedChange={handlePushToggle} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email-notifications" className="text-base">
                  Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
            </div>
            <Switch id="email-notifications" checked={emailEnabled} onCheckedChange={handleEmailToggle} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="sms-notifications" className="text-base">
                  SMS Notifications
                </Label>
                <p className="text-sm text-muted-foreground">Receive notifications via text message</p>
              </div>
            </div>
            <Switch id="sms-notifications" checked={smsEnabled} onCheckedChange={handleSmsToggle} />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="in-app-notifications" className="text-base">
                  In-App Notifications
                </Label>
                <p className="text-sm text-muted-foreground">Receive notifications within the app</p>
              </div>
            </div>
            <Switch id="in-app-notifications" checked={inAppEnabled} onCheckedChange={handleInAppToggle} />
          </div>
        </div>

        {pushEnabled && (
          <Button variant="outline" onClick={sendTestNotification} className="w-full">
            Send Test Notification
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
