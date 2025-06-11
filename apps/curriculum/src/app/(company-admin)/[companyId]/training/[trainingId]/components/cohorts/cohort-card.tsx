"use client"

import { memo, useState, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Users, Tag, Edit2 } from "lucide-react"
import { Cohort, useDeleteCohort } from "@/lib/hooks/useCohorts"
import { useUserRole } from "@/lib/hooks/useUserRole"
import { DeleteCohortDialog } from "./delete-cohort-dialog"

interface CohortCardProps {
  cohort: Cohort
  onEditCohort?: (cohort: Cohort) => void
}

function CohortCardComponent({ cohort, onEditCohort }: CohortCardProps) {
  const router = useRouter()
  const params = useParams()
  const companyId = params.companyId as string
  const trainingId = params.trainingId as string
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cohortToDelete, setCohortToDelete] = useState<Cohort | null>(null)
  
  const { isProjectManager, isTrainingAdmin } = useUserRole()
  const { deleteCohort, isLoading: isDeleting } = useDeleteCohort()

  const handleViewDetails = () => {
    router.push(`/${companyId}/training/${trainingId}/cohorts/${cohort.id}`)
  }

  const handleDeleteCohort = useCallback(() => {
    setCohortToDelete(cohort)
    setDeleteDialogOpen(true)
  }, [cohort])

  const handleEditCohort = useCallback(() => {
    if (onEditCohort) {
      onEditCohort(cohort)
    }
  }, [cohort, onEditCohort])

  const confirmDelete = useCallback(() => {
    if (cohortToDelete) {
      deleteCohort({
        cohortId: cohortToDelete.id,
        trainingId
      })
      setDeleteDialogOpen(false)
      setCohortToDelete(null)
    }
  }, [cohortToDelete, deleteCohort, trainingId])

  // Check if user can edit/delete cohorts (only project manager and training admin)
  const canEditCohorts = isProjectManager || isTrainingAdmin

  return (
    <div className="bg-[#FBFBFB] p-5 rounded-lg border-[0.1px] border-gray-200">
      <div className="grid grid-cols-6 items-center gap-4">
        <div className="flex flex-col gap-1 col-span-2">
          <h3 className="text-[#525252] font-bold text-sm break-words">{cohort.name}</h3>
          {cohort.description && (
            <p className="text-[#667085] text-xs line-clamp-2">{cohort.description}</p>
          )}
        </div>

        <div className="flex flex-col gap-1 col-span-1">
          <span className="text-[#525252] font-bold text-xs">Training</span>
          <span className="text-[#555252] font-light text-sm break-words">
            {cohort.trainingTitle}
          </span>
        </div>

        <div className="flex flex-col gap-1 col-span-1">
          <span className="text-[#525252] font-bold text-xs">Parent Cohort</span>
          <span className="text-[#555252] font-light text-sm">
            {cohort.parentCohortName || "Main Cohort"}
          </span>
        </div>

        <div className="flex flex-col gap-1 col-span-1">
          <span className="text-[#525252] font-bold text-xs">Tags</span>
          <div className="flex flex-wrap gap-1">
            {cohort.tags && cohort.tags.length > 0 ? (
              cohort.tags.slice(0, 2).map((tag, index) => (
                <div key={index} className="flex items-center gap-1 bg-[#ECF4FF] text-[#0B75FF] px-2 py-0.5 rounded-full">
                  <Tag className="h-2 w-2" />
                  <span className="text-xs font-medium">{tag}</span>
                </div>
              ))
            ) : (
              <span className="text-[#667085] text-xs italic">No tags</span>
            )}
            {cohort.tags && cohort.tags.length > 2 && (
              <span className="text-[#667085] text-xs">+{cohort.tags.length - 2} more</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 col-span-1">
          <Button 
            variant="outline" 
            size="sm" 
            className="rounded-full border-[#667085] text-[#667085] text-xs font-medium"
            onClick={handleViewDetails}
          >
            View Details
          </Button>
          {canEditCohorts && onEditCohort && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-blue-300 text-blue-600 hover:bg-blue-50 text-xs font-medium"
              onClick={handleEditCohort}
              disabled={isDeleting}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Delete Cohort Dialog */}
      <DeleteCohortDialog
        isOpen={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        cohort={cohortToDelete}
        onConfirmDelete={confirmDelete}
        isDeleting={isDeleting}
      />
    </div>
  )
}

// Memoize the component to prevent unnecessary re-renders
export const CohortCard = memo(CohortCardComponent) 