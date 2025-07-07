'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Calendar, Search, Camera, Settings as SettingsIcon, Plus, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/shared/hooks/use-auth-zustand'

const navActions = [
  {
    label: 'Calendar',
    icon: Calendar,
    href: '/calendar',
  },
  {
    label: 'Browse',
    icon: Search,
    href: '/browse',
  },
  // Center action is handled separately
  {
    label: 'Profile',
    icon: Camera,
    href: '/settings/barber-profile',
  },
  {
    label: 'Settings',
    icon: SettingsIcon,
    href: '/settings',
  },
]

export function FloatingNav() {
  const [plusOpen, setPlusOpen] = useState(false)
  const [pathname, setPathname] = useState('')
  const [mounted, setMounted] = useState(false)
  const router = useRouter()
  const { user } = useAuth()

  useEffect(() => {
    setMounted(true);
    setPathname(window.location.pathname);
  }, []);

  // Don't show on certain pages
  const hideOnPages = ['/login', '/register', '/onboarding']
  if (!mounted || hideOnPages.some(page => pathname.startsWith(page))) {
    return null
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-end justify-center w-full pointer-events-none">
      <motion.div
        className="relative flex items-end justify-center"
        style={{ width: '340px', maxWidth: '90vw' }}
      >
        {/* Dock Bubble - Only visible when expanded */}
        <AnimatePresence>
          {plusOpen && (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute left-0 right-0 mx-auto flex items-center justify-between bg-[#7C3AED] shadow-2xl rounded-full px-6 py-3"
              style={{
                minHeight: '88px',
                height: '88px',
                width: '100%',
                boxShadow: '0 8px 32px rgba(124,58,237,0.18)',
                pointerEvents: 'auto',
                transition: 'height 0.2s cubic-bezier(.4,2,.6,1)',
                marginBottom: '0px',
              }}
            >
              {/* Left icons */}
              <div className="flex items-center gap-2">
                {navActions.slice(0, 2).map((action) => (
                  <Link key={action.label} href={action.href} className="pointer-events-auto">
                    <motion.button
                      className={`flex flex-col items-center justify-center text-white rounded-full p-2 focus:outline-none transition-colors ${
                        pathname === action.href ? 'bg-white/20' : 'hover:bg-white/10'
                      }`}
                      whileHover={{ scale: 1.25 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ background: 'transparent' }}
                      aria-label={action.label}
                    >
                      <action.icon className="h-7 w-7 mb-0.5" />
                    </motion.button>
                  </Link>
                ))}
              </div>
              {/* Center space for the button */}
              <div style={{ width: 72, height: 72 }} />
              {/* Right icons */}
              <div className="flex items-center gap-2">
                {navActions.slice(2).map((action) => (
                  <Link key={action.label} href={action.href} className="pointer-events-auto">
                    <motion.button
                      className={`flex flex-col items-center justify-center text-white rounded-full p-2 focus:outline-none transition-colors ${
                        pathname === action.href ? 'bg-white/20' : 'hover:bg-white/10'
                      }`}
                      whileHover={{ scale: 1.25 }}
                      whileTap={{ scale: 0.95 }}
                      style={{ background: 'transparent' }}
                      aria-label={action.label}
                    >
                      <action.icon className="h-7 w-7 mb-0.5" />
                    </motion.button>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Center menu/X button, always visible with raised effect */}
        <motion.button
          onClick={() => setPlusOpen((v) => !v)}
          className="pointer-events-auto flex items-center justify-center bg-white text-[#7C3AED] rounded-full shadow-lg border-4 border-[#7C3AED] relative"
          style={{
            width: plusOpen ? 72 : 64,
            height: plusOpen ? 72 : 64,
            marginBottom: 0,
            marginTop: '-10px',
            zIndex: 2,
            transition: 'all 0.2s cubic-bezier(.4,2,.6,1)',
          }}
          whileTap={{ scale: 0.92, rotate: 90 }}
          animate={{ 
            scale: plusOpen ? 1.1 : 1,
            y: plusOpen ? -8 : 0
          }}
          aria-label={plusOpen ? 'Close menu' : 'Open menu'}
        >
          {/* Animated menu/X lines */}
          <motion.span
            className="absolute left-1/2 w-8 h-1 rounded bg-[#7C3AED]"
            style={{
              translateX: '-50%',
              top: plusOpen ? '50%' : '40%',
            }}
            animate={{
              rotate: plusOpen ? 45 : 0,
              top: plusOpen ? '50%' : '40%',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          />
          <motion.span
            className="absolute left-1/2 w-8 h-1 rounded bg-[#7C3AED]"
            style={{
              translateX: '-50%',
              top: plusOpen ? '50%' : '60%',
            }}
            animate={{
              rotate: plusOpen ? -45 : 0,
              top: plusOpen ? '50%' : '60%',
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          />
        </motion.button>
      </motion.div>
    </div>
  )
} 