import { Label } from "@/components/ui/label"
import { TriStateFilter } from "./TriStateFilter"

interface EdgeSyncFilterProps {
  isCreationSyncedWithEdge?: boolean
  isEnrollmentSyncedWithEdge?: boolean
  isPreAssessmentSyncedWithEdge?: boolean
  isPostAssessmentSyncedWithEdge?: boolean
  isCompletionSyncedWithEdge?: boolean
  onCreationSyncChange: (value: boolean | undefined) => void
  onEnrollmentSyncChange: (value: boolean | undefined) => void
  onPreAssessmentSyncChange: (value: boolean | undefined) => void
  onPostAssessmentSyncChange: (value: boolean | undefined) => void
  onCompletionSyncChange: (value: boolean | undefined) => void
}

export function EdgeSyncFilter({ 
  isCreationSyncedWithEdge,
  isEnrollmentSyncedWithEdge,
  isPreAssessmentSyncedWithEdge,
  isPostAssessmentSyncedWithEdge,
  isCompletionSyncedWithEdge,
  onCreationSyncChange,
  onEnrollmentSyncChange,
  onPreAssessmentSyncChange,
  onPostAssessmentSyncChange,
  onCompletionSyncChange
}: EdgeSyncFilterProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-semibold">Edge Sync Status</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <TriStateFilter
            id="creation-synced"
            label="Creation Synced"
            value={isCreationSyncedWithEdge}
            onChange={onCreationSyncChange}
          />
        </div>
        <div className="space-y-1.5">
          <TriStateFilter
            id="enrollment-synced"
            label="Enrollment Synced"
            value={isEnrollmentSyncedWithEdge}
            onChange={onEnrollmentSyncChange}
          />
        </div>
        <div className="space-y-1.5">
          <TriStateFilter
            id="pre-assessment-synced"
            label="Pre-Assessment Synced"
            value={isPreAssessmentSyncedWithEdge}
            onChange={onPreAssessmentSyncChange}
          />
        </div>
        <div className="space-y-1.5">
          <TriStateFilter
            id="post-assessment-synced"
            label="Post-Assessment Synced"
            value={isPostAssessmentSyncedWithEdge}
            onChange={onPostAssessmentSyncChange}
          />
        </div>
        <div className="space-y-1.5">
          <TriStateFilter
            id="completion-synced"
            label="Completion Synced"
            value={isCompletionSyncedWithEdge}
            onChange={onCompletionSyncChange}
          />
        </div>
      </div>
    </div>
  )
}

