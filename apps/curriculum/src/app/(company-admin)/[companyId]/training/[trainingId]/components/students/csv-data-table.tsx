"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit2, Check, X, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

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

interface CSVDataTableProps {
  data: CSVStudentData[]
  onDataUpdate: (data: CSVStudentData[]) => void
  languages: Language[]
  countries: Country[]
  regions: Region[]
  zones: Zone[]
  cities: City[]
  academicLevels: AcademicLevel[]
  disabilities: Disability[]
  marginalizedGroups: MarginalizedGroup[]
}

export function CSVDataTable({
  data,
  onDataUpdate,
  languages,
  countries,
  regions,
  zones,
  cities,
  academicLevels,
  disabilities,
  marginalizedGroups
}: CSVDataTableProps) {
  const [editingCell, setEditingCell] = useState<{ row: number; field: string } | null>(null)
  const [editValue, setEditValue] = useState("")

  const handleCellEdit = (rowIndex: number, field: string, currentValue: string) => {
    setEditingCell({ row: rowIndex, field })
    setEditValue(currentValue || "")
  }

  const handleCellSave = () => {
    if (editingCell) {
      const updatedData = data.map(row => {
        if (row.rowIndex === editingCell.row) {
          const updatedRow = { ...row, [editingCell.field]: editValue }
          
          // Clear errors for the updated field
          if (updatedRow.errors) {
            const newErrors = { ...updatedRow.errors }
            delete newErrors[editingCell.field]
            updatedRow.errors = Object.keys(newErrors).length > 0 ? newErrors : undefined
          }
          
          // Handle cascading updates for location fields
          if (editingCell.field === 'countryName') {
            updatedRow.regionName = ""
            updatedRow.zoneName = ""
            updatedRow.cityName = ""
          } else if (editingCell.field === 'regionName') {
            updatedRow.zoneName = ""
            updatedRow.cityName = ""
          } else if (editingCell.field === 'zoneName') {
            updatedRow.cityName = ""
          }
          
          return updatedRow
        }
        return row
      })
      onDataUpdate(updatedData)
      setEditingCell(null)
      setEditValue("")
    }
  }

  const handleCellCancel = () => {
    setEditingCell(null)
    setEditValue("")
  }

  const getFilteredOptions = (field: string, row: CSVStudentData) => {
    switch (field) {
      case 'regionName':
        return regions.filter(r => r.country.name === row.countryName)
      case 'zoneName':
        return zones.filter(z => z.region.name === row.regionName)
      case 'cityName':
        return cities.filter(c => c.zone?.name === row.zoneName)
      default:
        return []
    }
  }

  const getDisplayValue = (field: string, value: string, row: CSVStudentData) => {
    switch (field) {
      case 'languageName':
        const language = languages.find(l => l.name === value)
        return language ? language.name : "Not found"
      case 'academicLevelName':
        const academicLevel = academicLevels.find(a => a.name === value)
        return academicLevel ? academicLevel.name : "Not found"
      case 'countryName':
        const country = countries.find(c => c.name === value)
        return country ? country.name : "Not found"
      case 'regionName':
        const filteredRegions = getFilteredOptions('regionName', row)
        const region = filteredRegions.find(r => r.name === value)
        return region ? region.name : "Not found"
      case 'zoneName':
        const filteredZones = getFilteredOptions('zoneName', row)
        const zone = filteredZones.find(z => z.name === value)
        return zone ? zone.name : "Not found"
      case 'cityName':
        const filteredCities = getFilteredOptions('cityName', row)
        const city = filteredCities.find(c => c.name === value)
        return city ? city.name : "Not found"
      case 'disabilityNames':
        if (!value) return "Not found"
        const disabilityIdArray = value.split(',').map(id => id.trim()).filter(Boolean)
        const disabilityNames = disabilityIdArray.map(id => {
          const disability = disabilities.find(d => d.name === id)
          return disability ? disability.name : id
        })
        return disabilityNames.join(', ') || "Not found"
      case 'marginalizedGroupNames':
        if (!value) return "Not found"
        const groupIdArray = value.split(',').map(id => id.trim()).filter(Boolean)
        const groupNames = groupIdArray.map(id => {
          const group = marginalizedGroups.find(g => g.name === id)
          return group ? group.name : id
        })
        return groupNames.join(', ') || "Not found"
      case 'hasSmartphone':
      case 'hasTrainingExperience':
        return value === 'TRUE' ? 'Yes' : value === 'FALSE' ? 'No' : value
      case 'gender':
        return value === 'MALE' ? 'Male' : value === 'FEMALE' ? 'Female' : value
      default:
        return value || "-"
    }
  }

  const renderSelectField = (field: string, value: string, row: CSVStudentData) => {
    let options: { id: string; name: string }[] = []
    let placeholder = "Select..."
    let isMultiple = false
    let emptyMessage = ""
    
    switch (field) {
      case 'languageName':
        options = languages
        placeholder = "Select language"
        emptyMessage = "No languages available"
        break
      case 'academicLevelName':
        options = academicLevels
        placeholder = "Select academic level"
        emptyMessage = "No academic levels available"
        break
      case 'countryName':
        options = countries
        placeholder = "Select country"
        emptyMessage = "No countries available"
        break
      case 'regionName':
        options = getFilteredOptions('regionName', row)
        placeholder = row.countryName ? "Select region" : "Select country first"
        emptyMessage = row.countryName ? "No regions available for selected country" : "Select country first"
        break
      case 'zoneName':
        options = getFilteredOptions('zoneName', row)
        placeholder = row.regionName ? "Select zone" : "Select region first"
        emptyMessage = row.regionName ? "No zones available for selected region" : "Select region first"
        break
      case 'cityName':
        options = getFilteredOptions('cityName', row)
        placeholder = row.zoneName ? "Select city" : "Select zone first"
        emptyMessage = row.zoneName ? "No cities available for selected zone" : "Select zone first"
        break
      case 'gender':
        options = [
          { id: 'MALE', name: 'Male' },
          { id: 'FEMALE', name: 'Female' }
        ]
        placeholder = "Select gender"
        break
      case 'hasSmartphone':
        options = [
          { id: 'TRUE', name: 'Yes' },
          { id: 'FALSE', name: 'No' }
        ]
        placeholder = "Has smartphone?"
        break
      case 'hasTrainingExperience':
        options = [
          { id: 'TRUE', name: 'Yes' },
          { id: 'FALSE', name: 'No' }
        ]
        placeholder = "Has training experience?"
        break

      case 'disabilityNames':
        options = disabilities
        placeholder = "Select disabilities"
        emptyMessage = "No disabilities available"
        isMultiple = true
        break
      case 'marginalizedGroupNames':
        options = marginalizedGroups
        placeholder = "Select marginalized groups"
        emptyMessage = "No marginalized groups available"
        isMultiple = true
        break
      default:
        // For text fields (including emergency contact fields)
        return (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="h-8 text-xs"
            autoFocus
            placeholder="Enter value"
          />
        )
    }

    if (isMultiple) {
      // For multi-select fields, show a simplified interface
      const currentNames = editValue ? editValue.split(',').map(name => name.trim()).filter(Boolean) : []
      
      return (
        <div className="space-y-2">
          <Select 
            value="" 
            onValueChange={(selectedName) => {
              if (!currentNames.includes(selectedName)) {
                const newValue = currentNames.length > 0 ? `${editValue},${selectedName}` : selectedName
                setEditValue(newValue)
              }
            }}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder={options.length > 0 ? placeholder : emptyMessage} />
            </SelectTrigger>
            <SelectContent>
              {options.length > 0 ? (
                options.map((option) => (
                  <SelectItem key={option.id} value={option.name}>
                    {option.name}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-1 text-xs text-gray-500">{emptyMessage}</div>
              )}
            </SelectContent>
          </Select>
          {currentNames.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {currentNames.map((name, index) => {
                const option = options.find(o => o.name === name)
                return (
                  <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {option?.name || name}
                    <button
                      onClick={() => {
                        const newNames = currentNames.filter(cName => cName !== name)
                        setEditValue(newNames.join(','))
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    return (
      <Select value={editValue} onValueChange={setEditValue}>
        <SelectTrigger className="h-8 text-xs">
          <SelectValue placeholder={options.length > 0 ? placeholder : emptyMessage} />
        </SelectTrigger>
        <SelectContent>
          {options.length > 0 ? (
            options.map((option) => (
              <SelectItem 
                key={option.id} 
                value={['gender', 'hasSmartphone', 'hasTrainingExperience'].includes(field) ? option.id : option.name}
              >
                {option.name}
              </SelectItem>
            ))
          ) : (
            <div className="px-2 py-1 text-xs text-gray-500">{emptyMessage}</div>
          )}
        </SelectContent>
      </Select>
    )
  }

  const renderCell = (row: CSVStudentData, field: string, value: string) => {
    const isEditing = editingCell?.row === row.rowIndex && editingCell?.field === field
    const hasError = row.errors?.[field]
    const displayValue = getDisplayValue(field, value, row)
    const isSelectField = ['languageName', 'academicLevelName', 'zoneName', 'cityName', 'countryName', 'regionName', 'gender', 'hasSmartphone', 'hasTrainingExperience', 'disabilityNames', 'marginalizedGroupNames'].includes(field)

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          {renderSelectField(field, value, row)}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleCellSave}
            className="h-8 w-8 p-0 bg-green-100 hover:bg-green-200 ml-2"
          >
            <Check className="h-3 w-3 text-green-600" />
          </Button>
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={handleCellCancel}
            className="h-8 w-8 p-0 bg-red-100 hover:bg-red-200"
          >
            <X className="h-3 w-3 text-red-600" />
          </Button>
        </div>
      )
    }

    return (
      <div 
        className={cn(
          "flex items-center justify-between group cursor-pointer p-2 rounded min-h-[36px] hover:bg-gray-50 transition-colors",
          hasError && "bg-red-50 border border-red-200"
        )}
        onClick={() => handleCellEdit(row.rowIndex, field, value)}
      >
        <span className={cn(
          "text-xs truncate flex-1",
          hasError && "text-red-600",
          isSelectField && displayValue === "Not found" && "text-red-500 font-medium"
        )}>
          {displayValue}
        </span>
        <div className="flex items-center gap-1">
          {hasError && <AlertCircle className="h-3 w-3 text-red-500" />}
          <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden shadow-sm">
      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-xs">
          <thead className="bg-gray-50 sticky top-0 border-b">
            <tr>
              <th className="p-3 text-left font-medium text-gray-700">Row</th>
              <th className="p-3 text-left font-medium text-gray-700">First Name</th>
              <th className="p-3 text-left font-medium text-gray-700">Middle Name</th>
              <th className="p-3 text-left font-medium text-gray-700">Last Name</th>
              <th className="p-3 text-left font-medium text-gray-700">Email</th>
              <th className="p-3 text-left font-medium text-gray-700">Phone</th>
              <th className="p-3 text-left font-medium text-gray-700">Date of Birth</th>
              <th className="p-3 text-left font-medium text-gray-700">Gender</th>
              <th className="p-3 text-left font-medium text-gray-700">Country</th>
              <th className="p-3 text-left font-medium text-gray-700">Region</th>
              <th className="p-3 text-left font-medium text-gray-700">Zone</th>
              <th className="p-3 text-left font-medium text-gray-700">City</th>
              <th className="p-3 text-left font-medium text-gray-700">Woreda</th>
              <th className="p-3 text-left font-medium text-gray-700">House Number</th>
              <th className="p-3 text-left font-medium text-gray-700">Language</th>
              <th className="p-3 text-left font-medium text-gray-700">Academic Level</th>
              <th className="p-3 text-left font-medium text-gray-700">Field of Study</th>
              <th className="p-3 text-left font-medium text-gray-700">Has Smartphone</th>
              <th className="p-3 text-left font-medium text-gray-700">Training Experience</th>
              <th className="p-3 text-left font-medium text-gray-700">Training Experience Description</th>
              <th className="p-3 text-left font-medium text-gray-700">Emergency Contact</th>
              <th className="p-3 text-left font-medium text-gray-700">Emergency Contact Phone</th>
              <th className="p-3 text-left font-medium text-gray-700">Emergency Contact Relationship</th>
              <th className="p-3 text-left font-medium text-gray-700">Disabilities</th>
              <th className="p-3 text-left font-medium text-gray-700">Marginalized Groups</th>
              <th className="p-3 text-left font-medium text-gray-700">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.rowIndex} className="border-t hover:bg-gray-50/50 transition-colors">
                <td className="p-3 font-medium text-gray-600">{row.rowIndex}</td>
                <td className="p-3">{renderCell(row, 'firstName', row.firstName)}</td>
                <td className="p-3">{renderCell(row, 'middleName', row.middleName)}</td>
                <td className="p-3">{renderCell(row, 'lastName', row.lastName)}</td>
                <td className="p-3">{renderCell(row, 'email', row.email)}</td>
                <td className="p-3">{renderCell(row, 'contactPhone', row.contactPhone)}</td>
                <td className="p-3">{renderCell(row, 'dateOfBirth', row.dateOfBirth)}</td>
                <td className="p-3">{renderCell(row, 'gender', row.gender || "")}</td>
                <td className="p-3">{renderCell(row, 'countryName', row.countryName)}</td>
                <td className="p-3">{renderCell(row, 'regionName', row.regionName)}</td>
                <td className="p-3">{renderCell(row, 'zoneName', row.zoneName)}</td>
                <td className="p-3">{renderCell(row, 'cityName', row.cityName)}</td>
                <td className="p-3">{renderCell(row, 'woreda', row.woreda)}</td>
                <td className="p-3">{renderCell(row, 'houseNumber', row.houseNumber)}</td>
                <td className="p-3">{renderCell(row, 'languageName', row.languageName)}</td>
                <td className="p-3">{renderCell(row, 'academicLevelName', row.academicLevelName)}</td>
                <td className="p-3">{renderCell(row, 'fieldOfStudy', row.fieldOfStudy)}</td>
                <td className="p-3">{renderCell(row, 'hasSmartphone', row.hasSmartphone)}</td>
                <td className="p-3">{renderCell(row, 'hasTrainingExperience', row.hasTrainingExperience)}</td>
                <td className="p-3">{renderCell(row, 'trainingExperienceDescription', row.trainingExperienceDescription)}</td>
                <td className="p-3">{renderCell(row, 'emergencyContactName', row.emergencyContactName)}</td>
                <td className="p-3">{renderCell(row, 'emergencyContactPhone', row.emergencyContactPhone)}</td>
                <td className="p-3">{renderCell(row, 'emergencyContactRelationship', row.emergencyContactRelationship)}</td>
                <td className="p-3">{renderCell(row, 'disabilityNames', row.disabilityNames)}</td>
                <td className="p-3">{renderCell(row, 'marginalizedGroupNames', row.marginalizedGroupNames)}</td>
                <td className="p-3">
                  {row.errors && Object.keys(row.errors).length > 0 ? (
                    <span className="text-red-600 text-xs font-medium">
                      Errors
                    </span>
                  ) : (
                    <span className="text-green-600 text-xs font-medium">
                      Valid
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 