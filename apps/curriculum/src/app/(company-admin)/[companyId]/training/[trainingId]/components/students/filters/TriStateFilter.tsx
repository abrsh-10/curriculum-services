import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface TriStateFilterProps {
  id: string
  label: string
  value?: boolean
  onChange: (value: boolean | undefined) => void
}

export function TriStateFilter({ id, label, value, onChange }: TriStateFilterProps) {
  // Convert boolean | undefined to string for radio group
  const radioValue = value === undefined ? "all" : value ? "yes" : "no"
  
  const handleChange = (newValue: string) => {
    if (newValue === "all") {
      onChange(undefined)
    } else if (newValue === "yes") {
      onChange(true)
    } else {
      onChange(false)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="text-base font-normal">
        {label}
      </Label>
      <RadioGroup
        id={id}
        value={radioValue}
        onValueChange={handleChange}
        className="flex gap-4"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="all" id={`${id}-all`} />
          <Label
            htmlFor={`${id}-all`}
            className="text-sm font-normal cursor-pointer"
          >
            All
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="yes" id={`${id}-yes`} />
          <Label
            htmlFor={`${id}-yes`}
            className="text-sm font-normal cursor-pointer"
          >
            Yes
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="no" id={`${id}-no`} />
          <Label
            htmlFor={`${id}-no`}
            className="text-sm font-normal cursor-pointer"
          >
            No
          </Label>
        </div>
      </RadioGroup>
    </div>
  )
}

