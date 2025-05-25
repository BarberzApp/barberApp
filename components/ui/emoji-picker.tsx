"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type EmojiCategory = "Smileys & People" | "Animals & Nature" | "Food & Drink" | "Activities" | "Objects" | "Symbols" | "Flags"

const EMOJI_CATEGORIES: Record<EmojiCategory, string[]> = {
  "Smileys & People": ["😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂", "🙃", "😉", "😌", "😍", "🥰"],
  "Animals & Nature": ["🐶", "🐱", "🐭", "🐹", "🐰", "🦊", "🐻", "🐼", "🐨", "🐯", "🦁", "🐮", "🐷", "🐸", "🐵"],
  "Food & Drink": ["🍎", "🍐", "🍊", "🍋", "🍌", "🍉", "🍇", "🍓", "🍈", "🍒", "🍑", "🥭", "🍍", "🥥", "🥝"],
  "Activities": ["⚽", "🏀", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🎱", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏"],
  "Objects": ["⌚", "📱", "💻", "⌨️", "🖥", "🖨", "🖱", "🖲", "🕹", "🗜", "💽", "💾", "💿", "📀", "📼"],
  "Symbols": ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "💔", "💯", "💢", "💥", "💫", "💦", "💨", "🕳"],
  "Flags": ["🏳️", "🏴", "🏁", "🚩", "🏳️‍🌈", "🏴‍☠️", "🇦🇫", "🇦🇽", "🇦🇱", "🇩🇿", "🇦🇸", "🇦🇩", "🇦🇴", "🇦🇮", "🇦🇶"]
}

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void
}

export function EmojiPicker({ onEmojiSelect }: EmojiPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<EmojiCategory>("Smileys & People")

  return (
    <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as EmojiCategory)}>
      <TabsList className="w-full justify-start">
        {Object.keys(EMOJI_CATEGORIES).map((category) => (
          <TabsTrigger key={category} value={category}>
            {EMOJI_CATEGORIES[category as EmojiCategory][0]}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={selectedCategory} className="mt-2">
        <ScrollArea className="h-[200px]">
          <div className="grid grid-cols-8 gap-1 p-2">
            {EMOJI_CATEGORIES[selectedCategory].map((emoji) => (
              <Button
                key={emoji}
                variant="ghost"
                className="h-8 w-8 p-0"
                onClick={() => onEmojiSelect(emoji)}
              >
                {emoji}
              </Button>
            ))}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  )
} 