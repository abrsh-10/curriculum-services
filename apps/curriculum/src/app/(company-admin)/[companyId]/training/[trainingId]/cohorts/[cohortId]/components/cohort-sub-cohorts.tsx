"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useUserRole } from "@/lib/hooks/useUserRole"
import { Button } from "@/components/ui/button"
import { Plus, Filter, X, Loader2 } from "lucide-react"
import { useCohorts } from "@/lib/hooks/useCohorts"
import { Input } from "@/components/ui/input"
import { CohortList } from "../../../components/cohorts/cohort-list"
import { CohortForm } from "../../../components/cohorts/cohort-form"
import { 
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogContent
} from "@/components/ui/dialog"
import Image from "next/image"

interface CohortSubCohortsProps {
  cohortId: string
  trainingId: string
}

export function CohortSubCohorts({ cohortId, trainingId }: CohortSubCohortsProps) {
  const router = useRouter()
  const params = useParams()
  const companyId = params.companyId as string
  const { isProjectManager, isTrainingAdmin } = useUserRole()
  
  // Fetch sub-cohorts for this cohort
  const { data, isLoading, error } = useCohorts({
    trainingId,
    cohortId, // This will fetch sub-cohorts of the current cohort
    pageSize: 20,
    page: 1
  })
  
  const subCohorts = data?.cohorts || []

  const [searchTerm, setSearchTerm] = useState("")
  const [isAddSubCohortModalOpen, setIsAddSubCohortModalOpen] = useState(false)

  const handleAddSubCohort = () => {
    setIsAddSubCohortModalOpen(true)
  }

  const handleSubCohortSuccess = () => {
    setIsAddSubCohortModalOpen(false)
    // The query will automatically refetch due to invalidation in the hook
  }

  const handleSubCohortCancel = () => {
    setIsAddSubCohortModalOpen(false)
  }

  const filteredSubCohorts = subCohorts.filter(cohort => 
    cohort.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Sub-Cohorts</h2>
          {isLoading && (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="relative md:w-[300px]">
            <Image
              src="/search.svg"
              alt="Search"
              width={19}
              height={19}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-5 w-5 z-10"
            />
            <Input
              type="text"
              placeholder="Search sub-cohorts..."
              className="pl-10 h-10 text-sm bg-white border-gray-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <button 
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-[#344054] h-10 whitespace-nowrap disabled:opacity-50"
            disabled={isLoading}
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
          {(isProjectManager || isTrainingAdmin) && (
            <Button
              className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2 h-10"
              onClick={handleAddSubCohort}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
              <span>Add Sub-Cohort</span>
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <div className="text-center py-20 bg-[#fbfbfb] rounded-lg border-[0.1px]">
          <h3 className="text-lg font-medium mb-2">Error Loading Sub-Cohorts</h3>
          <p className="text-gray-500 text-sm">
            There was a problem loading the sub-cohorts. Please try again later.
          </p>
        </div>
      ) : isLoading ? (
        <div className="text-center py-20 bg-[#fbfbfb] rounded-lg border-[0.1px]">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Loading Sub-Cohorts</h3>
          <p className="text-gray-500 text-sm">
            Please wait while we fetch the sub-cohorts...
          </p>
        </div>
      ) : subCohorts.length === 0 ? (
        <div className="text-center py-20 bg-[#fbfbfb] rounded-lg border-[0.1px]">
          <h3 className="text-lg font-medium mb-2">No Sub-Cohorts Added Yet</h3>
          <p className="text-gray-500 text-sm">
            Add sub-cohorts to further organize this cohort.
          </p>
          {(isProjectManager || isTrainingAdmin) && (
            <Button 
              className="mt-4 bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2 mx-auto"
              onClick={handleAddSubCohort}
            >
              <Plus className="h-4 w-4" />
              <span>Add Sub-Cohort</span>
            </Button>
          )}
        </div>
      ) : (
        <CohortList cohorts={filteredSubCohorts} />
      )}

      {/* Add Sub-Cohort Modal */}
      <Dialog open={isAddSubCohortModalOpen} onOpenChange={setIsAddSubCohortModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <DialogTitle className="text-xl font-semibold">Add Sub-Cohort</DialogTitle>
            <DialogClose asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={handleSubCohortCancel}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogClose>
          </DialogHeader>

          <CohortForm
            trainingId={trainingId}
            companyId={companyId}
            parentCohortId={cohortId} // This cohort becomes the parent
            onSuccess={handleSubCohortSuccess}
            onCancel={handleSubCohortCancel}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
} 