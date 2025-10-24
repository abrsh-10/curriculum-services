"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { useTrainers, Trainer } from "@/lib/hooks/useTrainers"
import { Loading } from "@/components/ui/loading"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { TrainerDataTable } from "./components/trainer-data-table" 
import { createColumns } from "./components/columns"
import { useUserRole } from "@/lib/hooks/useUserRole"
import { useBaseData } from "@/lib/hooks/useBaseData"
import Image from 'next/image'

const DEFAULT_PAGE = 1
const DEFAULT_PAGE_SIZE = 10

export default function TrainersPage() {
  const params = useParams()
  const companyId = params.companyId as string
  const { isTrainerAdmin, isProjectManager } = useUserRole()
  const { data: languages } = useBaseData('language')
  const { data: academicLevels } = useBaseData('academic-level')
  const { data: trainingTags } = useBaseData('training-tag')

  const [page, setPage] = useState<number>(DEFAULT_PAGE)
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearch = useDebounce(searchQuery, 500)

  // Fetch data from server with pagination
  const { data: trainersData, isLoading, error } = useTrainers(page, pageSize)

  // Extract trainers list and pagination info from API response
  const trainers = trainersData?.trainers || []
  const totalPages = trainersData?.totalPages || 0
  const totalElements = trainersData?.totalElements || 0
  const currentPage = trainersData?.currentPage || page

  // Client-side filtering only for search
  const filteredTrainers = trainers.filter(trainer => 
    trainer?.firstName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    trainer?.lastName?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    trainer?.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
  ) || []

  const handlePageChange = (newPage: number) => {
    setPage(newPage)
  }

  const handlePageSizeChange = (size: number) => {
    setPageSize(size)
    setPage(DEFAULT_PAGE) // Reset to first page on size change
  }

  const paginationProps = {
    totalPages,
    currentPage,
    setPage: handlePageChange,
    pageSize,
    setPageSize: handlePageSizeChange,
    totalElements
  }
  
  // Construct the add trainer link
  const addTrainerHref = `/${companyId}/trainers/add`

  const handleViewTrainer = (trainer: Trainer) => {
    // Will be implemented with modal
  }

  const handleEditTrainer = (trainer: Trainer) => {
    // Will be implemented with modal
  }

  const handleDeleteTrainer = (trainer: Trainer) => {
    // Will be implemented with modal
  }

  const columns = createColumns(handleViewTrainer, handleEditTrainer, handleDeleteTrainer)

  if (isLoading && !trainersData) { // Show loading only on initial load
    return <Loading />
  }

  if (error) {
    return (
      <div className="flex lg:px-16 md:px-14 px-4 w-full">
        <div className="flex-1 py-4 md:pl-12 min-w-0">
          <h1 className="text-lg font-normal mb-6">Trainers</h1>
          <div className="text-center py-20 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-medium mb-2">Error Loading Trainers</h3>
            <p className="text-gray-500 text-sm">
              There was a problem loading the trainers. Please try again later.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Check if we have trainers to display (either all or filtered)
  const noTrainersAvailable = debouncedSearch ? filteredTrainers.length === 0 : trainers.length === 0;

  // Empty State 
  if (noTrainersAvailable && !debouncedSearch && !isLoading) {
    return (
      <div className="flex lg:px-16 md:px-14 px-4 w-full">
        <div className="flex-1 py-4 md:pl-12 min-w-0">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg font-normal">Trainers</h1>
            {(isTrainerAdmin || isProjectManager) && (
              <Button asChild className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2 h-10">
                <Link href={addTrainerHref}>
                  <Plus className="h-4 w-4" />
                  <span>Add Trainer</span>
                </Link>
              </Button>
            )}
          </div>
          <div className="flex flex-col items-center justify-center text-center py-40 bg-gray-50 rounded-lg border">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No Trainers Added Yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Add trainers to manage their details and assign them to training programs.
            </p>
            {(isTrainerAdmin || isProjectManager) && (
              <div className="mt-6">
                <Button asChild className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2">
                  <Link href={addTrainerHref}>
                    <Plus className="h-4 w-4" />
                    <span>Add Your First Trainer</span>
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Data Present State - Matching the jobs page layout
  return (
    <div className="flex lg:px-16 md:px-14 px-4 w-full">
      <div className="flex-1 py-4 md:pl-12 min-w-0">
        <h1 className="text-lg font-normal mb-6">Trainers</h1>

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
              placeholder="Search trainers..."
              className="pl-10 h-10 bg-white border-gray-200 rounded-lg"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
            />
          </div>
          {(isTrainerAdmin || isProjectManager) && (
            <Button asChild className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2 h-10">
              <Link href={addTrainerHref}>
                <Plus className="h-4 w-4" />
                <span>Add Trainer</span>
              </Link>
            </Button>
          )}
        </div>

        {noTrainersAvailable && debouncedSearch && !isLoading && (
          <div className="text-center py-20 bg-gray-50 rounded-lg border">
            <h3 className="text-lg font-medium mb-2">No Trainers Found</h3>
            <p className="text-gray-500 text-sm">
              Your search for &quot;{debouncedSearch}&quot; did not match any trainers.
            </p>
          </div>
        )}
        
        {!noTrainersAvailable && (
          <TrainerDataTable
            data={debouncedSearch ? filteredTrainers : trainers}
            isLoading={isLoading}
            pagination={paginationProps}
            languages={languages || []}
            academicLevels={academicLevels || []}
            trainingTags={trainingTags || []}
          />
        )}
      </div>
    </div>
  )
}