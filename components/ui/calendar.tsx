"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export interface CalendarProps {
  selected?: Date | null
  onSelect?: (date: Date) => void
  disabled?: (date: Date) => boolean
  className?: string
}

export function Calendar({
  selected,
  onSelect,
  disabled,
  className,
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState<Date>(() => {
    return selected ? new Date(selected.getFullYear(), selected.getMonth(), 1) : new Date()
  })

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // Month navigation handlers
  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  // Days calculations
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]

  const weekDays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  const days: { date: Date; isCurrentMonth: boolean }[] = []

  // Leading days from previous month
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({
      date: new Date(year, month - 1, daysInPrevMonth - i),
      isCurrentMonth: false,
    })
  }

  // Days of current month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push({
      date: new Date(year, month, i),
      isCurrentMonth: true,
    })
  }

  // Trailing days to fill the 6-row (42 cells) grid
  const remaining = 42 - days.length
  for (let i = 1; i <= remaining; i++) {
    days.push({
      date: new Date(year, month + 1, i),
      isCurrentMonth: false,
    })
  }

  const isSameDay = (d1?: Date | null, d2?: Date | null) => {
    if (!d1 || !d2) return false
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    )
  }

  const today = new Date()

  return (
    <div className={cn("p-2 select-none w-[276px]", className)}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-1 py-1.5">
        <span className="text-xs font-semibold text-foreground">
          {monthNames[month]} {year}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-xs" }),
              "h-6 w-6 text-muted-foreground hover:text-foreground"
            )}
            title="Previous month"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className={cn(
              buttonVariants({ variant: "ghost", size: "icon-xs" }),
              "h-6 w-6 text-muted-foreground hover:text-foreground"
            )}
            title="Next month"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-muted-foreground mt-2 pb-1 border-b border-border">
        {weekDays.map((d) => (
          <div key={d} className="h-6 flex items-center justify-center">
            {d}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1 text-xs mt-1.5">
        {days.map(({ date, isCurrentMonth }, idx) => {
          const isSelected = isSameDay(selected, date)
          const isToday = isSameDay(today, date)
          const isDisabled = disabled ? disabled(date) : false

          return (
            <button
              key={idx}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect && onSelect(date)}
              className={cn(
                "h-7 w-7 rounded-md text-xs font-medium flex items-center justify-center transition-all cursor-pointer",
                !isCurrentMonth && "text-muted-foreground/40",
                isCurrentMonth && !isSelected && "text-foreground hover:bg-accent hover:text-accent-foreground",
                isToday && !isSelected && "border border-primary text-primary font-bold",
                isSelected && "bg-primary text-primary-foreground font-bold shadow-xs hover:bg-primary/90",
                isDisabled && "opacity-30 cursor-not-allowed pointer-events-none"
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
