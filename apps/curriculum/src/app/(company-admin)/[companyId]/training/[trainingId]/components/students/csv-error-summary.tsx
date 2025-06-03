"use client"

interface CSVStudentData {
  rowIndex: number
  errors?: Record<string, string>
}

interface CSVErrorSummaryProps {
  data: CSVStudentData[]
}

export function CSVErrorSummary({ data }: CSVErrorSummaryProps) {
  const hasErrors = data.some(row => row.errors && Object.keys(row.errors).length > 0)

  if (!hasErrors) {
    return null
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <h4 className="font-medium text-red-800 mb-2">Validation Errors Found</h4>
      <p className="text-sm text-red-600">
        Please fix the highlighted errors before importing. Click on any cell to edit.
      </p>
    </div>
  )
} 