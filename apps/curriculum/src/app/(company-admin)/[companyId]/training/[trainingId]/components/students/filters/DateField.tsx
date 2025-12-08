"use client"

import { DatePicker } from "@/components/ui/date-picker"

interface DateFieldProps {
  label: string
  value: Date | undefined
  setValue: (value: Date | undefined) => void
  placeholder?: string
  description?: string
}

export function DateField({
  label,
  value,
  setValue,
  placeholder = "Select date",
  description
}: DateFieldProps) {
  return (
    <div className="space-y-2">
      <div>
        <h4 className="text-base font-semibold">{label}</h4>
        {description && (
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        )}
      </div>
      <DatePicker
        date={value}
        setDate={setValue}
        placeholder={placeholder}
        disabled={(date) => date > new Date()}
      />
    </div>
  )
}

