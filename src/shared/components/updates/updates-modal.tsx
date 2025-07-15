"use client"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Sparkles, Bug, Zap, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Update {
  id: string
  title: string
  description: string
  date: string
  type: 'feature' | 'bugfix' | 'improvement'
  isNew?: boolean
}

interface UpdatesModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  updates: Update[]
  onMarkAsRead: () => void
}

const getTypeIcon = (type: Update['type']) => {
  switch (type) {
    case 'feature':
      return <Sparkles className="h-4 w-4" />
    case 'bugfix':
      return <Bug className="h-4 w-4" />
    case 'improvement':
      return <Zap className="h-4 w-4" />
    default:
      return <Sparkles className="h-4 w-4" />
  }
}

const getTypeColor = (type: Update['type']) => {
  switch (type) {
    case 'feature':
      return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    case 'bugfix':
      return 'bg-green-500/20 text-green-400 border-green-500/30'
    case 'improvement':
      return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    default:
      return 'bg-saffron/20 text-saffron border-saffron/30'
  }
}

export function UpdatesModal({ open, onOpenChange, updates, onMarkAsRead }: UpdatesModalProps) {
  const newUpdatesCount = updates.filter(update => update.isNew).length

  const handleMarkAsRead = () => {
    onMarkAsRead()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl w-full bg-black/90 border border-white/20 backdrop-blur-xl rounded-2xl shadow-2xl p-6 overflow-y-auto max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-saffron" />
            What's New
            {newUpdatesCount > 0 && (
              <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                {newUpdatesCount} new
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-white/80">
            Stay up to date with the latest features and improvements
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-6">
          {updates.map((update) => (
            <div
              key={update.id}
              className={cn(
                "p-4 rounded-xl border transition-all duration-200",
                update.isNew 
                  ? "bg-saffron/10 border-saffron/30 shadow-lg shadow-saffron/20" 
                  : "bg-white/5 border-white/10"
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={cn("p-1 rounded-md border", getTypeColor(update.type))}>
                    {getTypeIcon(update.type)}
                  </div>
                  <h3 className={cn(
                    "font-semibold",
                    update.isNew ? "text-saffron" : "text-white"
                  )}>
                    {update.title}
                  </h3>
                  {update.isNew && (
                    <Badge className="bg-red-500 text-white text-xs px-2 py-0.5 ml-2">
                      NEW
                    </Badge>
                  )}
                </div>
                <span className="text-white/60 text-sm">
                  {new Date(update.date).toLocaleDateString()}
                </span>
              </div>
              <p className="text-white/80 text-sm leading-relaxed">
                {update.description}
              </p>
            </div>
          ))}
        </div>

        {newUpdatesCount > 0 && (
          <div className="flex justify-end mt-6 pt-4 border-t border-white/10">
            <Button
              onClick={handleMarkAsRead}
              className="bg-saffron text-primary hover:bg-saffron/90"
            >
              <Check className="h-4 w-4 mr-2" />
              Mark All as Read
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 