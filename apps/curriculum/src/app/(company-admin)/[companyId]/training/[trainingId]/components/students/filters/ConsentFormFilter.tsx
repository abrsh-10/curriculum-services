import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface ConsentFormFilterProps {
  hasConsentForm?: boolean
  onChange: (checked: boolean) => void
}

export function ConsentFormFilter({ hasConsentForm, onChange }: ConsentFormFilterProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-semibold">Consent Form</h4>
      <div className="flex items-center space-x-2">
        <Checkbox
          id="consent-form"
          checked={hasConsentForm === true}
          onCheckedChange={(checked) => 
            onChange(checked ? true : false)
          }
          className="h-5 w-5 rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
        />
        <Label 
          htmlFor="consent-form"
          className="text-base font-normal"
        >
          Has Consent Form
        </Label>
      </div>
    </div>
  )
}

