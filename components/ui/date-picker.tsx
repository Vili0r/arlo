"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"

export interface DatePickerProps {
  name?: string
  id?: string
  value?: Date | null
  defaultValue?: Date | null
  onChange?: (date: Date) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
}

export function DatePicker({
  name,
  id,
  value: controlledValue,
  defaultValue,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  required = false,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [internalDate, setInternalDate] = React.useState<Date | null>(() => {
    return defaultValue ?? (controlledValue ?? null)
  })

  const selectedDate = controlledValue !== undefined ? controlledValue : internalDate

  const handleSelect = (date: Date) => {
    setInternalDate(date)
    onChange?.(date)
    setOpen(false)
  }

  // Format date as "MMM dd, yyyy"
  const formattedDisplay = React.useMemo(() => {
    if (!selectedDate) return null
    return selectedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    })
  }, [selectedDate])

  // ISO date string (YYYY-MM-DD) for form submission
  const formattedValue = React.useMemo(() => {
    if (!selectedDate) return ""
    const year = selectedDate.getFullYear()
    const month = String(selectedDate.getMonth() + 1).padStart(2, "0")
    const day = String(selectedDate.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }, [selectedDate])

  return (
    <div className={cn("relative inline-block w-full", className)}>
      {/* Hidden input for standard HTML Form & Server Action data capture */}
      {name && (
        <input
          type="hidden"
          name={name}
          id={id}
          value={formattedValue}
          required={required}
        />
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          type="button"
          disabled={disabled}
          className={cn(
            "border-input bg-transparent hover:bg-accent hover:text-accent-foreground flex h-9 w-full items-center justify-start rounded-md border px-3 py-1 text-xs shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 text-left font-normal cursor-pointer gap-2",
            !selectedDate && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="truncate">
            {formattedDisplay || placeholder}
          </span>
        </PopoverTrigger>

        <PopoverContent align="start" className="p-0">
          <Calendar
            selected={selectedDate}
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
