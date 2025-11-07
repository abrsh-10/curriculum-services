import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox"
import { getCohortHierarchyName } from "@/lib/utils/cohort-utils"
import { Cohort } from "@/lib/hooks/useCohorts"

interface CohortFilterProps {
  cohorts: Cohort[]
  selectedCohortIds: string[]
  onChange: (cohortIds: string[]) => void
}

export function CohortFilter({ cohorts, selectedCohortIds, onChange }: CohortFilterProps) {
  if (cohorts.length === 0) return null

  return (
    <div className="space-y-3">
      <h4 className="text-base font-semibold">Cohorts</h4>
      <MultiSelectCombobox
        options={cohorts.map(cohort => ({ 
          value: cohort.id, 
          label: getCohortHierarchyName(cohort) 
        }))}
        selected={selectedCohortIds}
        onChange={onChange}
        placeholder="Search and select cohorts..."
        searchPlaceholder="Search cohorts..."
        noResultsText="No cohorts found."
        className="w-full"
      />
    </div>
  )
}

