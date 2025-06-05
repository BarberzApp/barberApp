export type NotificationType = 'booking_confirmation' | 'booking_reminder' | 'booking_cancellation'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  bookingId: string
  createdAt: Date
  read: boolean
}

export const createBookingNotification = (
  type: NotificationType,
  bookingId: string,
  bookingTitle: string,
  bookingDate: Date
): Notification => {
  const notifications: Record<NotificationType, { title: string; message: string }> = {
    booking_confirmation: {
      title: 'Booking Confirmed',
      message: `Your booking for "${bookingTitle}" has been confirmed for ${bookingDate.toLocaleDateString()}`
    },
    booking_reminder: {
      title: 'Upcoming Booking',
      message: `Reminder: You have a booking for "${bookingTitle}" tomorrow at ${bookingDate.toLocaleTimeString()}`
    },
    booking_cancellation: {
      title: 'Booking Cancelled',
      message: `Your booking for "${bookingTitle}" has been cancelled`
    }
  }

  return {
    id: Math.random().toString(36).substring(7),
    type,
    bookingId,
    createdAt: new Date(),
    read: false,
    ...notifications[type]
  }
} 