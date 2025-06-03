"use client"

import { useState, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileText, X } from "lucide-react"
import { cn } from "@/lib/utils"
import Papa from "papaparse"
import { StudentFormValues } from "../../students/add/components/formSchemas"
import { toast } from "sonner"
import { CSVUploadSection } from "./csv-upload-section"
import { CSVDataTable } from "./csv-data-table"
import { CSVFileInfo } from "./csv-file-info"
import { CSVErrorSummary } from "./csv-error-summary"

interface CSVStudentData {
  firstName: string
  middleName: string
  lastName: string
  email: string
  contactPhone: string
  dateOfBirth: string
  gender?: string
  countryId: string
  regionId: string
  zoneId: string
  cityId: string
  woreda: string
  houseNumber: string
  languageId: string
  academicLevelId: string
  fieldOfStudy: string
  hasSmartphone: string
  smartphoneOwner: string
  hasTrainingExperience: string
  trainingExperienceDescription: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
  hasDisability?: string
  belongsToMarginalizedGroup?: string
  disabilityIds: string
  marginalizedGroupIds: string
  rowIndex: number
  errors?: Record<string, string>
}

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

interface CSVImportContentProps {
  onImport: (students: StudentFormValues[]) => Promise<void>
  isSubmitting: boolean
  languages: Language[]
  countries: Country[]
  regions: Region[]
  zones: Zone[]
  cities: City[]
  academicLevels: AcademicLevel[]
  disabilities: Disability[]
  marginalizedGroups: MarginalizedGroup[]
}

export function CSVImportContent({
  onImport,
  isSubmitting,
  languages,
  countries,
  regions,
  zones,
  cities,
  academicLevels,
  disabilities,
  marginalizedGroups
}: CSVImportContentProps) {
  const [csvData, setCsvData] = useState<CSVStudentData[]>([])
  const [fileName, setFileName] = useState<string>("")

  const validateCSVRow = (row: Record<string, string>, index: number): CSVStudentData => {
    const errors: Record<string, string> = {}
    
    // Required field validations
    if (!row.firstName?.trim()) errors.firstName = "First name is required"
    if (!row.lastName?.trim()) errors.lastName = "Last name is required"
    if (!row.email?.trim()) errors.email = "Email is required"
    if (!row.contactPhone?.trim()) errors.contactPhone = "Contact phone is required"
    if (!row.dateOfBirth?.trim()) errors.dateOfBirth = "Date of birth is required"
    if (!row.gender?.trim()) errors.gender = "Gender is required"
    
    // Email validation
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.email = "Invalid email format"
    }
    
    // Date validation
    if (row.dateOfBirth && isNaN(Date.parse(row.dateOfBirth))) {
      errors.dateOfBirth = "Invalid date format (use YYYY-MM-DD)"
    }
    
    // Gender validation
    if (row.gender && !["MALE", "FEMALE"].includes(row.gender.toUpperCase())) {
      errors.gender = "Gender must be MALE or FEMALE"
    }
    
    // Boolean field validation
    if (row.hasSmartphone && !["TRUE", "FALSE"].includes(row.hasSmartphone.toUpperCase())) {
      errors.hasSmartphone = "Must be TRUE or FALSE"
    }
    
    if (row.hasTrainingExperience && !["TRUE", "FALSE"].includes(row.hasTrainingExperience.toUpperCase())) {
      errors.hasTrainingExperience = "Must be TRUE or FALSE"
    }

    // Validate IDs against base data and hierarchical relationships
    if (row.languageId && !languages.find(l => l.id === row.languageId)) {
      errors.languageId = "Invalid language ID"
    }
    
    if (row.academicLevelId && !academicLevels.find(a => a.id === row.academicLevelId)) {
      errors.academicLevelId = "Invalid academic level ID"
    }
    
    // Cascading location validation - exactly like venue form pattern
    const selectedCountry = row.countryId ? countries.find(c => c.id === row.countryId) : null;
    if (row.countryId && !selectedCountry) {
      errors.countryId = "Invalid country ID"
    }
    
    const selectedRegion = row.regionId ? regions.find(r => r.id === row.regionId) : null;
    if (row.regionId && !selectedRegion) {
      errors.regionId = "Invalid region ID"
    } else if (selectedRegion && selectedCountry && selectedRegion.country.id !== selectedCountry.id) {
      errors.regionId = "Region does not belong to the selected country"
    }
    
    const selectedZone = row.zoneId ? zones.find(z => z.id === row.zoneId) : null;
    if (row.zoneId && !selectedZone) {
      errors.zoneId = "Invalid zone ID"
    } else if (selectedZone && selectedRegion && selectedZone.region.id !== selectedRegion.id) {
      errors.zoneId = "Zone does not belong to the selected region"
    }
    
    const selectedCity = row.cityId ? cities.find(c => c.id === row.cityId) : null;
    if (row.cityId && !selectedCity) {
      errors.cityId = "Invalid city ID"
    } else if (selectedCity && selectedZone && selectedCity.zone && selectedCity.zone.id !== selectedZone.id) {
      errors.cityId = "City does not belong to the selected zone"
    }

    // Validate disability IDs
    if (row.disabilityIds) {
      const disabilityIdArray = row.disabilityIds.split(',').map(id => id.trim()).filter(Boolean)
      const invalidDisabilityIds = disabilityIdArray.filter(id => !disabilities.find(d => d.id === id))
      if (invalidDisabilityIds.length > 0) {
        errors.disabilityIds = `Invalid disability IDs: ${invalidDisabilityIds.join(', ')}`
      }
    }

    // Validate marginalized group IDs
    if (row.marginalizedGroupIds) {
      const groupIdArray = row.marginalizedGroupIds.split(',').map(id => id.trim()).filter(Boolean)
      const invalidGroupIds = groupIdArray.filter(id => !marginalizedGroups.find(g => g.id === id))
      if (invalidGroupIds.length > 0) {
        errors.marginalizedGroupIds = `Invalid marginalized group IDs: ${invalidGroupIds.join(', ')}`
      }
    }

    return {
      firstName: row.firstName || "",
      middleName: row.middleName || "",
      lastName: row.lastName || "",
      email: row.email || "",
      contactPhone: row.contactPhone || "",
      dateOfBirth: row.dateOfBirth || "",
      gender: (row.gender === "MALE" || row.gender === "FEMALE") ? row.gender : undefined,
      countryId: row.countryId || "",
      regionId: row.regionId || "",
      zoneId: row.zoneId || "",
      cityId: row.cityId || "",
      woreda: row.woreda || "",
      houseNumber: row.houseNumber || "",
      languageId: row.languageId || "",
      academicLevelId: row.academicLevelId || "",
      fieldOfStudy: row.fieldOfStudy || "",
      hasSmartphone: row.hasSmartphone || "",
      smartphoneOwner: row.smartphoneOwner || "",
      hasTrainingExperience: row.hasTrainingExperience || "",
      trainingExperienceDescription: row.trainingExperienceDescription || "",
      emergencyContactName: row.emergencyContactName || "",
      emergencyContactPhone: row.emergencyContactPhone || "",
      emergencyContactRelationship: row.emergencyContactRelationship || "",
      hasDisability: row.hasDisability || "",
      belongsToMarginalizedGroup: row.belongsToMarginalizedGroup || "",
      disabilityIds: row.disabilityIds || "",
      marginalizedGroupIds: row.marginalizedGroupIds || "",
      rowIndex: index,
      errors: Object.keys(errors).length > 0 ? errors : undefined
    }
  }

  const parseCSV = useCallback((file: File) => {
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const validatedData = results.data.map((row, index) => 
          validateCSVRow(row, index + 1)
        )
        setCsvData(validatedData)
        setFileName(file.name)
      },
      error: (error) => {
        console.log("CSV parsing error:", error)
        toast.error("Error parsing CSV file. Please check the format.")
      }
    })
  }, [languages, academicLevels, zones, cities, countries, regions, disabilities, marginalizedGroups])

  const convertToStudentFormValues = (csvRow: CSVStudentData): StudentFormValues => {
    return {
      firstName: csvRow.firstName,
      middleName: csvRow.middleName,
      lastName: csvRow.lastName,
      email: csvRow.email,
      contactPhone: csvRow.contactPhone,
      dateOfBirth: new Date(csvRow.dateOfBirth),
      gender: (csvRow.gender?.toUpperCase() === "MALE" || csvRow.gender?.toUpperCase() === "FEMALE") ? csvRow.gender?.toUpperCase() as "MALE" | "FEMALE" : undefined,
      countryId: csvRow.countryId,
      regionId: csvRow.regionId,
      zoneId: csvRow.zoneId,
      cityId: csvRow.cityId,
      woreda: csvRow.woreda,
      houseNumber: csvRow.houseNumber,
      languageId: csvRow.languageId,
      academicLevelId: csvRow.academicLevelId,
      fieldOfStudy: csvRow.fieldOfStudy,
      hasSmartphone: csvRow.hasSmartphone?.toUpperCase() === "TRUE",
      smartphoneOwner: csvRow.smartphoneOwner,
      hasTrainingExperience: csvRow.hasTrainingExperience?.toUpperCase() === "TRUE",
      trainingExperienceDescription: csvRow.trainingExperienceDescription,
      emergencyContactName: csvRow.emergencyContactName,
      emergencyContactPhone: csvRow.emergencyContactPhone,
      emergencyContactRelationship: csvRow.emergencyContactRelationship,
      hasDisability: csvRow.disabilityIds ? true : null,
      disabilityIds: csvRow.disabilityIds ? csvRow.disabilityIds.split(',').map(id => id.trim()).filter(Boolean) : [],
      belongsToMarginalizedGroup: csvRow.marginalizedGroupIds ? true : null,
      marginalizedGroupIds: csvRow.marginalizedGroupIds ? csvRow.marginalizedGroupIds.split(',').map(id => id.trim()).filter(Boolean) : [],
    }
  }

  const handleImportStudents = async () => {
    const hasErrors = csvData.some(row => row.errors && Object.keys(row.errors).length > 0)
    if (hasErrors) {
      toast.error("Please fix all validation errors before importing")
      return
    }

    const studentData = csvData.map(convertToStudentFormValues)
    await onImport(studentData)
  }

  const updateCsvData = (updatedData: CSVStudentData[]) => {
    // Re-validate each updated row to clear errors
    const revalidatedData = updatedData.map(row => {
      const mockRowData: Record<string, string> = {
        firstName: row.firstName,
        middleName: row.middleName,
        lastName: row.lastName,
        email: row.email,
        contactPhone: row.contactPhone,
        dateOfBirth: row.dateOfBirth,
        gender: row.gender || "",
        countryId: row.countryId,
        regionId: row.regionId,
        zoneId: row.zoneId,
        cityId: row.cityId,
        woreda: row.woreda,
        houseNumber: row.houseNumber,
        languageId: row.languageId,
        academicLevelId: row.academicLevelId,
        fieldOfStudy: row.fieldOfStudy,
        hasSmartphone: row.hasSmartphone,
        smartphoneOwner: row.smartphoneOwner,
        hasTrainingExperience: row.hasTrainingExperience,
        trainingExperienceDescription: row.trainingExperienceDescription,
        emergencyContactName: row.emergencyContactName,
        emergencyContactPhone: row.emergencyContactPhone,
        emergencyContactRelationship: row.emergencyContactRelationship,
        hasDisability: row.hasDisability || "",
        belongsToMarginalizedGroup: row.belongsToMarginalizedGroup || "",
        disabilityIds: row.disabilityIds,
        marginalizedGroupIds: row.marginalizedGroupIds
      }
      
      const revalidated = validateCSVRow(mockRowData, row.rowIndex)
      return revalidated
    })
    
    setCsvData(revalidatedData)
  }

  return (
    <div className="space-y-6">
      {csvData.length === 0 ? (
        <CSVUploadSection onFileSelect={parseCSV} />
      ) : (
        <>
          <CSVFileInfo 
            fileName={fileName} 
            studentCount={csvData.length}
            onClear={() => setCsvData([])}
          />

          <CSVDataTable
            data={csvData}
            onDataUpdate={updateCsvData}
            languages={languages}
            countries={countries}
            regions={regions}
            zones={zones}
            cities={cities}
            academicLevels={academicLevels}
            disabilities={disabilities}
            marginalizedGroups={marginalizedGroups}
          />

          <CSVErrorSummary data={csvData} />

          <div className="flex justify-end">
            <Button 
              onClick={handleImportStudents}
              disabled={isSubmitting || csvData.some(row => row.errors && Object.keys(row.errors).length > 0)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSubmitting ? "Importing..." : `Import ${csvData.length} Students`}
            </Button>
          </div>
        </>
      )}
    </div>
  )
} 