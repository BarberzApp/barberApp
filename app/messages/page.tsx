"use client"

import { ChatLayout } from "@/components/messaging/chat-layout"
import type { Conversation } from "@/components/messaging/chat-layout"

// Mock conversations data
const mockConversations: Conversation[] = [
  {
    id: "1",
    recipient: {
      id: "1",
      name: "John Smith",
      image: "/placeholder.svg",
      role: "barber" as const,
      lastSeen: "2 minutes ago",
    },
    lastMessage: {
      text: "Hey, are you available for a haircut tomorrow?",
      timestamp: new Date(),
      isRead: true,
      sender: "them",
    },
    unreadCount: 0,
  },
  {
    id: "2",
    recipient: {
      id: "2",
      name: "Sarah Johnson",
      image: "/placeholder.svg",
      role: "client" as const,
      lastSeen: "5 minutes ago",
    },
    lastMessage: {
      text: "Thanks for the great service!",
      timestamp: new Date(),
      isRead: false,
      sender: "me",
    },
    unreadCount: 1,
  },
]

export default function MessagesPage() {
  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <ChatLayout conversations={mockConversations} />
    </div>
  )
}
