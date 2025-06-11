"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { ChevronLeft, ChevronRight, Loader2, Search, Filter, AlertCircle } from "lucide-react"
import { AttendanceStudent } from "./attendance-columns"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { AddReportButton } from "./add-report-button"
import { useUserRole } from "@/lib/hooks/useUserRole"

interface AttendanceDataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[]
  data: TData[]
  isLoading?: boolean
  pagination: {
    totalPages: number
    currentPage: number
    setPage: (page: number) => void
    pageSize: number
    setPageSize: (pageSize: number) => void
    totalElements: number
  }
  searchQuery?: string
  onSearchChange?: (value: string) => void
  isSaving?: boolean
  onSaveAttendance?: () => void
  hasUnsavedChanges?: boolean
  sessionId?: string
  unsavedStudentId?: string | null
  isInitialLoadComplete: boolean
  canEditAttendance: boolean
}

export function AttendanceDataTable({
  columns,
  data,
  isLoading,
  pagination,
  searchQuery = "",
  onSearchChange = () => {},
  isSaving = false,
  onSaveAttendance,
  hasUnsavedChanges = false,
  sessionId = "",
  unsavedStudentId = null,
  isInitialLoadComplete,
  canEditAttendance,
}: AttendanceDataTableProps<AttendanceStudent>) {
  const [sorting, setSorting] = useState<SortingState>([])
  
  // Only consider view-only if initial load is complete
  const isViewOnly = isInitialLoadComplete && !canEditAttendance

  const table = useReactTable({
    data: Array.isArray(data) ? data : [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  // Calculate showing range for display
  const startRecord = pagination.currentPage > 0 
    ? ((pagination.currentPage - 1) * pagination.pageSize) + 1 
    : 0
  const endRecord = Math.min(pagination.currentPage * pagination.pageSize, pagination.totalElements)
  const showingText = pagination.totalElements > 0
    ? `Showing ${startRecord} to ${endRecord} out of ${pagination.totalElements} records`
    : "No records to show"

  // Determine the name of the student with unsaved changes for the button text
  const unsavedStudent = unsavedStudentId 
    ? data.find(student => (student as AttendanceStudent).id === unsavedStudentId) as AttendanceStudent | undefined 
    : undefined;
  const saveButtonText = hasUnsavedChanges && unsavedStudent 
    ? `Save for ${unsavedStudent.firstName}` 
    : "Save Attendance";

  return (
    <div>
      <div className="rounded-md border border-gray-200 bg-white overflow-hidden relative">
        <div className="flex items-center justify-between p-4 bg-[#FBFBFB]">
          <div className="flex items-center gap-2">
            {onSaveAttendance && canEditAttendance && (
              <Button 
                variant="default" 
                className="bg-[#0B75FF] hover:bg-blue-700 text-white"
                onClick={onSaveAttendance}
                disabled={isSaving || !hasUnsavedChanges}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  saveButtonText
                )}
              </Button>
            )}
            
            {isViewOnly && (
              <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md text-xs flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5" />
                View Only Mode
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative md:w-[250px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search students..."
                className="pl-9 h-9 border border-[#D0D5DD] rounded-md text-sm"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                disabled={isViewOnly}
              />
            </div>
            
            {/* Filter button only visible to trainers who can edit */}
            {canEditAttendance && (
              <button className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-[#344054] h-9 whitespace-nowrap">
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </button>
            )}
            
            {/* Report button visible to all, but enabled only for trainers */}
            <AddReportButton 
              sessionId={sessionId} 
              disabled={!canEditAttendance}
            />
          </div>
        </div>
        
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-[#FCFCFD] border-b border-[#EAECF0]">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="p-3 text-left text-xs font-medium text-[#667085]"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : data && data.length > 0 ? (
              table.getRowModel().rows.map((row) => {
                // Only apply disabled state if initial load is complete
                if (isInitialLoadComplete && isViewOnly && row.original) {
                  (row.original as AttendanceStudent)._isDisabled = true;
                }
                
                return (
                  <TableRow key={row.id} className="border-b border-[#EAECF0]">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="p-3">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No students found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      {/* Pagination */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <span className="md:text-sm text-xs text-gray-500">Showing</span>
          <select
            value={pagination.pageSize}
            onChange={(e) => pagination.setPageSize(Number(e.target.value))}
            className="border rounded-md md:text-sm text-xs md:px-2 px-2 py-1 bg-white"
            title="Page Size"
            disabled={isViewOnly}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={30}>30</option>
            <option value={50}>50</option>
          </select>
        </div>

        <div className="text-xs md:text-sm pl-2 text-gray-500">
          {showingText}
        </div>

        <div className="flex gap-1">
          <Button
            variant="pagination"
            size="sm"
            onClick={() => pagination.setPage(Math.max(1, pagination.currentPage - 1))}
            disabled={pagination.currentPage <= 1 || isViewOnly}
            className="px-2 h-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          {Array.from(
            { length: Math.min(5, pagination.totalPages) },
            (_, i) => {
              // Logic to show pagination numbers centered around current page
              let pageNumber;
              if (pagination.totalPages <= 5) {
                // If we have 5 or fewer pages, show all
                pageNumber = i + 1;
              } else {
                // For more pages, center around current page
                const middle = 2;
                const start = Math.max(1, pagination.currentPage - middle);
                const end = Math.min(pagination.totalPages, start + 4);
                
                // Adjust start if we're near the end
                const adjustedStart = end === pagination.totalPages 
                  ? Math.max(1, end - 4) 
                  : start;
                
                pageNumber = adjustedStart + i;
              }
              
              // Don't render if the page number exceeds total pages
              if (pageNumber > pagination.totalPages) return null;
              
              return (
                <Button
                  key={pageNumber}
                  variant={pagination.currentPage === pageNumber ? "outline" : "ghost"}
                  size="sm"
                  onClick={() => pagination.setPage(pageNumber)}
                  disabled={isViewOnly}
                  className={cn(
                    "px-3 h-8",
                    pagination.currentPage === pageNumber 
                      ? "border-[#0B75FF] text-[#0B75FF]" 
                      : ""
                  )}
                >
                  {pageNumber}
                </Button>
              );
            }
          ).filter(Boolean)}
          
          <Button
            variant="pagination"
            size="sm"
            onClick={() => pagination.setPage(pagination.currentPage + 1)}
            disabled={pagination.currentPage >= pagination.totalPages || isViewOnly}
            className="px-2 h-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
} 