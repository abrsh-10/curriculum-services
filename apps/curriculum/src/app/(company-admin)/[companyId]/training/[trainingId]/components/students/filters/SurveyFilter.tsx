import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface SurveyFilterProps {
  hasFilledBaselineSurvey?: boolean
  hasFilledEndlineSurvey?: boolean
  onBaselineSurveyChange: (checked: boolean) => void
  onEndlineSurveyChange: (checked: boolean) => void
}

export function SurveyFilter({ 
  hasFilledBaselineSurvey,
  hasFilledEndlineSurvey,
  onBaselineSurveyChange,
  onEndlineSurveyChange
}: SurveyFilterProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-semibold">Survey Completion</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="baseline-survey"
            checked={hasFilledBaselineSurvey === true}
            onCheckedChange={(checked) => 
              onBaselineSurveyChange(checked ? true : false)
            }
            className="h-5 w-5 rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
          />
          <Label 
            htmlFor="baseline-survey"
            className="text-base font-normal"
          >
            Has Baseline Survey
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="endline-survey"
            checked={hasFilledEndlineSurvey === true}
            onCheckedChange={(checked) => 
              onEndlineSurveyChange(checked ? true : false)
            }
            className="h-5 w-5 rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
          />
          <Label 
            htmlFor="endline-survey"
            className="text-base font-normal"
          >
            Has Endline Survey
          </Label>
        </div>
      </div>
    </div>
  )
}

