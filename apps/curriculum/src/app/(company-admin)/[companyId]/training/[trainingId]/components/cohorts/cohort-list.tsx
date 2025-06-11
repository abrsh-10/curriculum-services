"use client"

import { CohortCard } from "./cohort-card"
import { Cohort } from "@/lib/hooks/useCohorts"

interface CohortListProps {
  cohorts: Cohort[]
  onEditCohort?: (cohort: Cohort) => void
}

export function CohortList({ cohorts, onEditCohort }: CohortListProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {cohorts.length > 0 ? (
          cohorts.map((cohort) => (
            <CohortCard 
              key={cohort.id} 
              cohort={cohort} 
              onEditCohort={onEditCohort}
            />
          ))
        ) : (
          <div className="text-center py-10 bg-[#fbfbfb] rounded-lg border-[0.1px]">
            <p className="text-gray-500 text-sm">
              No matching cohorts found
            </p>
          </div>
        )}
      </div>
    </div>
  )
} 