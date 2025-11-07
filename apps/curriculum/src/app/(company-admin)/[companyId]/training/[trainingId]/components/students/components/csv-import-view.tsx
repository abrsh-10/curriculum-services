"use client"

import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { CSVImportContent } from "../csv-import-content"
import { CreateStudentByNameData } from "@/lib/hooks/useStudents"
import { BaseDataItem } from "@/types/base-data"

interface BaseDataResponse {
  data: BaseDataItem[]
  totalItems?: number
  totalPages?: number
  currentPage?: number
  pageSize?: number
}

// Types matching CSVImportContent expectations
interface Country {
  id: string
  name: string
  description: string
}

interface Region {
  id: string
  name: string
  description: string
  country: Country
}

interface Zone {
  id: string
  name: string
  description: string
  region: Region
}

interface City {
  id: string
  name: string
  description: string
  zone?: Zone
}

interface Language {
  id: string
  name: string
  description: string
}

interface AcademicLevel {
  id: string
  name: string
  description: string
}

interface Disability {
  id: string
  name: string
  description: string
}

interface MarginalizedGroup {
  id: string
  name: string
  description: string
}

interface CSVImportViewProps {
  onBack: () => void
  onImport: (students: CreateStudentByNameData[]) => Promise<void>
  onFileUpload: () => void
  isSubmitting: boolean
  languages?: BaseDataResponse | null
  countries?: BaseDataResponse | null
  regions?: BaseDataResponse | null
  zones?: BaseDataResponse | null
  cities?: BaseDataResponse | null
  academicLevels?: BaseDataResponse | null
  disabilities?: BaseDataResponse | null
  marginalizedGroups?: BaseDataResponse | null
}

export function CSVImportView({
  onBack,
  onImport,
  onFileUpload,
  isSubmitting,
  languages,
  countries,
  regions,
  zones,
  cities,
  academicLevels,
  disabilities,
  marginalizedGroups,
}: CSVImportViewProps) {
  return (
    <>
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="flex items-center gap-2 text-brand hover:text-brand-dark"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Students
        </Button>
        <h1 className="text-lg font-semibold">Import Students from CSV</h1>
      </div>

      <CSVImportContent
        onImport={onImport}
        onFileUpload={onFileUpload}
        isSubmitting={isSubmitting}
        languages={(languages?.data || []) as Language[]}
        countries={(countries?.data || []) as Country[]}
        // Note: useBaseData returns flat BaseDataItem[], but CSVImportContent expects nested structures
        // Using type assertions here - the API endpoints /region, /zone, /city may return nested data
        // If validation fails, we may need to use cascading location endpoints to fetch with nested relationships
        regions={(regions?.data || []) as Region[]}
        zones={(zones?.data || []) as Zone[]}
        cities={(cities?.data || []) as City[]}
        academicLevels={(academicLevels?.data || []) as AcademicLevel[]}
        disabilities={(disabilities?.data || []) as Disability[]}
        marginalizedGroups={(marginalizedGroups?.data || []) as MarginalizedGroup[]}
      />
    </>
  )
}

