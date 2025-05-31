'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send } from 'lucide-react'

interface MessageInputProps {
  conversationId: string
  onSend: (content: string) => Promise<void>
}

export function MessageInput({ conversationId, onSend }: MessageInputProps) {
  const [content, setContent] = useState('')
  const [isSending, setIsSending] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || isSending) return

    setIsSending(true)
    try {
      await onSend(content)
      setContent('')
    } catch (error) {
      console.error('Failed to send message:', error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
      <Input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type a message..."
        disabled={isSending}
        className="flex-1"
      />
      <Button type="submit" disabled={isSending || !content.trim()}>
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
} 