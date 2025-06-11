"use client"

import { useState, useMemo, useCallback } from "react"
import { useUserRole } from "@/lib/hooks/useUserRole"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { Plus } from "lucide-react"
import Image from "next/image"
import { Input } from "@/components/ui/input"
import { Filter } from "@/components/ui/filter"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { 
  TrainingAssessment, 
  useTrainingAssessments, 
  useCreateTrainingAssessment, 
  useUpdateTrainingAssessment, 
  useDeleteTrainingAssessment,
} from "@/lib/hooks/useTrainingAssessment"
import { ColumnDef } from "@tanstack/react-table"
import { AssessmentColumns, createActionsColumn } from "./assessment-columns"
import { AssessmentDataTable } from "./assessment-data-table"
import { AssessmentFormModal } from "./assessment-form-modal"
import { AssignSessionModal } from "./assign-session-modal"
import { DeleteAssessmentDialog } from "./delete-assessment-dialog"
import { Card } from "@/components/ui/card"
import { ClipboardList } from "lucide-react"

interface CatViewProps {
  trainingId: string
}

export function AssessmentView({ trainingId }: CatViewProps) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  const [assessmentTypeFilter, setAssessmentTypeFilter] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentAssessmentId, setCurrentAssessmentId] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assessmentToDelete, setAssessmentToDelete] = useState<TrainingAssessment | null>(null)
  const [assignSessionModalOpen, setAssignSessionModalOpen] = useState(false)
  const [assessmentToAssign, setAssessmentToAssign] = useState<TrainingAssessment | null>(null)
  const debouncedSearch = useDebounce(searchQuery, 500)
  
  const { 
    isProjectManager, 
    isTrainingAdmin, 
    isCompanyAdmin, 
    isCurriculumAdmin 
  } = useUserRole()
  
  // Create filter object for API call
  const apiFilters = useMemo(() => {
    const filters: { type?: string } = {}
    if (assessmentTypeFilter.length === 1) {
      filters.type = assessmentTypeFilter[0]
    }
    return Object.keys(filters).length > 0 ? filters : undefined
  }, [assessmentTypeFilter])
  
  const { data, isLoading } = useTrainingAssessments(trainingId, apiFilters)
  const createAssessmentMutation = useCreateTrainingAssessment()
  const updateAssessmentMutation = useUpdateTrainingAssessment()
  const deleteAssessmentMutation = useDeleteTrainingAssessment()

  // Check if user can add/edit assessments (everyone except Training Admin)
  const canAddEditAssessments = useMemo(() => {
    return isCompanyAdmin || isProjectManager || isCurriculumAdmin
  }, [isCompanyAdmin, isProjectManager, isCurriculumAdmin])

  const handleAddAssessment = useCallback(() => {
    if (!canAddEditAssessments) return;
    setShowModal(true)
    setIsEditing(false)
    setCurrentAssessmentId(null)
  }, [canAddEditAssessments])
  
  const handleEditAssessment = useCallback((assessment: TrainingAssessment) => {
    if (!canAddEditAssessments) return;
    setCurrentAssessmentId(assessment.id)
    setIsEditing(true)
    setShowModal(true)
  }, [canAddEditAssessments])
  
  const handleDeleteAssessment = useCallback((assessment: TrainingAssessment) => {
    if (!canAddEditAssessments) return;
    setAssessmentToDelete(assessment)
    setDeleteDialogOpen(true)
  }, [canAddEditAssessments])

  const handleAssignSession = useCallback((assessment: TrainingAssessment) => {
    // Only company admin, project manager, and training admin can assign sessions (not curriculum admin)
    if (isCurriculumAdmin) return;
    setAssessmentToAssign(assessment)
    setAssignSessionModalOpen(true)
  }, [isCurriculumAdmin])
  
  const handleFilterApply = useCallback((filters: { selectedAttributes: string[] }) => {
    // setAssessmentTypeFilter(filters.selectedAttributes)
    // setPage(1) // Reset to first page when applying filters
  }, [])
  
  const confirmDelete = useCallback(async () => {
    if (assessmentToDelete) {
      try {
        await deleteAssessmentMutation.mutateAsync(assessmentToDelete.id)
        setDeleteDialogOpen(false)
        setAssessmentToDelete(null)
      } catch (error) {
        console.log("Delete failed:", error)
      }
    }
  }, [deleteAssessmentMutation, assessmentToDelete])
  
  const handleCloseModal = useCallback(() => {
    setShowModal(false)
  }, [])

  const handleSubmitAssessment = useCallback(async (assessmentData: { name: string; description: string; fileLink: string; trainingAssessmentType: 'PRE' | 'POST' }) => {
    try {
      if (isEditing && currentAssessmentId) {
        await updateAssessmentMutation.mutateAsync({
          assessmentId: currentAssessmentId,
          assessmentData
        })
      } else {
        await createAssessmentMutation.mutateAsync({
          trainingId,
          assessmentData
        })
      }
      setShowModal(false)
    } catch (error) {
      console.log("Submission failed:", error)
    }
  }, [createAssessmentMutation, currentAssessmentId, isEditing, trainingId, updateAssessmentMutation])

  // Handle page size change
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1) // Reset to first page when changing page size
  }, [])

  // Memoize filtered and paginated assessments data
  const { 
    filteredAssessments, 
    paginatedAssessments,
    totalElements,
    totalPages 
  } = useMemo(() => {
    // Convert single assessment object to array if needed, or use array if it's already an array
    const assessments = Array.isArray(data?.trainingAssessment) 
      ? data.trainingAssessment 
      : data?.trainingAssessment ? [data.trainingAssessment] : []

    const filtered = assessments.filter((assessment: TrainingAssessment) => {
      // Apply text search filter only - assessment type filter is handled by API
      const matchesSearch = assessment?.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        assessment?.description?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (assessment?.trainingAssessmentType === 'PRE' ? 'pre-training' : 'post-training').includes(debouncedSearch.toLowerCase()) ||
        (assessment?.trainingAssessmentType === 'PRE' ? 'pre' : 'post').includes(debouncedSearch.toLowerCase())
      
      return matchesSearch
    }) || []

    const total = filtered.length || 0
    const totalPgs = Math.ceil(total / pageSize)
    
    const paginated = filtered.slice(
      (page - 1) * pageSize,
      page * pageSize
    ) || []

    return {
      filteredAssessments: filtered,
      paginatedAssessments: paginated,
      totalElements: total,
      totalPages: totalPgs
    }
  }, [data?.trainingAssessment, debouncedSearch, page, pageSize])

  // Add the actions column to the existing columns
  const columnsWithActions = useMemo<ColumnDef<TrainingAssessment>[]>(() => {
    // Get the base columns
    const columns = [...AssessmentColumns]
    
    // Add the actions column only if user has appropriate permissions
    const hasEditPermission = isCompanyAdmin || isProjectManager || isTrainingAdmin || isCurriculumAdmin
    
    if (hasEditPermission) {
      columns.push(createActionsColumn(
        handleEditAssessment, 
        handleDeleteAssessment, 
        handleAssignSession, 
        hasEditPermission,
        isTrainingAdmin,
        isCurriculumAdmin
      ))
    }
    
    return columns
  }, [
    handleEditAssessment, 
    handleDeleteAssessment, 
    handleAssignSession, 
    isCompanyAdmin, 
    isProjectManager, 
    isTrainingAdmin,
    isCurriculumAdmin
  ])

  const emptyState = useMemo(() => (
    <Card className="p-8 text-center">
      <ClipboardList className="h-12 w-12 mx-auto text-gray-400 mb-4" />
      <h3 className="text-xl font-medium mb-2">No Assessments Available</h3>
      <p className="text-gray-500 mb-6">
        Assessments help evaluate training effectiveness and measure participant understanding. They provide valuable data for improving future training programs and tracking learning outcomes.
      </p>
      {canAddEditAssessments && (
        <Button
          onClick={handleAddAssessment}
          className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white"
        >
          Add Assessment
        </Button>
      )}
    </Card>
  ), [handleAddAssessment, canAddEditAssessments])

  if (isLoading) {
    return <Loading />
  }

  return (
    <div className="flex lg:px-16 md:px-14 px-4 w-full">
      <div className="flex-1 py-4 md:pl-12 min-w-0">
        <h1 className="text-lg font-semibold mb-6">Assessments</h1>

        {!data?.trainingAssessment || (Array.isArray(data.trainingAssessment) ? !data.trainingAssessment.length : false) ? (
          <div className="px-[7%] py-8">
            {emptyState}
          </div>
        ) : (
          <>
            <div className="flex items-center lg:justify-end gap-3 mb-6">
              <div className="relative md:w-[300px]">
                <Image
                  src="/search.svg"
                  alt="Search"
                  width={19}
                  height={19}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black h-5 w-5 z-10"
                />
                <Input
                  placeholder="Search assessments..."
                  className="pl-10 h-10 text-sm bg-white border-gray-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Filter
                attributeOptions={[
                  { id: 'PRE', label: 'Pre-Training' },
                  { id: 'POST', label: 'Post-Training' },
                ]}
                onApply={handleFilterApply}
                defaultSelected={{
                  attributes: assessmentTypeFilter
                }}
              />
              
              {canAddEditAssessments && (
                <Button
                  className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2"
                  onClick={handleAddAssessment}
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Assessment</span>
                </Button>
              )}
            </div>

            <AssessmentDataTable
              columns={columnsWithActions}
              data={paginatedAssessments}
              isLoading={isLoading}
              pagination={{
                totalPages,
                currentPage: page,
                setPage,
                pageSize,
                setPageSize: handlePageSizeChange,
                totalElements,
              }}
            />
          </>
        )}

        {/* Add/Edit Assessment Modal */}
        {showModal && canAddEditAssessments && (
          <AssessmentFormModal
            isOpen={showModal}
            onClose={handleCloseModal}
            isEditing={isEditing}
            assessment={isEditing ? (() => {
              const assessments = Array.isArray(data?.trainingAssessment) 
                ? data.trainingAssessment 
                : data?.trainingAssessment ? [data.trainingAssessment] : []
              return assessments.find((a: TrainingAssessment) => a.id === currentAssessmentId) || null
            })() : null}
            isSubmitting={isEditing ? updateAssessmentMutation.isPending : createAssessmentMutation.isPending}
            onSubmit={handleSubmitAssessment}
          />
        )}

        {/* Delete Assessment Dialog */}
        {deleteDialogOpen && canAddEditAssessments && (
          <DeleteAssessmentDialog
            isOpen={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            assessment={assessmentToDelete}
            onConfirmDelete={confirmDelete}
            isDeleting={deleteAssessmentMutation.isPending}
          />
        )}

        {/* Assign Session Modal */}
        {assignSessionModalOpen && !isCurriculumAdmin && (
          <AssignSessionModal
            isOpen={assignSessionModalOpen}
            onClose={() => setAssignSessionModalOpen(false)}
            assessment={assessmentToAssign}
          />
        )}
      </div>
    </div>
  )
}
