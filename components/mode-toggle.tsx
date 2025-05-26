"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useCallback } from "react"

export function ModeToggle() {
  const { setTheme, theme } = useTheme()

  const handleLightClick = useCallback(() => {
    setTheme("light")
  }, [setTheme])

  const handleDarkClick = useCallback(() => {
    setTheme("dark")
  }, [setTheme])

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-9 w-9 rounded-md"
    >
      <Sun
        className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0"
        onClick={handleLightClick}
      />
      <Moon
        className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100"
        onClick={handleDarkClick}
      />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
