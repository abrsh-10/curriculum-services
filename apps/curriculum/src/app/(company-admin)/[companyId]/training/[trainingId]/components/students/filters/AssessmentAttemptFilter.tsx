import { TriStateFilter } from "./TriStateFilter"

interface AssessmentAttemptFilterProps {
  hasPreAssessmentAttempt?: boolean
  hasPostAssessmentAttempt?: boolean
  onPreAssessmentChange: (value: boolean | undefined) => void
  onPostAssessmentChange: (value: boolean | undefined) => void
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
      <div className="space-y-4">
        <TriStateFilter
          id="pre-assessment"
          label="Has Pre-Assessment"
          value={hasPreAssessmentAttempt}
          onChange={onPreAssessmentChange}
        />
        <TriStateFilter
          id="post-assessment"
          label="Has Post-Assessment"
          value={hasPostAssessmentAttempt}
          onChange={onPostAssessmentChange}
        />
      </div>
    </div>
  )
}

