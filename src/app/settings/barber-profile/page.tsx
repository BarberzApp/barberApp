'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/components/ui/avatar'
import { Switch } from '@/shared/components/ui/switch'
import { Label } from '@/shared/components/ui/label'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { supabase } from '@/shared/lib/supabase'
import { useToast } from '@/shared/components/ui/use-toast'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Camera, MapPin, Phone, Mail, Instagram, Twitter, Facebook, Globe, Edit3, Save, X, Loader2 } from 'lucide-react'
import { SpecialtyAutocomplete } from '@/shared/components/ui/specialty-autocomplete'

interface ProfileFormData {
  name: string
  email: string
  phone: string
  bio: string
  location: string
  businessName: string
  specialties: string
  socialMedia: {
    instagram: string
    twitter: string
    facebook: string
  }
  isPublic: boolean
}

export default function BarberProfileSetup() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/profile')
  }, [router])
  return null
} 