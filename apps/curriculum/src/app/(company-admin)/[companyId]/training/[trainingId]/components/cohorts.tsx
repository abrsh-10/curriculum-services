"use client"

import { useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { useUserRole } from "@/lib/hooks/useUserRole"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"
import { useCohorts } from "@/lib/hooks/useCohorts"
import { Input } from "@/components/ui/input"
import { CohortList } from "./cohorts/cohort-list"
import { CohortForm } from "./cohorts/cohort-form"
import { CohortFilter, CohortFilters } from "./cohorts/cohort-filter"
import { 
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent
} from "@/components/ui/dialog"
import Image from "next/image"

interface CohortsComponentProps {
  trainingId: string
}

export function CohortsComponent({ trainingId }: CohortsComponentProps) {
  const params = useParams()
  const { isProjectManager, isTrainingAdmin } = useUserRole()
  
  // Pagination state
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [activeSearchTerm, setActiveSearchTerm] = useState("")
  const [filters, setFilters] = useState<CohortFilters>({})
  
  // Modal state
  const [isAddCohortModalOpen, setIsAddCohortModalOpen] = useState(false)
  const [isEditCohortModalOpen, setIsEditCohortModalOpen] = useState(false)
  const [cohortToEdit, setCohortToEdit] = useState<typeof cohorts[0] | null>(null)
  
  // Build API query parameters
  const queryParams = useMemo(() => {
    const params: {
      trainingId: string
      page: number
      pageSize: number
      searchQuery?: string
      name?: string
      tags?: string[]
      createdAtFrom?: string
      createdAtTo?: string
    } = {
      trainingId,
      page,
      pageSize,
    }
    
    if (activeSearchTerm.trim()) {
      params.searchQuery = activeSearchTerm.trim()
    }
    
    if (filters.name) {
      params.name = filters.name
    }
    
    if (filters.tags && filters.tags.length > 0) {
      params.tags = filters.tags
    }
    
    if (filters.createdAtFrom) {
      params.createdAtFrom = filters.createdAtFrom.toISOString()
    }
    
    if (filters.createdAtTo) {
      params.createdAtTo = filters.createdAtTo.toISOString()
    }
    
    return params
  }, [trainingId, page, pageSize, activeSearchTerm, filters])
  
  const { data, isLoading, error } = useCohorts(queryParams)
  
  const cohorts = useMemo(() => data?.cohorts || [], [data?.cohorts])
  const totalPages = data?.totalPages || 0
  const totalElements = data?.totalElements || 0

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

  const handleFiltersChange = (newFilters: CohortFilters) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filters change
  }

  // Page size change handled inline in pagination UI to match existing patterns

  const handleSearch = () => {
    setActiveSearchTerm(searchTerm)
    setPage(1) // Reset to first page when searching
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    
    // If user clears the search, immediately show all results
    if (value.trim() === "") {
      setActiveSearchTerm("")
      setPage(1)
    }
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Extract all unique tags from cohorts for filter dropdown
  const availableTags = useMemo(() => {
    const tagsSet = new Set<string>()
    cohorts.forEach(cohort => {
      cohort.tags?.forEach(tag => tagsSet.add(tag))
    })
    return Array.from(tagsSet).sort()
  }, [cohorts])

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
                <Input
                  type="text"
                  placeholder="Search cohorts..."
                  className="pr-10 h-10 text-sm bg-white border-gray-200"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyDown}
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 hover:opacity-70 transition-opacity"
                  aria-label="Search"
                >
                  <Image
                    src="/search.svg"
                    alt="Search"
                    width={19}
                    height={19}
                    className="h-5 w-5"
                  />
                </button>
              </div>

              <CohortFilter
                filters={filters}
                onFiltersChange={handleFiltersChange}
                availableTags={availableTags}
              />
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
            <>
              <CohortList cohorts={cohorts} onEditCohort={handleEditCohort} />
              
              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center justify-between w-full">
                    {/* Left - Page Size Selector */}
                    <div className="flex items-center gap-2">
                      <span className="md:text-sm text-xs text-gray-500">Showing</span>
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          const newSize = Number(e.target.value)
                          setPageSize(newSize)
                          setPage(1)
                        }}
                        className="border rounded-md md:text-sm text-xs md:px-2 px-2 py-1 bg-white"
                        title="Page Size"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                        <option value={30}>30</option>
                        <option value={50}>50</option>
                      </select>
                    </div>

                    {/* Center - Showing Text */}
                    <div className="text-xs md:text-sm pl-2 text-gray-500">
                      {(() => {
                        const startRecord = page > 0 ? ((page - 1) * pageSize) + 1 : 0
                        const endRecord = Math.min(page * pageSize, totalElements)
                        return totalElements > 0
                          ? `Showing ${startRecord} to ${endRecord} out of ${totalElements} records`
                          : "No records to show"
                      })()}
                    </div>

                    {/* Right - Pagination Controls */}
                    <div className="flex gap-1">
                      <Button
                        variant="pagination"
                        size="sm"
                        onClick={() => setPage(Math.max(1, page - 1))}
                        disabled={page <= 1}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber
                        if (totalPages <= 5) {
                          pageNumber = i + 1
                        } else {
                          const middle = 2
                          const start = Math.max(1, page - middle)
                          const end = Math.min(totalPages, start + 4)
                          const adjustedStart = end === totalPages ? Math.max(1, end - 4) : start
                          pageNumber = adjustedStart + i
                        }
                        if (pageNumber > totalPages) return null
                        return (
                          <Button
                            key={pageNumber}
                            variant="outline"
                            className={page === pageNumber ? "border-brand text-brand" : ""}
                            size="sm"
                            onClick={() => setPage(pageNumber)}
                          >
                            {pageNumber}
                          </Button>
                        )
                      }).filter(Boolean)}
                      <Button
                        variant="pagination"
                        size="sm"
                        onClick={() => setPage(Math.min(totalPages, page + 1))}
                        disabled={page >= totalPages}
                      >
                        <ChevronRight className="md:w-4 md:h-4 w-2 h-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
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