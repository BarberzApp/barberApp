import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/shared/hooks/use-auth-zustand'
import { useToast } from '@/shared/components/ui/use-toast'

export interface VideoReel {
  id: string
  barber_id: string
  title: string
  description?: string
  url: string
  thumbnail?: string
  category: string
  duration: number
  views: number
  likes: number
  shares: number
  tags: string[]
  is_featured: boolean
  is_public: boolean
  created_at: string
  updated_at: string
  comments_count?: number // Added for per-reel stats
}

export interface ReelAnalytics {
  total_views: number
  total_likes: number
  total_shares: number
  engagement_rate: number
  top_performing_category: string
  recent_uploads: number
  category_breakdown: Record<string, { views: number; likes: number; count: number }>
}

export interface CreateReelData {
  title: string
  description?: string
  url: string
  thumbnail?: string
  category: string
  duration: number
  tags: string[]
  is_featured?: boolean
  is_public?: boolean
}

export function useReels() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [reels, setReels] = useState<VideoReel[]>([])
  const [analytics, setAnalytics] = useState<ReelAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  // Fetch reels for current barber
  const fetchReels = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // Get barber ID
      const { data: barberData, error: barberError } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (barberError) throw barberError

      // Fetch reels
      const { data: reelsData, error: reelsError } = await supabase
        .from('reels')
        .select('*')
        .eq('barber_id', barberData.id)
        .order('created_at', { ascending: false })

      if (reelsError) throw reelsError

      setReels(reelsData || [])
      
      // Calculate analytics
      if (reelsData && reelsData.length > 0) {
        calculateAnalytics(reelsData)
      }

    } catch (error) {
      console.error('Error fetching reels:', error)
      toast({
        title: 'Error',
        description: 'Failed to load your reels.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [user, toast])

  // Calculate analytics from reels data
  const calculateAnalytics = useCallback((reelsData: VideoReel[]) => {
    const totalViews = reelsData.reduce((sum, reel) => sum + reel.views, 0)
    const totalLikes = reelsData.reduce((sum, reel) => sum + reel.likes, 0)
    const totalShares = reelsData.reduce((sum, reel) => sum + reel.shares, 0)
    const engagementRate = totalViews > 0 ? ((totalLikes + totalShares) / totalViews) * 100 : 0

    // Category breakdown
    const categoryBreakdown = reelsData.reduce((acc, reel) => {
      if (!acc[reel.category]) {
        acc[reel.category] = { views: 0, likes: 0, count: 0 }
      }
      acc[reel.category].views += reel.views
      acc[reel.category].likes += reel.likes
      acc[reel.category].count += 1
      return acc
    }, {} as Record<string, { views: number; likes: number; count: number }>)

    // Top performing category
    const topCategory = Object.entries(categoryBreakdown).sort(([,a], [,b]) => b.views - a.views)[0]?.[0] || 'hair-styling'

    // Recent uploads (last 7 days)
    const recentUploads = reelsData.filter(reel => {
      const daysAgo = (Date.now() - new Date(reel.created_at).getTime()) / (1000 * 60 * 60 * 24)
      return daysAgo <= 7
    }).length

    setAnalytics({
      total_views: totalViews,
      total_likes: totalLikes,
      total_shares: totalShares,
      engagement_rate: engagementRate,
      top_performing_category: topCategory,
      recent_uploads: recentUploads,
      category_breakdown: categoryBreakdown
    })
  }, [])

  // Create new reel
  const createReel = useCallback(async (reelData: CreateReelData) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to create reels.',
        variant: 'destructive',
      })
      return null
    }

    try {
      setUploading(true)

      // Get barber ID
      const { data: barberData, error: barberError } = await supabase
        .from('barbers')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (barberError) throw barberError

      // Create reel
      const { data: newReel, error: createError } = await supabase
        .from('reels')
        .insert({
          barber_id: barberData.id,
          ...reelData,
          is_featured: reelData.is_featured ?? false,
          is_public: reelData.is_public ?? true
        })
        .select()
        .single()

      if (createError) throw createError

      setReels(prev => [newReel, ...prev])
      
      toast({
        title: 'Success',
        description: 'Reel created successfully!',
      })

      return newReel

    } catch (error) {
      console.error('Error creating reel:', error)
      toast({
        title: 'Error',
        description: 'Failed to create reel. Please try again.',
        variant: 'destructive',
      })
      return null
    } finally {
      setUploading(false)
    }
  }, [user, toast])

  // Update reel
  const updateReel = useCallback(async (reelId: string, updates: Partial<CreateReelData>) => {
    try {
      const { data: updatedReel, error } = await supabase
        .from('reels')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', reelId)
        .select()
        .single()

      if (error) throw error

      setReels(prev => prev.map(reel => 
        reel.id === reelId ? updatedReel : reel
      ))

      toast({
        title: 'Success',
        description: 'Reel updated successfully!',
      })

      return updatedReel

    } catch (error) {
      console.error('Error updating reel:', error)
      toast({
        title: 'Error',
        description: 'Failed to update reel. Please try again.',
        variant: 'destructive',
      })
      return null
    }
  }, [toast])

  // Delete reel
  const deleteReel = useCallback(async (reelId: string) => {
    try {
      const { error } = await supabase
        .from('reels')
        .delete()
        .eq('id', reelId)

      if (error) throw error

      setReels(prev => prev.filter(reel => reel.id !== reelId))

      toast({
        title: 'Success',
        description: 'Reel deleted successfully!',
      })

    } catch (error) {
      console.error('Error deleting reel:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete reel. Please try again.',
        variant: 'destructive',
      })
    }
  }, [toast])

  // Track view
  const trackView = useCallback(async (reelId: string) => {
    if (!user) return

    try {
      // Check if user already viewed this reel
      const { data: existingView } = await supabase
        .from('reel_analytics')
        .select('id')
        .eq('reel_id', reelId)
        .eq('user_id', user.id)
        .eq('action_type', 'view')
        .single()

      if (!existingView) {
        // Record view
        await supabase
          .from('reel_analytics')
          .insert({
            reel_id: reelId,
            user_id: user.id,
            action_type: 'view'
          })

        // Update local state
        setReels(prev => prev.map(reel => 
          reel.id === reelId 
            ? { ...reel, views: reel.views + 1 }
            : reel
        ))
      }
    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }, [user])

  // Track like
  const trackLike = useCallback(async (reelId: string) => {
    if (!user) return

    try {
      // Check if user already liked this reel
      const { data: existingLike } = await supabase
        .from('reel_analytics')
        .select('id')
        .eq('reel_id', reelId)
        .eq('user_id', user.id)
        .eq('action_type', 'like')
        .single()

      if (existingLike) {
        // Unlike
        await supabase
          .from('reel_analytics')
          .delete()
          .eq('id', existingLike.id)

        setReels(prev => prev.map(reel => 
          reel.id === reelId 
            ? { ...reel, likes: Math.max(0, reel.likes - 1) }
            : reel
        ))
      } else {
        // Like
        await supabase
          .from('reel_analytics')
          .insert({
            reel_id: reelId,
            user_id: user.id,
            action_type: 'like'
          })

        setReels(prev => prev.map(reel => 
          reel.id === reelId 
            ? { ...reel, likes: reel.likes + 1 }
            : reel
        ))
      }
    } catch (error) {
      console.error('Error tracking like:', error)
    }
  }, [user])

  // Track share
  const trackShare = useCallback(async (reelId: string) => {
    if (!user) return

    try {
      await supabase
        .from('reel_analytics')
        .insert({
          reel_id: reelId,
          user_id: user.id,
          action_type: 'share'
        })

      setReels(prev => prev.map(reel => 
        reel.id === reelId 
          ? { ...reel, shares: reel.shares + 1 }
          : reel
      ))
    } catch (error) {
      console.error('Error tracking share:', error)
    }
  }, [user])

  // Get reel by ID
  const getReelById = useCallback((reelId: string) => {
    return reels.find(reel => reel.id === reelId)
  }, [reels])

  // Get reels by category
  const getReelsByCategory = useCallback((category: string) => {
    if (category === 'all') return reels
    return reels.filter(reel => reel.category === category)
  }, [reels])

  // Get featured reels
  const getFeaturedReels = useCallback(() => {
    return reels.filter(reel => reel.is_featured)
  }, [reels])

  // Toggle reel featured status
  const toggleFeatured = useCallback(async (reelId: string) => {
    const reel = getReelById(reelId)
    if (!reel) return

    await updateReel(reelId, { is_featured: !reel.is_featured })
  }, [getReelById, updateReel])

  // Toggle reel public status
  const togglePublic = useCallback(async (reelId: string) => {
    const reel = getReelById(reelId)
    if (!reel) return

    await updateReel(reelId, { is_public: !reel.is_public })
  }, [getReelById, updateReel])

  // Load reels on mount
  useEffect(() => {
    fetchReels()
  }, [fetchReels])

  return {
    reels,
    analytics,
    loading,
    uploading,
    createReel,
    updateReel,
    deleteReel,
    trackView,
    trackLike,
    trackShare,
    getReelById,
    getReelsByCategory,
    getFeaturedReels,
    toggleFeatured,
    togglePublic,
    refreshReels: fetchReels
  }
} 