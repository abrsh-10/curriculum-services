import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface AssessmentAttemptFilterProps {
  hasPreAssessmentAttempt?: boolean
  hasPostAssessmentAttempt?: boolean
  onPreAssessmentChange: (checked: boolean) => void
  onPostAssessmentChange: (checked: boolean) => void
}

export function AssessmentAttemptFilter({ 
  hasPreAssessmentAttempt,
  hasPostAssessmentAttempt,
  onPreAssessmentChange,
  onPostAssessmentChange
}: AssessmentAttemptFilterProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-semibold">Assessment Attempts</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="pre-assessment"
            checked={hasPreAssessmentAttempt === true}
            onCheckedChange={(checked) => 
              onPreAssessmentChange(checked ? true : false)
            }
            className="h-5 w-5 rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
          />
          <Label 
            htmlFor="pre-assessment"
            className="text-base font-normal"
          >
            Has Pre-Assessment
          </Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="post-assessment"
            checked={hasPostAssessmentAttempt === true}
            onCheckedChange={(checked) => 
              onPostAssessmentChange(checked ? true : false)
            }
            className="h-5 w-5 rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
          />
          <Label 
            htmlFor="post-assessment"
            className="text-base font-normal"
          >
            Has Post-Assessment
          </Label>
        </div>
      </div>
    </div>
  )
}

