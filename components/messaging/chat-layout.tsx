"use client"

import { useState, useEffect } from "react"
import { ConversationList } from "@/components/messaging/conversation-list"
import { MessageThread } from "@/components/messaging/message-thread"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { createClient } from "@/lib/supabase/client"

export type Conversation = {
  id: string
  recipient: {
    id: string
    name: string
    image?: string
    role: "client" | "barber"
    lastSeen?: string
  }
  lastMessage: {
    text: string
    timestamp: Date
    isRead: boolean
    sender: "me" | "them"
  }
  unreadCount: number
}

export type Message = {
  id: string
  text: string
  sender: "me" | "them"
  timestamp: Date
  status: "sending" | "sent" | "delivered" | "read"
  attachments?: File[]
}

interface ChatLayoutProps {
  conversations: Conversation[]
  initialConversationId?: string
}

// Mock messages data (in a real app, this would come from an API)
const mockMessages: Record<string, Message[]> = {
  conv1: [
    {
      id: "m1",
      text: "Hey, I'd like to book an appointment for next week",
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
      sender: "me",
      status: "read",
    },
    // ... rest of the mock messages ...
  ],
  // ... other conversations ...
}

export function ChatLayout({ conversations, initialConversationId }: ChatLayoutProps) {
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>(initialConversationId)
  const [isMobileListVisible, setIsMobileListVisible] = useState(!initialConversationId)
  const [messages, setMessages] = useState<Record<string, Message[]>>({})
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()

  const activeConversation = conversations.find((c) => c.id === activeConversationId)

  // Fetch messages for the active conversation
  useEffect(() => {
    if (activeConversationId) {
      const fetchMessages = async () => {
        setIsLoading(true)
        try {
          const response = await fetch(`/api/messages/${activeConversationId}`)
          if (!response.ok) {
            throw new Error("Failed to fetch messages")
          }
          const data = await response.json()
          setMessages(prev => ({ ...prev, [activeConversationId]: data }))
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to load messages",
            variant: "destructive",
          })
        } finally {
          setIsLoading(false)
        }
      }
      fetchMessages()

      // Subscribe to new messages
      const channel = supabase
        .channel(`messages:${activeConversationId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "messages",
            filter: `conversation_id=eq.${activeConversationId}`,
          },
          (payload) => {
            setMessages(prev => ({
              ...prev,
              [activeConversationId]: [...(prev[activeConversationId] || []), payload.new as Message]
            }))
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [activeConversationId, toast, supabase])

  const handleSelectConversation = (conversationId: string) => {
    setActiveConversationId(conversationId)
    setIsMobileListVisible(false)
  }

  const handleBackToList = () => {
    setIsMobileListVisible(true)
  }

  const handleSendMessage = async (text: string) => {
    if (!activeConversationId) return

    try {
      const response = await fetch(`/api/messages/${activeConversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error("Failed to send message")
      }

      const newMessage = await response.json()
      
      setMessages(prev => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), newMessage]
      }))
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      })
    }
  }

  return (
    <Card className="flex h-[calc(100vh-8rem)] overflow-hidden">
      <div className={cn("w-full md:w-80 border-r md:flex flex-col", isMobileListVisible ? "flex" : "hidden")}>
        <ConversationList
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
        />
      </div>

      <div className={cn("flex-1 flex flex-col", isMobileListVisible ? "hidden" : "flex")}>
        {activeConversation ? (
          <MessageThread
            conversation={activeConversation}
            messages={messages[activeConversationId || ""] || []}
            onSendMessage={handleSendMessage}
            onBack={handleBackToList}
            isLoading={isLoading}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 text-center text-muted-foreground">
            <div>
              <p>Select a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
