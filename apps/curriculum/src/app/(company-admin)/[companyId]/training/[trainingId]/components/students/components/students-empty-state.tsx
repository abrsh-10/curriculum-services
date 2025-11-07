"use client"

import { Button } from "@/components/ui/button"
import { Plus, Upload } from "lucide-react"

interface StudentsEmptyStateProps {
  onAddStudent: () => void
  onShowImport: () => void
  hasEditPermission: boolean
}

export function StudentsEmptyState({
  onAddStudent,
  onShowImport,
  hasEditPermission,
}: StudentsEmptyStateProps) {
  return (
    <div className="text-center py-40 bg-[#fbfbfb] rounded-lg border-[0.1px]">
      <h3 className="text-lg font-medium mb-2">No Student Added Yet</h3>
      <p className="text-gray-500 text-sm mb-6">
        This specifies the core teaching methods used to deliver content and facilitate learning.
      </p>
      {hasEditPermission && (
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Button
            className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-2"
            onClick={onAddStudent}
          >
            <Plus className="h-4 w-4" />
            <span>Add Student</span>
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={onShowImport}
          >
            <Upload className="h-4 w-4" />
            <span>Import CSV</span>
          </Button>
        </div>
      )}
    </div>
  )
}

