"use client"

// Check if the browser supports service workers and push notifications
const isPushNotificationSupported = () => {
  return "serviceWorker" in navigator && "PushManager" in window
}

// Request permission to send push notifications
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    console.log("Push notifications not supported")
    return false
  }

  try {
    const permission = await Notification.requestPermission()
    return permission === "granted"
  } catch (error) {
    console.error("Error requesting notification permission:", error)
    return false
  }
}

// Register service worker for push notifications
export async function registerPushNotifications() {
  if (!isPushNotificationSupported()) {
    return null
  }

  try {
    // Register service worker
    const registration = await navigator.serviceWorker.register("/service-worker.js")

    // Check permission
    const permission = await Notification.requestPermission()
    if (permission !== "granted") {
      return null
    }

    // Get push subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ""),
    })

    return subscription
  } catch (error) {
    console.error("Error registering push notifications:", error)
    return null
  }
}

// Send a test notification
export function sendTestNotification() {
  if (!("Notification" in window)) {
    alert("This browser does not support desktop notification")
    return
  }

  if (Notification.permission === "granted") {
    new Notification("BarberHub", {
      body: "This is a test notification from BarberHub",
      icon: "/favicon.ico",
    })
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        new Notification("BarberHub", {
          body: "This is a test notification from BarberHub",
          icon: "/favicon.ico",
        })
      }
    })
  }
}

// Helper function to convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}
