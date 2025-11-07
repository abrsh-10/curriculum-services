import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface GenderFilterProps {
  selectedGenders: string[]
  onGenderToggle: (checked: boolean, gender: string) => void
}

const genderOptions = [
  { id: "MALE", label: "Male" },
  { id: "FEMALE", label: "Female" }
]

export function GenderFilter({ selectedGenders, onGenderToggle }: GenderFilterProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-semibold">Gender</h4>
      <div className="grid grid-cols-2 gap-4">
        {genderOptions.map((gender) => (
          <div key={gender.id} className="flex items-center space-x-2">
            <Checkbox
              id={gender.id}
              checked={selectedGenders.includes(gender.id)}
              onCheckedChange={(checked) => 
                onGenderToggle(checked as boolean, gender.id)
              }
              className="h-5 w-5 rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
            />
            <Label 
              htmlFor={gender.id}
              className="text-base font-normal"
            >
              {gender.label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}

