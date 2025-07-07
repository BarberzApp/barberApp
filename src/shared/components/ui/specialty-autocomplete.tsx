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
            className="w-full justify-between h-auto min-h-[40px] p-2"
            disabled={disabled}
          >
            <div className="flex flex-wrap gap-1 flex-1">
              {value.length === 0 ? (
                <span className="text-muted-foreground">{placeholder}</span>
              ) : (
                value.map((specialty) => (
                  <Badge
                    key={specialty}
                    variant="glassy-saffron"
                    className="text-xs"
                  >
                    {specialty}
                    <span
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer"
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
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </span>
                  </Badge>
                ))
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command className="bg-darkpurple/80 border border-white/10 shadow-2xl backdrop-blur-xl rounded-2xl">
            <CommandInput
              placeholder={placeholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="h-9 bg-white/10 text-white placeholder:text-white/40 rounded-xl border border-white/10 focus:border-saffron"
            />
            <CommandList>
              <CommandEmpty>No specialty found.</CommandEmpty>
              <CommandGroup>
                {filteredSpecialties.map((specialty) => (
                  <CommandItem
                    key={specialty}
                    value={specialty}
                    onSelect={() => handleSelect(specialty)}
                    className={cn(
                      "cursor-pointer text-white rounded-xl transition-all",
                      value.includes(specialty)
                        ? "bg-saffron/20 text-saffron font-semibold"
                        : "hover:bg-saffron/10 hover:text-saffron"
                    )}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(specialty) ? "opacity-100 text-saffron" : "opacity-0"
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
          <p className="text-xs text-muted-foreground">
            {value.length} of {maxSelections} selected
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
} 