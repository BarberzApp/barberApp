// This is a mock notification service
// In a real app, this would use a real notification system like Firebase Cloud Messaging

import { supabase } from '../lib/supabase'

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

// Remove mock notifications
export const getNotifications = async (userId: string): Promise<Notification[]> => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching notifications:', error)
    return []
  }
}

// Mark a notification as read
export const markNotificationAsRead = async (notificationId: string, userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
}

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return false
  }
}

// Send a notification (mock implementation)
export const sendNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, any>,
): Promise<Notification> => {
  try {
    const notification = {
      user_id: userId,
      type,
      title,
      message,
      data,
      read: false,
      created_at: new Date().toISOString(),
    }

    const { data: newNotification, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    if (error) throw error
    return newNotification
  } catch (error) {
    console.error('Error sending notification:', error)
    throw error
  }
}
