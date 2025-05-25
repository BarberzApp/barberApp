"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, Send, MoreVertical, Phone, Video, Calendar, Image as ImageIcon, Smile, Paperclip } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Conversation, Message } from "@/components/messaging/chat-layout"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { EmojiPicker } from "@/components/ui/emoji-picker"
import Link from "next/link"

interface MessageThreadProps {
  conversation: Conversation
  messages: Message[]
  onSendMessage: (text: string, attachments?: File[]) => void
  onBack: () => void
  isLoading?: boolean
}

export function MessageThread({ conversation, messages, onSendMessage, onBack, isLoading }: MessageThreadProps) {
  const [newMessage, setNewMessage] = useState("")
  const [attachments, setAttachments] = useState<File[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSend = async () => {
    if (!newMessage.trim() || isSending) return

    setIsSending(true)
    try {
      await onSendMessage(newMessage, attachments)
      setNewMessage("")
      setAttachments([])
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(Array.from(e.target.files))
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji)
  }

  const formatMessageTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  const formatMessageDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return "Today"
    } else if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return "Yesterday"
    } else {
      return date.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })
    }
  }

  // Group messages by date
  const groupedMessages: { date: string; messages: Message[] }[] = []
  let currentDate = ""

  messages.forEach((message) => {
    const messageDate = formatMessageDate(message.timestamp)

    if (messageDate !== currentDate) {
      currentDate = messageDate
      groupedMessages.push({
        date: messageDate,
        messages: [message],
      })
    } else {
      groupedMessages[groupedMessages.length - 1].messages.push(message)
    }
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Avatar>
            <AvatarImage src={conversation.recipient.image || "/placeholder.svg"} alt={conversation.recipient.name} />
            <AvatarFallback>{conversation.recipient.name.charAt(0)}</AvatarFallback>
          </Avatar>

          <div>
            <h3 className="font-medium">{conversation.recipient.name}</h3>
            <p className="text-xs text-muted-foreground">
              {isTyping ? "Typing..." : conversation.recipient.lastSeen === "online"
                ? "Online"
                : conversation.recipient.lastSeen
                  ? `Last seen ${conversation.recipient.lastSeen}`
                  : conversation.recipient.role.charAt(0).toUpperCase() + conversation.recipient.role.slice(1)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/book/${conversation.recipient.id}`}>
              <Calendar className="h-5 w-5" />
              <span className="sr-only">Book</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
            <span className="sr-only">Call</span>
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
            <span className="sr-only">Video</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View profile</DropdownMenuItem>
              <DropdownMenuItem>Clear conversation</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Block user</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          groupedMessages.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6">
              <div className="flex justify-center mb-4">
                <div className="bg-muted text-xs px-3 py-1 rounded-full text-muted-foreground">{group.date}</div>
              </div>

              {group.messages.map((message, messageIndex) => {
                const isMe = message.sender === "me"
                const showAvatar = messageIndex === 0 || group.messages[messageIndex - 1].sender !== message.sender

                return (
                  <div key={message.id} className={cn("flex mb-2", isMe ? "justify-end" : "justify-start")}>
                    {!isMe && showAvatar && (
                      <Avatar className="h-8 w-8 mr-2 mt-1">
                        <AvatarImage
                          src={conversation.recipient.image || "/placeholder.svg"}
                          alt={conversation.recipient.name}
                        />
                        <AvatarFallback>{conversation.recipient.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}

                    {!isMe && !showAvatar && <div className="w-10" />}

                    <div className="group relative">
                      <div
                        className={cn(
                          "max-w-[75%] px-4 py-2 rounded-lg",
                          isMe ? "bg-barber-500 text-white rounded-tr-none" : "bg-muted rounded-tl-none",
                        )}
                      >
                        {message.attachments?.map((attachment, index) => (
                          <div key={index} className="mb-2">
                            {attachment.type.startsWith('image/') ? (
                              <img
                                src={URL.createObjectURL(attachment)}
                                alt={`Attachment ${index + 1}`}
                                className="max-w-full rounded-lg"
                              />
                            ) : (
                              <div className="flex items-center gap-2 p-2 bg-background/50 rounded">
                                <Paperclip className="h-4 w-4" />
                                <span className="text-sm truncate">{attachment.name}</span>
                              </div>
                            )}
                          </div>
                        ))}
                        <p>{message.text}</p>
                        <div className={cn("text-xs mt-1", isMe ? "text-barber-100" : "text-muted-foreground")}>
                          {formatMessageTime(message.timestamp)}
                          {isMe && (
                            <span className="ml-1">
                              {message.status === "sending" && "•"}
                              {message.status === "sent" && "✓"}
                              {message.status === "delivered" && "✓✓"}
                              {message.status === "read" && "✓✓"}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <Smile className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t">
        {attachments.length > 0 && (
          <div className="flex gap-2 mb-2">
            {attachments.map((file, index) => (
              <div key={index} className="relative">
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${index + 1}`}
                    className="h-16 w-16 object-cover rounded"
                  />
                ) : (
                  <div className="h-16 w-16 flex items-center justify-center bg-muted rounded">
                    <Paperclip className="h-6 w-6" />
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-background"
                  onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}
                >
                  ×
                </Button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx"
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
          >
            <Paperclip className="h-5 w-5" />
            <span className="sr-only">Attach file</span>
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <Smile className="h-5 w-5" />
                <span className="sr-only">Add emoji</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <EmojiPicker onEmojiSelect={handleEmojiSelect} />
            </PopoverContent>
          </Popover>

          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1"
            disabled={isSending}
          />

          <Button onClick={handleSend} disabled={isSending || !newMessage.trim() && attachments.length === 0}>
            <Send className="h-5 w-5" />
            <span className="sr-only">Send message</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
