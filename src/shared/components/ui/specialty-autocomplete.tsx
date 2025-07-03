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
                    variant="secondary"
                    className="text-xs"
                  >
                    {specialty}
                    <button
                      type="button"
                      className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
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
                    >
                      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                    </button>
                  </Badge>
                ))
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder={placeholder}
              value={searchQuery}
              onValueChange={setSearchQuery}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>No specialty found.</CommandEmpty>
              <CommandGroup>
                {filteredSpecialties.map((specialty) => (
                  <CommandItem
                    key={specialty}
                    value={specialty}
                    onSelect={() => handleSelect(specialty)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.includes(specialty) ? "opacity-100" : "opacity-0"
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