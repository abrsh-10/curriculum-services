"use client"

import { useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useJobs } from "@/lib/hooks/useJobs"
import { useUserRole } from "@/lib/hooks/useUserRole"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { createJobColumns } from "./job-columns"
import { JobDataTable } from "./job-data-table"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import Image from 'next/image'
import { useDebounce } from "@/lib/hooks/useDebounce"
import { CreateJobModal } from "./create-job-modal"
import { JobDetailModal } from "./job-detail-modal"

export function JobsList() {
  const router = useRouter()
  const params = useParams()
  const companyId = params.companyId as string

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 500)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [selectedJobId, setSelectedJobId] = useState<string>("")

  const { isProjectManager, isTrainingAdmin } = useUserRole()
  
  const { data, isLoading, error } = useJobs({
    page: page,
    pageSize: pageSize,
  })

  const handleViewDetails = (jobId: string) => {
    setSelectedJobId(jobId)
    setIsDetailModalOpen(true)
  }

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true)
  }

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false)
  }

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false)
  }

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1)
  }

  const filteredJobs = (data?.jobs || []).filter(job => 
    job?.title?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    job?.description?.toLowerCase().includes(debouncedSearch.toLowerCase()) 
  )

  const totalElements = filteredJobs.length
  const totalPages = Math.ceil(totalElements / pageSize)

  const paginatedJobs = filteredJobs.slice(
    (page - 1) * pageSize,
    page * pageSize
  )

  // Create columns with the handler
  const jobColumns = createJobColumns(handleViewDetails)

  if (isLoading && !data) {
    return <Loading />
  }

  if (error) {
    return (
      <div className="flex lg:px-16 md:px-14 px-4 w-full">
        <div className="flex-1 py-4 md:pl-12 min-w-0">
          <h1 className="text-lg font-normal mb-6">Jobs</h1>
          <div className="text-center py-20 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-medium mb-2">Error Loading Jobs</h3>
            <p className="text-gray-500 text-sm">
              There was a problem loading the jobs. Please try again later.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const noJobsAvailable = filteredJobs.length === 0;

  if (noJobsAvailable && !debouncedSearch && !isLoading) {
    return (
      <div className="flex lg:px-16 md:px-14 px-4 w-full">
        <div className="flex-1 py-4 md:pl-12 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-normal">Jobs</h1>
            {(isProjectManager || isTrainingAdmin) && (
              <Button 
                className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2 h-10"
                onClick={handleOpenCreateModal}
              >
                <Plus className="h-4 w-4" />
                <span>Create Job</span>
              </Button>
            )}
          </div>
          <div className="flex flex-col items-center justify-center text-center py-40 bg-gray-50 rounded-lg border">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0H8m8 0v2a2 2 0 01-2 2H10a2 2 0 01-2-2V6m8 0H8m0 10v4a2 2 0 002 2h4a2 2 0 002-2v-4M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h2m0 10h8m-8 0V6m8 10v4m0-4V6" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Jobs Created Yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create job posts to find and assign trainers to training sessions.
            </p>
            {(isProjectManager || isTrainingAdmin) && (
              <div className="mt-6">
                <Button
                  className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2"
                  onClick={handleOpenCreateModal}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Your First Job</span>
                </Button>
              </div>
            )}
          </div>
          {(isProjectManager || isTrainingAdmin) && (
            <CreateJobModal 
              isOpen={isCreateModalOpen} 
              onClose={handleCloseCreateModal} 
            />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex lg:px-16 md:px-14 px-4 w-full">
      <div className="flex-1 py-4 md:pl-12 min-w-0">
        <h1 className="text-lg font-normal mb-6">Jobs</h1>

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
              placeholder="Search jobs..."
              className="pl-10 h-10 bg-white border-gray-200 rounded-lg"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
            />
          </div>
          {(isProjectManager || isTrainingAdmin) && (
            <Button 
              className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2 h-10"
              onClick={handleOpenCreateModal}
            >
              <Plus className="h-4 w-4" />
              <span>Create Job</span>
            </Button>
          )}
        </div>

        {noJobsAvailable && debouncedSearch && !isLoading && (
          <div className="text-center py-20 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-medium mb-2">No Jobs Found</h3>
            <p className="text-gray-500 text-sm">
              Your search for &quot;{debouncedSearch}&quot; did not match any jobs.
            </p>
          </div>
        )}

        {!noJobsAvailable && (
          <JobDataTable
            columns={jobColumns}
            data={paginatedJobs}
            isLoading={isLoading}
            pagination={{
              totalPages,
              currentPage: page,
              setPage,
              pageSize,
              setPageSize: handlePageSizeChange,
              totalElements 
            }}
          />
        )}

        {(isProjectManager || isTrainingAdmin) && (
          <CreateJobModal 
            isOpen={isCreateModalOpen} 
            onClose={handleCloseCreateModal} 
          />
        )}

        {/* Job Detail Modal */}
        {selectedJobId && (
          <JobDetailModal
            jobId={selectedJobId}
            isOpen={isDetailModalOpen}
            onClose={handleCloseDetailModal}
          />
        )}
      </div>
    </div>
  )
} 