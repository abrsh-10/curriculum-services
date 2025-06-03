"use client"

import { Button } from "@/components/ui/button"
import { FileText, X } from "lucide-react"

interface CSVFileInfoProps {
  fileName: string
  studentCount: number
  onClear: () => void
}

export function CSVFileInfo({ fileName, studentCount, onClear }: CSVFileInfoProps) {
  return (
    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-blue-500" />
        <span className="font-medium">{fileName}</span>
        <span className="text-sm text-gray-500">
          ({studentCount} students)
        </span>
      </div>
      <Button variant="outline" size="sm" onClick={onClear}>
        <X className="h-4 w-4 mr-1" />
        Clear
      </Button>
    </div>
  )
} 