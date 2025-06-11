"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useUserRole } from "@/lib/hooks/useUserRole"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { Plus, Filter, X } from "lucide-react"
import { useCohorts } from "@/lib/hooks/useCohorts"
import { Input } from "@/components/ui/input"
import { CohortList } from "./cohorts/cohort-list"
import { CohortForm } from "./cohorts/cohort-form"
import { 
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogContent
} from "@/components/ui/dialog"
import Image from "next/image"

interface CohortsComponentProps {
  trainingId: string
}

export function CohortsComponent({ trainingId }: CohortsComponentProps) {
  const router = useRouter()
  const params = useParams()
  const { isProjectManager, isTrainingAdmin } = useUserRole()
  
  const { data, isLoading, error } = useCohorts({
    trainingId,
    pageSize: 20,
    page: 1
  })
  
  const cohorts = data?.cohorts || []

  const [searchTerm, setSearchTerm] = useState("")
  const [isAddCohortModalOpen, setIsAddCohortModalOpen] = useState(false)
  const [isEditCohortModalOpen, setIsEditCohortModalOpen] = useState(false)
  const [cohortToEdit, setCohortToEdit] = useState<typeof cohorts[0] | null>(null)

  const handleAddCohort = () => {
    setIsAddCohortModalOpen(true)
  }

  const handleCohortSuccess = () => {
    setIsAddCohortModalOpen(false)
    // The query will automatically refetch due to invalidation in the hook
  }

  const handleCohortCancel = () => {
    setIsAddCohortModalOpen(false)
  }

  const handleEditCohort = (cohort: typeof cohorts[0]) => {
    setCohortToEdit(cohort)
    setIsEditCohortModalOpen(true)
  }

  const handleEditCohortSuccess = () => {
    setIsEditCohortModalOpen(false)
    setCohortToEdit(null)
    // The query will automatically refetch due to invalidation in the hook
  }

  const handleEditCohortCancel = () => {
    setIsEditCohortModalOpen(false)
    setCohortToEdit(null)
  }

  const filteredCohorts = cohorts.filter(cohort => 
    cohort.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (isLoading) {
    return <Loading />
  }

  return (
    <>
      <div className="flex lg:px-16 md:px-14 px-4 w-full">
        <div className="flex-1 py-4 md:pl-12 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-semibold">Cohorts</h1>
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
                  placeholder="Search cohorts..."
                  className="pl-10 h-10 text-sm bg-white border-gray-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-md text-sm font-medium text-[#344054] h-10 whitespace-nowrap">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>
              {(isProjectManager || isTrainingAdmin) && (
                <Button
                  className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2 h-10"
                  onClick={handleAddCohort}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Cohort</span>
                </Button>
              )}
            </div>
          </div>

          {error ? (
            <div className="text-center py-20 bg-[#fbfbfb] rounded-lg border-[0.1px]">
              <h3 className="text-lg font-medium mb-2">Error Loading Cohorts</h3>
              <p className="text-gray-500 text-sm">
                There was a problem loading the cohorts. Please try again later.
              </p>
            </div>
          ) : cohorts.length === 0 ? (
            <div className="text-center py-20 bg-[#fbfbfb] rounded-lg border-[0.1px]">
              <h3 className="text-lg font-medium mb-2">No Cohorts Added Yet</h3>
              <p className="text-gray-500 text-sm">
                Add cohorts to organize your training sessions and students.
              </p>
              {(isProjectManager || isTrainingAdmin) && (
                <Button 
                  className="mt-4 bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2 mx-auto"
                  onClick={handleAddCohort}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Cohort</span>
                </Button>
              )}
            </div>
          ) : (
            <CohortList cohorts={filteredCohorts} onEditCohort={handleEditCohort} />
          )}
        </div>
      </div>

      {/* Add Cohort Modal */}
      <Dialog open={isAddCohortModalOpen} onOpenChange={setIsAddCohortModalOpen}>
        <DialogContent 
          className="sm:max-w-[600px] max-h-[90vh] p-0"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="text-xl font-semibold">New Cohort</DialogTitle>
              {/* <DialogClose asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose> */}
            </div>
          </DialogHeader>
          <CohortForm 
            trainingId={trainingId}
            companyId={params.companyId as string}
            onSuccess={handleCohortSuccess}
            onCancel={handleCohortCancel}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Cohort Modal */}
      <Dialog open={isEditCohortModalOpen} onOpenChange={setIsEditCohortModalOpen}>
        <DialogContent 
          className="sm:max-w-[600px] max-h-[90vh] p-0"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between w-full">
              <DialogTitle className="text-xl font-semibold">Edit Cohort</DialogTitle>
              {/* <DialogClose asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </DialogClose> */}
            </div>
          </DialogHeader>
          <CohortForm 
            trainingId={trainingId}
            companyId={params.companyId as string}
            cohort={cohortToEdit}
            isEditing={true}
            onSuccess={handleEditCohortSuccess}
            onCancel={handleEditCohortCancel}
          />
        </DialogContent>
      </Dialog>
    </>
  )
} 