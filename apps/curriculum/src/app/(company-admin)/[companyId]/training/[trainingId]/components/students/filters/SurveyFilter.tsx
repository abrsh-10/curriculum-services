import { TriStateFilter } from "./TriStateFilter"

interface SurveyFilterProps {
  hasFilledBaselineSurvey?: boolean
  hasFilledEndlineSurvey?: boolean
  onBaselineSurveyChange: (value: boolean | undefined) => void
  onEndlineSurveyChange: (value: boolean | undefined) => void
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
      <div className="space-y-4">
        <TriStateFilter
          id="baseline-survey"
          label="Has Baseline Survey"
          value={hasFilledBaselineSurvey}
          onChange={onBaselineSurveyChange}
        />
        <TriStateFilter
          id="endline-survey"
          label="Has Endline Survey"
          value={hasFilledEndlineSurvey}
          onChange={onEndlineSurveyChange}
        />
      </div>
    </div>
  )
}

