'use client'

import * as React from 'react'
import { Check, ChevronsUpDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/shared/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/shared/components/ui/popover'
import { Badge } from '@/shared/components/ui/badge'
import { BARBER_SPECIALTIES, getFilteredSpecialties } from '@/shared/constants/specialties'

interface SpecialtyAutocompleteProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
  maxSelections?: number
  disabled?: boolean
}

export function SpecialtyAutocomplete({
  value = [],
  onChange,
  placeholder = "Search specialties...",
  className,
  maxSelections = 10,
  disabled = false
}: SpecialtyAutocompleteProps) {
  const [open, setOpen] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState('')

  const filteredSpecialties = React.useMemo(() => {
    return getFilteredSpecialties(searchQuery)
  }, [searchQuery])

  const handleSelect = (specialty: string) => {
    if (value.includes(specialty)) {
      onChange(value.filter(item => item !== specialty))
    } else if (value.length < maxSelections) {
      onChange([...value, specialty])
    }
    setSearchQuery('')
  }

  const handleRemove = (specialtyToRemove: string) => {
    onChange(value.filter(item => item !== specialtyToRemove))
  }

  const handleClearAll = () => {
    onChange([])
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-auto min-h-[40px] p-2 bg-white/10 border border-white/20 text-white backdrop-blur-xl rounded-xl focus:border-white/50 focus:ring-2 focus:ring-white/20"
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {value.length === 0 ? (
                <span className="text-white/60">{placeholder}</span>
              ) : (
                value.map((specialty) => (
                  <Badge
                    key={specialty}
                    variant="glassy-saffron"
                    className="text-xs bg-white/20 text-white border-white/30 backdrop-blur-xl rounded-lg"
                  >
                    {specialty}
                    <span
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 cursor-pointer"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleRemove(specialty)
                        }
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={() => handleRemove(specialty)}
                      role="button"
                      tabIndex={0}
                    >
                      <X className="h-3 w-3 text-white/80 hover:text-white" />
                    </span>
                  </Badge>
                ))
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50 text-white" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-white/5 border border-white/20 shadow-2l backdrop-blur-xl rounded-2l" align="start">
          <Command className="bg-transparent border-0 shadow-none">
            <CommandInput
              placeholder={placeholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="h-9 bg-white/10 text-white placeholder:text-white/40 rounded-xl border border-white/10 focus:border-white/50 focus:ring-2 focus:ring-white/20"
            />
            <CommandList>
              <CommandEmpty className="text-white/60">No specialty found.</CommandEmpty>
              <CommandGroup>
                {filteredSpecialties.map((specialty) => (
                  <CommandItem
                    key={specialty}
                    value={specialty}
                    onSelect={() => handleSelect(specialty)}
                    className={cn(
                      "cursor-pointer text-white rounded-xl transition-all px-3 py-2 my-1",
                      value.includes(specialty)
                        ? "bg-white/20 text-white font-semibold border border-white/30"
                        : "hover:bg-white/10 hover:text-white border border-transparent"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(specialty) ? "opacity-100 text-white" : "opacity-0"
                      )}
                    />
                    {specialty}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-white/60">
            {value.length} of {maxSelections} selected
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-auto p-1 text-xs text-white/60 hover:text-white"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
} 