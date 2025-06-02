"use client"

import { ChatLayout, type Conversation } from "@/components/messaging/chat-layout"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function MessagesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return

    const fetchConversations = async () => {
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
        setError(null)
      } catch (error) {
        console.error('Error fetching conversations:', error)
        setError('Failed to load conversations. Please try again.')
        toast({
          title: "Error",
          description: "Failed to load conversations. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()

    // Set up real-time subscription
    const subscription = supabase
      .channel('conversations')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `sender_id=eq.${user.id} OR recipient_id=eq.${user.id}`
        },
        (payload) => {
          // Refresh conversations when there's a change
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user, toast])

  if (!user) {
    return (
      <div className="container py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>Please log in to access your messages.</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container py-8 flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return <ChatLayout conversations={conversations} />
}
