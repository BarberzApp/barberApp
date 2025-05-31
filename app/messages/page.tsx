"use client"

import { ChatLayout, type Conversation } from "@/components/messaging/chat-layout"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"

export default function MessagesPage() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConversations = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            recipient:recipient_id (
              id,
              name,
              image,
              role
            ),
            last_message:last_message_id (
              id,
              text,
              timestamp,
              sender_id,
              is_read
            )
          `)
          .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
          .order('updated_at', { ascending: false })

        if (error) throw error

        // Transform the data to match the ChatLayout's expected format
        const transformedConversations = (data || []).map(conv => ({
          id: conv.id,
          recipient: {
            id: conv.recipient.id,
            name: conv.recipient.name,
            image: conv.recipient.image,
            role: conv.recipient.role as "client" | "barber",
            lastSeen: conv.recipient.last_seen
          },
          lastMessage: {
            text: conv.last_message?.text || '',
            timestamp: new Date(conv.last_message?.timestamp || conv.updated_at),
            isRead: conv.last_message?.is_read || false,
            sender: (conv.last_message?.sender_id === user.id ? 'me' : 'them') as 'me' | 'them'
          },
          unreadCount: conv.unread_count || 0
        }))

        setConversations(transformedConversations)
      } catch (error) {
        console.error('Error fetching conversations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [user])

  if (loading) {
  return (
      <div className="container py-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-barber-600 mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading conversations...</p>
        </div>
    </div>
  )
  }

  return <ChatLayout conversations={conversations} />
}
