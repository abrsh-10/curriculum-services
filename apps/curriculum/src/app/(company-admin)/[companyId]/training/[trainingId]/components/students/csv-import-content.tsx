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
import { CreateStudentByNameData } from "@/lib/hooks/useStudents"

interface CSVStudentData {
  firstName: string
  middleName: string
  lastName: string
  email: string
  contactPhone: string
  dateOfBirth: string
  gender?: string
  countryName: string
  regionName: string
  zoneName: string
  cityName: string
  woreda: string
  houseNumber: string
  languageName: string
  academicLevelName: string
  fieldOfStudy: string
  hasSmartphone: string
  hasTrainingExperience: string
  trainingExperienceDescription: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
  disabilityNames: string
  marginalizedGroupNames: string
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
  onImport: (students: CreateStudentByNameData[]) => Promise<void>
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
    if (!row.countryName?.trim()) errors.countryName = "Country is required"
    if (!row.regionName?.trim()) errors.regionName = "Region is required"
    if (!row.zoneName?.trim()) errors.zoneName = "Zone is required"
    if (!row.woreda?.trim()) errors.woreda = "Woreda is required"
    if (!row.houseNumber?.trim()) errors.houseNumber = "House number is required"
    if (!row.languageName?.trim()) errors.languageName = "Language is required"
    if (!row.academicLevelName?.trim()) errors.academicLevelName = "Academic level is required"
    if (!row.fieldOfStudy?.trim()) errors.fieldOfStudy = "Field of study is required"
    if (!row.hasSmartphone?.trim()) errors.hasSmartphone = "Has smartphone is required"
    if (!row.hasTrainingExperience?.trim()) errors.hasTrainingExperience = "Has training experience is required"
    if (!row.emergencyContactName?.trim()) errors.emergencyContactName = "Emergency contact name is required"
    if (!row.emergencyContactPhone?.trim()) errors.emergencyContactPhone = "Emergency contact phone is required"
    if (!row.emergencyContactRelationship?.trim()) errors.emergencyContactRelationship = "Emergency contact relationship is required"
    
    // Email validation
    if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
      errors.email = "Invalid email format"
    }
    
    // Date validation - strict YYYY-MM-DD format
    if (row.dateOfBirth) {
      const datePattern = /^\d{4}-\d{2}-\d{2}$/
      if (!datePattern.test(row.dateOfBirth)) {
        errors.dateOfBirth = "Invalid date format (must be YYYY-MM-DD)"
      } else {
        // Check if it's a valid date
        const date = new Date(row.dateOfBirth)
        const [year, month, day] = row.dateOfBirth.split('-').map(Number)
        if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
          errors.dateOfBirth = "Invalid date (must be a real date in YYYY-MM-DD format)"
        }
      }
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
    if (row.languageName && !languages.find(l => l.name === row.languageName)) {
      errors.languageName = "Invalid language name"
    }
    
    if (row.academicLevelName && !academicLevels.find(a => a.name === row.academicLevelName)) {
      errors.academicLevelName = "Invalid academic level name"
    }
    
    // Cascading location validation - exactly like venue form pattern
    const selectedCountry = row.countryName ? countries.find(c => c.name === row.countryName) : null;
    if (row.countryName && !selectedCountry) {
      errors.countryName = "Invalid country name"
    }
    
    const selectedRegion = row.regionName ? regions.find(r => r.name === row.regionName) : null;
    if (row.regionName && !selectedRegion) {
      errors.regionName = "Invalid region name"
    } else if (selectedRegion && selectedCountry && selectedRegion.country.name !== selectedCountry.name) {
      errors.regionName = "Region does not belong to the selected country"
    }
    
    const selectedZone = row.zoneName ? zones.find(z => z.name === row.zoneName) : null;
    if (row.zoneName && !selectedZone) {
      errors.zoneName = "Invalid zone name"
    } else if (selectedZone && selectedRegion && selectedZone.region.name !== selectedRegion.name) {
      errors.zoneName = "Zone does not belong to the selected region"
    }
    
    if (row.cityName) {
      const selectedCity = cities.find(c => c.name === row.cityName);
      if (!selectedCity) {
        errors.cityName = "Invalid city name"
      } else if (selectedZone && selectedCity.zone && selectedCity.zone.name !== selectedZone.name) {
        errors.cityName = "City does not belong to the selected zone"
      }
    }

    // Validate disability names (only if provided)
    if (row.disabilityNames && row.disabilityNames.trim()) {
      const disabilityNameArray = row.disabilityNames.split(',').map(name => name.trim()).filter(Boolean)
      if (disabilityNameArray.length > 0) {
        const invalidDisabilityNames = disabilityNameArray.filter(name => !disabilities.find(d => d.name === name))
        if (invalidDisabilityNames.length > 0) {
          errors.disabilityNames = `Invalid disability names: ${invalidDisabilityNames.join(', ')}`
        }
      }
    }

    // Validate marginalized group names (only if provided)
    if (row.marginalizedGroupNames && row.marginalizedGroupNames.trim()) {
      const groupNameArray = row.marginalizedGroupNames.split(',').map(name => name.trim()).filter(Boolean)
      if (groupNameArray.length > 0) {
        const invalidGroupNames = groupNameArray.filter(name => !marginalizedGroups.find(g => g.name === name))
        if (invalidGroupNames.length > 0) {
          errors.marginalizedGroupNames = `Invalid marginalized group names: ${invalidGroupNames.join(', ')}`
        }
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
      countryName: row.countryName || "",
      regionName: row.regionName || "",
      zoneName: row.zoneName || "",
      cityName: row.cityName || "",
      woreda: row.woreda || "",
      houseNumber: row.houseNumber || "",
      languageName: row.languageName || "",
      academicLevelName: row.academicLevelName || "",
      fieldOfStudy: row.fieldOfStudy || "",
      hasSmartphone: row.hasSmartphone || "",
      hasTrainingExperience: row.hasTrainingExperience || "",
      trainingExperienceDescription: row.trainingExperienceDescription || "",
      emergencyContactName: row.emergencyContactName || "",
      emergencyContactPhone: row.emergencyContactPhone || "",
      emergencyContactRelationship: row.emergencyContactRelationship || "",
      disabilityNames: row.disabilityNames || "",
      marginalizedGroupNames: row.marginalizedGroupNames || "",
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

  const convertToStudentFormValues = (csvRow: CSVStudentData): CreateStudentByNameData => {
    return {
      firstName: csvRow.firstName,
      middleName: csvRow.middleName && csvRow.middleName.trim() ? csvRow.middleName.trim() : undefined,
      lastName: csvRow.lastName,
      email: csvRow.email,
      contactPhone: csvRow.contactPhone,
      dateOfBirth: csvRow.dateOfBirth,
      gender: (csvRow.gender === "MALE" || csvRow.gender === "FEMALE") ? csvRow.gender : undefined,
      countryName: csvRow.countryName,
      regionName: csvRow.regionName,
      zoneName: csvRow.zoneName,
      cityName: csvRow.cityName && csvRow.cityName.trim() ? csvRow.cityName.trim() : undefined,
      woreda: csvRow.woreda,
      houseNumber: csvRow.houseNumber,
      languageName: csvRow.languageName,
      academicLevelName: csvRow.academicLevelName,
      fieldOfStudy: csvRow.fieldOfStudy,
      hasSmartphone: csvRow.hasSmartphone === "TRUE",
      hasTrainingExperience: csvRow.hasTrainingExperience === "TRUE",
      trainingExperienceDescription: csvRow.trainingExperienceDescription && csvRow.trainingExperienceDescription.trim() ? csvRow.trainingExperienceDescription.trim() : undefined,
      emergencyContactName: csvRow.emergencyContactName,
      emergencyContactPhone: csvRow.emergencyContactPhone,
      emergencyContactRelationship: csvRow.emergencyContactRelationship,
      disabilityNames: csvRow.disabilityNames && csvRow.disabilityNames.trim() ? csvRow.disabilityNames.split(',').map(name => name.trim()).filter(Boolean) : undefined,
      marginalizedGroupNames: csvRow.marginalizedGroupNames && csvRow.marginalizedGroupNames.trim() ? csvRow.marginalizedGroupNames.split(',').map(name => name.trim()).filter(Boolean) : undefined,
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
        countryName: row.countryName,
        regionName: row.regionName,
        zoneName: row.zoneName,
        cityName: row.cityName,
        woreda: row.woreda,
        houseNumber: row.houseNumber,
        languageName: row.languageName,
        academicLevelName: row.academicLevelName,
        fieldOfStudy: row.fieldOfStudy,
        hasSmartphone: row.hasSmartphone,
        hasTrainingExperience: row.hasTrainingExperience,
        trainingExperienceDescription: row.trainingExperienceDescription,
        emergencyContactName: row.emergencyContactName,
        emergencyContactPhone: row.emergencyContactPhone,
        emergencyContactRelationship: row.emergencyContactRelationship,
        disabilityNames: row.disabilityNames,
        marginalizedGroupNames: row.marginalizedGroupNames
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