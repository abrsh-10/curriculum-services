"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useUserRole } from "@/lib/hooks/useUserRole"
import { Button } from "@/components/ui/button"
import { Plus, Filter, Loader2, Search } from "lucide-react"
import { useCohortTrainees, useRemoveTraineesFromCohort } from "@/lib/hooks/useCohorts"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { Loading } from "@/components/ui/loading"
import { StudentDataTable } from "../../../components/students/student-data-table"
import { studentColumns, createRemoveFromCohortColumn } from "../../../components/students/student-columns"
import { AddCohortStudentModal } from "./add-cohort-student-modal"
import { Student } from "@/lib/hooks/useStudents"
import { toast } from "sonner"
import Image from "next/image"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface CohortStudentsProps {
  cohortId: string
  trainingId: string
}

export function CohortStudents({ cohortId, trainingId }: CohortStudentsProps) {
  const params = useParams()
  const companyId = params.companyId as string
  const { isProjectManager, isTrainingAdmin } = useUserRole()
  
  // State for pagination, search, and modal
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false)
  
  // State for remove confirmation dialog
  const [studentToRemove, setStudentToRemove] = useState<Student | null>(null)
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false)
  
  const debouncedSearch = useDebounce(searchQuery, 500)
  
  // Fetch cohort trainees with pagination
  const { data, isLoading, error, refetch } = useCohortTrainees(cohortId, page, pageSize)
  
  // Remove trainees mutation
  const { removeTrainees, isLoading: isRemoving } = useRemoveTraineesFromCohort()
  
  const students = data?.trainees || []
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

  // Filter students based on search query (client-side for better UX)
  const filteredStudents = students.filter(student => {
    if (!debouncedSearch) return true
    const searchLower = debouncedSearch.toLowerCase()
    return (
      student.firstName?.toLowerCase().includes(searchLower) ||
      student.lastName?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.contactPhone?.toLowerCase().includes(searchLower)
    )
  })

  const handleOpenAddStudentModal = () => {
    setIsAddStudentModalOpen(true)
  }

  const handleCloseAddStudentModal = () => {
    setIsAddStudentModalOpen(false)
    refetch() // Refresh the cohort students list when modal closes
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1) // Reset to first page when changing page size
  }

  const handleRemoveStudent = (student: Student) => {
    if (!student.id) {
      toast.error("Invalid student data")
      return
    }

    // Show confirmation dialog instead of immediately removing
    setStudentToRemove(student)
    setIsRemoveDialogOpen(true)
  }

  const confirmRemoveStudent = () => {
    if (!studentToRemove?.id) {
      toast.error("Invalid student data")
      return
    }

    removeTrainees({
      cohortId,
      traineeIds: [studentToRemove.id],
      trainingId
    }, {
      onSuccess: () => {
        toast.success(`${studentToRemove.firstName} ${studentToRemove.lastName} removed from cohort`)
        refetch() // Refresh the list after removal
        setIsRemoveDialogOpen(false)
        setStudentToRemove(null)
      }
    })
  }

  const cancelRemove = () => {
    setIsRemoveDialogOpen(false)
    setStudentToRemove(null)
  }

  // Get assigned student IDs for the modal (to filter out already assigned students)
  const assignedStudentIds = students.map(student => student.id)

  // Create columns with remove action
  const columnsWithRemove = [
    ...studentColumns,
    createRemoveFromCohortColumn(
      handleRemoveStudent,
      isProjectManager || isTrainingAdmin,
      isRemoving
    )
  ]

  if (isLoading && !data) {
    return <Loading />
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Students</h2>
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
              placeholder="Search students..."
              className="pl-10 h-10 text-sm bg-white border-gray-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
              onClick={handleOpenAddStudentModal}
              disabled={isLoading}
            >
              <Plus className="h-4 w-4" />
              <span>Add Students</span>
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <div className="text-center py-20 bg-[#fbfbfb] rounded-lg border-[0.1px]">
          <h3 className="text-lg font-medium mb-2">Error Loading Students</h3>
          <p className="text-gray-500 text-sm">
            There was a problem loading the students. Please try again later.
          </p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-20 bg-[#fbfbfb] rounded-lg border-[0.1px]">
          <h3 className="text-lg font-medium mb-2">No Students Added Yet</h3>
          <p className="text-gray-500 text-sm">
            Add students to this cohort to get started.
          </p>
          {(isProjectManager || isTrainingAdmin) && (
            <Button 
              className="mt-4 bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2 mx-auto"
              onClick={handleOpenAddStudentModal}
            >
              <Plus className="h-4 w-4" />
              <span>Add Students</span>
            </Button>
          )}
        </div>
      ) : (
        <StudentDataTable
          columns={columnsWithRemove}
          data={filteredStudents}
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
      )}

      {/* Add Student Modal */}
      <AddCohortStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={handleCloseAddStudentModal}
        cohortId={cohortId}
        trainingId={trainingId}
        companyId={companyId}
        assignedStudentIds={assignedStudentIds}
      />

      {/* Remove Student Confirmation Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="">Remove Student from Cohort</AlertDialogTitle>
            <AlertDialogDescription className="text-black">
              Are you sure you want to remove <strong>{studentToRemove?.firstName} {studentToRemove?.lastName}</strong> from this cohort?
              <br />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelRemove}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemoveStudent}
              className="bg-red-600 text-white hover:bg-red-700 focus:ring-red-500"
              disabled={isRemoving}
            >
              {isRemoving ? "Removing..." : "Remove Student"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
} 