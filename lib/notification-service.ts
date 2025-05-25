// This is a mock notification service
// In a real app, this would use a real notification system like Firebase Cloud Messaging

export type NotificationType =
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_reminder"
  | "payment_success"
  | "payment_failed"
  | "new_message"
  | "new_review"
  | "application_status"

export type Notification = {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  read: boolean
  createdAt: Date
}

// Mock notifications
const mockNotifications: Record<string, Notification[]> = {
  c1: [
    {
      id: "notif1",
      userId: "c1",
      type: "booking_confirmed",
      title: "Booking Confirmed",
      message: "Your appointment with Alex Johnson on Tuesday at 2:00 PM has been confirmed.",
      data: { bookingId: "booking_1" },
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: "notif2",
      userId: "c1",
      type: "payment_success",
      title: "Payment Successful",
      message: "Your payment of $45 for the appointment with Alex Johnson has been processed successfully.",
      data: { bookingId: "booking_1", amount: 45 },
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2 - 1000 * 60 * 5), // 2 hours and 5 minutes ago
    },
    {
      id: "notif3",
      userId: "c1",
      type: "new_message",
      title: "New Message",
      message: "You have a new message from Maria Garcia.",
      data: { conversationId: "conv2" },
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
  ],
  b1: [
    {
      id: "notif4",
      userId: "b1",
      type: "booking_created",
      title: "New Booking",
      message: "John Client has booked an appointment with you for Tuesday at 2:00 PM.",
      data: { bookingId: "booking_1" },
      read: true,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
    },
    {
      id: "notif5",
      userId: "b1",
      type: "new_review",
      title: "New Review",
      message: "John Client has left a 5-star review for your service.",
      data: { reviewId: "review_b1_1" },
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    },
  ],
  biz1: [
    {
      id: "notif6",
      userId: "biz1",
      type: "application_status",
      title: "New Job Application",
      message: "Olivia Rodriguez has applied for the Senior Barber position.",
      data: { applicationId: "app1" },
      read: false,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
    },
  ],
}

// Get notifications for a user
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  return mockNotifications[userId] || []
}

// Mark a notification as read
export const markNotificationAsRead = async (notificationId: string, userId: string): Promise<boolean> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 300))

  // Update the notification in our mock data
  if (mockNotifications[userId]) {
    const notificationIndex = mockNotifications[userId].findIndex((n) => n.id === notificationId)
    if (notificationIndex !== -1) {
      mockNotifications[userId][notificationIndex].read = true
      return true
    }
  }

  return false
}

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Update all notifications in our mock data
  if (mockNotifications[userId]) {
    mockNotifications[userId].forEach((n) => {
      n.read = true
    })
    return true
  }

  return false
}

// Send a notification (mock implementation)
export const sendNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, any>,
): Promise<Notification> => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 700))

  const notification: Notification = {
    id: `notif_${Math.random().toString(36).substring(2, 15)}`,
    userId,
    type,
    title,
    message,
    data,
    read: false,
    createdAt: new Date(),
  }

  // Add to our mock data
  if (!mockNotifications[userId]) {
    mockNotifications[userId] = []
  }

  mockNotifications[userId].unshift(notification)

  return notification
}
