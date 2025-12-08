"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  SortingState,
  getSortedRowModel,
  RowSelectionState,
  OnChangeFn,
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
import { ChevronLeftIcon, ChevronRightIcon, Loader2 } from "lucide-react"
import { Student } from "@/lib/hooks/useStudents"

interface StudentDataTableProps<TData> {
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
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
}

export function StudentDataTable({
  columns,
  data,
  isLoading,
  pagination,
  rowSelection = {},
  onRowSelectionChange,
}: StudentDataTableProps<Student>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data: Array.isArray(data) ? data : [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    // Use stable row IDs so selection persists across pagination/sorting and maps to student IDs
    getRowId: (row) => (row as Student).id,
    state: {
      sorting,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: onRowSelectionChange,
    // No need for client-side pagination as we're using server-side pagination
  })

  // Calculate showing range for display
  const startRecord = pagination.currentPage > 0 
    ? ((pagination.currentPage - 1) * pagination.pageSize) + 1 
    : 0
  const endRecord = Math.min(pagination.currentPage * pagination.pageSize, pagination.totalElements)
  const showingText = pagination.totalElements > 0
    ? `Showing ${startRecord} to ${endRecord} out of ${pagination.totalElements} records`
    : "No records to show"

  // Calculate pagination button range
  const getPaginationRange = () => {
    const totalPages = pagination.totalPages
    const currentPage = pagination.currentPage
    const maxButtons = 5
    
    if (totalPages <= maxButtons) {
      // Show all pages if total is less than or equal to max buttons
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    
    // Calculate start and end for sliding window
    const halfRange = Math.floor(maxButtons / 2)
    let start = Math.max(1, currentPage - halfRange)
    const end = Math.min(totalPages, start + maxButtons - 1)
    
    // Adjust start if we're near the end
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1)
    }
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const paginationRange = getPaginationRange()

  return (
    <div>
      <div className="rounded-md border border-gray-200 bg-white overflow-hidden relative">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-gray-50">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="py-4 px-5 text-sm font-medium text-gray-500 bg-gray-50"
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
              // Show skeleton rows to maintain table structure during loading
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`} className="border-gray-100">
                  {columns.map((_, colIndex) => (
                    <TableCell key={`skeleton-cell-${colIndex}`} className="py-4 px-5">
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : data && data.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="border-gray-100">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-4 px-5 text-sm">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
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
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center justify-between w-full">
          {/* Left side - Page Size Selector */}
          <div className="flex items-center gap-2">
            <span className="md:text-sm text-xs text-gray-500">Showing</span>
            <select
              value={pagination.pageSize}
              onChange={(e) => pagination.setPageSize(Number(e.target.value))}
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
            {showingText}
          </div>

          {/* Right side - Pagination Controls */}
          <div className="flex gap-1">
            <Button
              variant="pagination"
              size="sm"
              onClick={() =>
                pagination.setPage(Math.max(1, pagination.currentPage - 1))
              }
              disabled={pagination.currentPage <= 1}
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </Button>
            {paginationRange.map((pageNumber) => (
              <Button
                key={pageNumber}
                variant="outline"
                className={pagination.currentPage === pageNumber ? "border-brand text-brand" : ""}
                size="sm"
                onClick={() => pagination.setPage(pageNumber)}
              >
                {pageNumber}
              </Button>
            ))}
            <Button
              variant="pagination"
              size="sm"
              onClick={() => pagination.setPage(pagination.currentPage + 1)}
              disabled={pagination.currentPage >= pagination.totalPages}
            >
              <ChevronRightIcon className="md:w-4 md:h-4 w-2 h-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 