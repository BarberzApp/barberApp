"use client"

import { ChatLayout } from "@/components/messaging/chat-layout"
import { useEffect, useState } from "react"

// Mock conversations data (same as in messages/page.tsx)
const mockConversations = [
  {
    id: "conv1",
    recipient: {
      id: "b1",
      name: "Alex Johnson",
      image: "/placeholder.svg?height=100&width=100",
      role: "barber" as const,
      lastSeen: "online",
    },
    lastMessage: {
      text: "Thanks! Looking forward to it",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 75), // 2 days and 1 hour 15 minutes ago
      isRead: true,
      sender: "me" as const,
    },
    unreadCount: 0,
  },
  {
    id: "conv2",
    recipient: {
      id: "b2",
      name: "Maria Garcia",
      image: "/placeholder.svg?height=100&width=100",
      role: "barber" as const,
      lastSeen: "2 hours ago",
    },
    lastMessage: {
      text: "3pm on Saturday sounds perfect",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 1), // 1 hour ago
      isRead: false,
      sender: "me" as const,
    },
    unreadCount: 0,
  },
  {
    id: "conv3",
    recipient: {
      id: "b3",
      name: "Jamal Williams",
      image: "/placeholder.svg?height=100&width=100",
      role: "barber" as const,
      lastSeen: "yesterday",
    },
    lastMessage: {
      text: "I'd recommend in about 3-4 weeks. You can book anytime through the app.",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 21), // 21 hours ago
      isRead: true,
      sender: "them" as const,
    },
    unreadCount: 2,
  },
]

type Props = {
  params: { conversationId: string }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function ConversationPage({ params }: Props) {
  const conversationId = params.conversationId
  const [conversations, setConversations] = useState(mockConversations)

  // In a real app, you would fetch conversations here
  useEffect(() => {
    // Example of how you would fetch conversations:
    // const fetchConversations = async () => {
    //   const response = await fetch('/api/conversations')
    //   const data = await response.json()
    //   setConversations(data)
    // }
    // fetchConversations()
  }, [])

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Messages</h1>
      <ChatLayout conversations={conversations} initialConversationId={conversationId} />
    </div>
  )
}
