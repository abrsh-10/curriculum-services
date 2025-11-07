import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

interface RangeFieldProps {
  label: string
  aboveLabel?: string
  belowLabel?: string
  aboveValue?: number
  belowValue?: number
  setAbove: (value: number | undefined) => void
  setBelow: (value: number | undefined) => void
  min?: number
  max?: number
  placeholderAbove?: string
  placeholderBelow?: string
}

export function RangeField({
  label,
  aboveLabel = "Above",
  belowLabel = "Below",
  aboveValue,
  belowValue,
  setAbove,
  setBelow,
  min = 0,
  max = 100,
  placeholderAbove,
  placeholderBelow
}: RangeFieldProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-semibold">{label}</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{aboveLabel}</Label>
          <Input
            type="number"
            placeholder={placeholderAbove}
            value={aboveValue ?? ''}
            onChange={(e) => setAbove(e.target.value ? Number(e.target.value) : undefined)}
            className="h-10"
            min={min}
            max={max}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{belowLabel}</Label>
          <Input
            type="number"
            placeholder={placeholderBelow}
            value={belowValue ?? ''}
            onChange={(e) => setBelow(e.target.value ? Number(e.target.value) : undefined)}
            className="h-10"
            min={min}
            max={max}
          />
        </div>
      </div>
    </div>
  )
}

