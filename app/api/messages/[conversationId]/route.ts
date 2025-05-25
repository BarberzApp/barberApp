import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { NextRequest } from "next/server"

interface RouteSegmentProps {
  params: {
    conversationId: string
  }
}

export async function GET(
  request: NextRequest,
  props: RouteSegmentProps
): Promise<NextResponse> {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", props.params.conversationId)
      .order("created_at", { ascending: true })

    if (error) {
      return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    }

    return NextResponse.json(messages)
  } catch (error) {
    console.error("Error fetching messages:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  props: RouteSegmentProps
): Promise<NextResponse> {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Invalid message content" }, { status: 400 })
    }

    const { data: message, error } = await supabase
      .from("messages")
      .insert([
        {
          conversation_id: props.params.conversationId,
          sender_id: user.id,
          content,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
    }

    return NextResponse.json(message)
  } catch (error) {
    console.error("Error sending message:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
} 