import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface EdgeSyncFilterProps {
  isCreationSyncedWithEdge?: boolean
  isEnrollmentSyncedWithEdge?: boolean
  isPreAssessmentSyncedWithEdge?: boolean
  isPostAssessmentSyncedWithEdge?: boolean
  onCreationSyncChange: (value: boolean | undefined) => void
  onEnrollmentSyncChange: (value: boolean | undefined) => void
  onPreAssessmentSyncChange: (value: boolean | undefined) => void
  onPostAssessmentSyncChange: (value: boolean | undefined) => void
}

export function EdgeSyncFilter({ 
  isCreationSyncedWithEdge,
  isEnrollmentSyncedWithEdge,
  isPreAssessmentSyncedWithEdge,
  isPostAssessmentSyncedWithEdge,
  onCreationSyncChange,
  onEnrollmentSyncChange,
  onPreAssessmentSyncChange,
  onPostAssessmentSyncChange
}: EdgeSyncFilterProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-semibold">Edge Sync Status</h4>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="creation-synced"
            checked={isCreationSyncedWithEdge === true}
            onCheckedChange={(checked) => 
              onCreationSyncChange(checked ? true : undefined)
            }
            className="h-5 w-5 rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
          />
          <Label 
            htmlFor="creation-synced"
            className="text-base font-normal"
          >
            Creation Synced
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="enrollment-synced"
            checked={isEnrollmentSyncedWithEdge === true}
            onCheckedChange={(checked) => 
              onEnrollmentSyncChange(checked ? true : undefined)
            }
            className="h-5 w-5 rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
          />
          <Label 
            htmlFor="enrollment-synced"
            className="text-base font-normal"
          >
            Enrollment Synced
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="pre-assessment-synced"
            checked={isPreAssessmentSyncedWithEdge === true}
            onCheckedChange={(checked) => 
              onPreAssessmentSyncChange(checked ? true : undefined)
            }
            className="h-5 w-5 rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
          />
          <Label 
            htmlFor="pre-assessment-synced"
            className="text-base font-normal"
          >
            Pre-Assessment Synced
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="post-assessment-synced"
            checked={isPostAssessmentSyncedWithEdge === true}
            onCheckedChange={(checked) => 
              onPostAssessmentSyncChange(checked ? true : undefined)
            }
            className="h-5 w-5 rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
          />
          <Label 
            htmlFor="post-assessment-synced"
            className="text-base font-normal"
          >
            Post-Assessment Synced
          </Label>
        </div>
      </div>
    </div>
  )
}

