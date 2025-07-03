import React, { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { X, Plus, GripVertical, Video, Image as ImageIcon, Loader2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/shared/components/ui/dialog'
import { Badge } from '@/shared/components/ui/badge'
import { cn } from '@/lib/utils'
import { supabase } from '@/shared/lib/supabase'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useToast } from '@/shared/components/ui/use-toast'

// For drag-and-drop
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export type PortfolioItem = {
  id: string
  type: 'image' | 'video'
  url: string
  file?: File
}

interface PortfolioEditorProps {
  initialItems: PortfolioItem[]
  open: boolean
  onClose: () => void
  onSave: (items: PortfolioItem[]) => void
}

export function PortfolioEditor({ initialItems, open, onClose, onSave }: PortfolioEditorProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [items, setItems] = useState<PortfolioItem[]>(initialItems)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Drag-and-drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Handle drag end
  const handleDragEnd = (event: any) => {
    const { active, over } = event
    if (active.id !== over.id) {
      const oldIndex = items.findIndex(i => i.id === active.id)
      const newIndex = items.findIndex(i => i.id === over.id)
      setItems(arrayMove(items, oldIndex, newIndex))
    }
  }

  // Handle remove
  const handleRemove = (id: string) => {
    setItems(items.filter(i => i.id !== id))
  }

  // Handle add media
  const handleAddMedia = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (items.length + files.length > 40) {
      setError('You can have up to 40 items in your portfolio.')
      return
    }

    if (!user) {
      setError('You must be logged in to upload media.')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const newItems: PortfolioItem[] = []

      for (const file of files) {
        // Validate file type
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
          setError('Please select only image or video files.')
          continue
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          setError('File size must be less than 10MB.')
          continue
        }

        // Create a temporary URL for preview
        const tempUrl = URL.createObjectURL(file)
        const type = file.type.startsWith('video/') ? 'video' : 'image'
        
        newItems.push({
          id: `${Date.now()}-${file.name}`,
          type,
          url: tempUrl,
          file,
        })
      }

      setItems([...items, ...newItems])
    } catch (error) {
      console.error('Error adding media:', error)
      setError('Failed to add media. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  // Handle save with actual file upload
  const handleSave = async () => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'You must be logged in to save your portfolio.',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const uploadedUrls: string[] = []

      // Upload new files to Supabase storage
      for (const item of items) {
        if (item.file) {
          // Upload new file
          const fileExt = item.file.name.split('.').pop()
          const fileName = `${user.id}/portfolio/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('portfolio')
            .upload(fileName, item.file)

          if (uploadError) {
            // If bucket doesn't exist, try to create it (this might fail in production)
            if (uploadError.message.includes('bucket') || uploadError.message.includes('not found')) {
              throw new Error(`Storage bucket 'portfolio' not found. Please contact support to set up portfolio storage.`)
            }
            throw new Error(`Failed to upload ${item.file.name}: ${uploadError.message}`)
          }

          // Get public URL
          const { data: { publicUrl } } = supabase.storage
            .from('portfolio')
            .getPublicUrl(fileName)

          uploadedUrls.push(publicUrl)
        } else {
          // Keep existing URL
          uploadedUrls.push(item.url)
        }
      }

      // Update barber profile with new portfolio URLs
      const { error: updateError } = await supabase
        .from('barbers')
        .upsert({
          user_id: user.id,
          portfolio: uploadedUrls,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (updateError) {
        throw new Error(`Failed to update portfolio: ${updateError.message}`)
      }

      // Clean up temporary URLs
      items.forEach(item => {
        if (item.file && item.url.startsWith('blob:')) {
          URL.revokeObjectURL(item.url)
        }
      })

      // Convert to final format for parent component
      const finalItems: PortfolioItem[] = uploadedUrls.map((url, index) => ({
        id: `item-${index}`,
        type: url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') ? 'video' : 'image',
        url
      }))

      onSave(finalItems)
      
      toast({
        title: 'Success',
        description: 'Portfolio updated successfully!',
      })

      onClose()
    } catch (error) {
      console.error('Error saving portfolio:', error)
      setError(error instanceof Error ? error.message : 'Failed to save portfolio. Please try again.')
      
      toast({
        title: 'Error',
        description: 'Failed to save portfolio. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>Edit Portfolio</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="portfolio-upload">
              <Button asChild variant="outline" size="sm" disabled={isUploading}>
                {isUploading ? (
                  <span><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Uploading...</span>
                ) : (
                  <span><Plus className="h-4 w-4 mr-1" /> Add Media</span>
                )}
              </Button>
              <input
                id="portfolio-upload"
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={handleAddMedia}
                disabled={isUploading}
              />
            </label>
            <span className="text-xs text-muted-foreground">{items.length}/40 items</span>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {items.map((item, idx) => (
                  <SortablePortfolioItem
                    key={item.id}
                    id={item.id}
                    item={item}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving || items.length === 0}>
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Sortable item wrapper
function SortablePortfolioItem({ id, item, onRemove }: { id: string, item: PortfolioItem, onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.7 : 1,
  }
  return (
    <div ref={setNodeRef} style={style} className={cn('relative group rounded-lg overflow-hidden border bg-muted aspect-square flex items-center justify-center', isDragging && 'ring-2 ring-primary')}
      {...attributes} {...listeners}
    >
      {item.type === 'image' ? (
        <img src={item.url} alt="Portfolio" className="object-cover w-full h-full" />
      ) : (
        <video src={item.url} className="object-cover w-full h-full" controls={false} poster="" />
      )}
      <button
        className="absolute top-1 right-1 bg-white/80 hover:bg-white text-red-600 rounded-full p-1 shadow focus:outline-none"
        onClick={() => onRemove(id)}
        aria-label="Remove"
        type="button"
      >
        <X className="h-4 w-4" />
      </button>
      <span className="absolute bottom-1 left-1 bg-white/80 rounded px-1.5 py-0.5 text-xs flex items-center gap-1">
        <GripVertical className="h-3 w-3 text-muted-foreground" />
        {item.type === 'video' ? <Video className="h-3 w-3 text-blue-500" /> : <ImageIcon className="h-3 w-3 text-green-500" />}
      </span>
    </div>
  )
} 