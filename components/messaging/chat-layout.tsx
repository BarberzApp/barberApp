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
          const { data: { user } } = await supabase.auth.getUser()
          if (!user) throw new Error('Not authenticated')

          const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('conversation_id', activeConversationId)
            .order('created_at', { ascending: true })

          if (error) throw error

          // Transform messages to match the expected format
          const transformedMessages: Message[] = (data || []).map(msg => ({
            id: msg.id,
            text: msg.content,
            sender: msg.sender_id === user.id ? 'me' : 'them' as const,
            timestamp: new Date(msg.created_at),
            status: msg.status || 'sent'
          }))

          setMessages(prev => ({ ...prev, [activeConversationId]: transformedMessages }))
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
          async (payload) => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const newMessage: Message = {
              id: payload.new.id,
              text: payload.new.content,
              sender: payload.new.sender_id === user.id ? 'me' : 'them' as const,
              timestamp: new Date(payload.new.created_at),
              status: payload.new.status || 'sent'
            }
            setMessages(prev => ({
              ...prev,
              [activeConversationId]: [...(prev[activeConversationId] || []), newMessage]
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
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: message, error } = await supabase
        .from('messages')
        .insert([
          {
            conversation_id: activeConversationId,
            sender_id: user.id,
            content: text,
            status: 'sent'
          }
        ])
        .select()
        .single()

      if (error) throw error

      const newMessage: Message = {
        id: message.id,
        text: message.content,
        sender: 'me' as const,
        timestamp: new Date(message.created_at),
        status: message.status || 'sent'
      }
      
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
