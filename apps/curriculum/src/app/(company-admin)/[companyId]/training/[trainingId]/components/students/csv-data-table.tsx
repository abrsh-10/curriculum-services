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
          if (editingCell.field === 'countryId') {
            updatedRow.regionId = ""
            updatedRow.zoneId = ""
            updatedRow.cityId = ""
          } else if (editingCell.field === 'regionId') {
            updatedRow.zoneId = ""
            updatedRow.cityId = ""
          } else if (editingCell.field === 'zoneId') {
            updatedRow.cityId = ""
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
      case 'regionId':
        return regions.filter(r => r.country.id === row.countryId)
      case 'zoneId':
        return zones.filter(z => z.region.id === row.regionId)
      case 'cityId':
        return cities.filter(c => c.zone?.id === row.zoneId)
      default:
        return []
    }
  }

  const getDisplayValue = (field: string, value: string, row: CSVStudentData) => {
    switch (field) {
      case 'languageId':
        const language = languages.find(l => l.id === value)
        return language ? language.name : "Not found"
      case 'academicLevelId':
        const academicLevel = academicLevels.find(a => a.id === value)
        return academicLevel ? academicLevel.name : "Not found"
      case 'countryId':
        const country = countries.find(c => c.id === value)
        return country ? country.name : "Not found"
      case 'regionId':
        const filteredRegions = getFilteredOptions('regionId', row)
        const region = filteredRegions.find(r => r.id === value)
        return region ? region.name : "Not found"
      case 'zoneId':
        const filteredZones = getFilteredOptions('zoneId', row)
        const zone = filteredZones.find(z => z.id === value)
        return zone ? zone.name : "Not found"
      case 'cityId':
        const filteredCities = getFilteredOptions('cityId', row)
        const city = filteredCities.find(c => c.id === value)
        return city ? city.name : "Not found"
      case 'disabilityIds':
        if (!value) return "Not found"
        const disabilityIdArray = value.split(',').map(id => id.trim()).filter(Boolean)
        const disabilityNames = disabilityIdArray.map(id => {
          const disability = disabilities.find(d => d.id === id)
          return disability ? disability.name : id
        })
        return disabilityNames.join(', ') || "Not found"
      case 'marginalizedGroupIds':
        if (!value) return "Not found"
        const groupIdArray = value.split(',').map(id => id.trim()).filter(Boolean)
        const groupNames = groupIdArray.map(id => {
          const group = marginalizedGroups.find(g => g.id === id)
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
      case 'languageId':
        options = languages
        placeholder = "Select language"
        emptyMessage = "No languages available"
        break
      case 'academicLevelId':
        options = academicLevels
        placeholder = "Select academic level"
        emptyMessage = "No academic levels available"
        break
      case 'countryId':
        options = countries
        placeholder = "Select country"
        emptyMessage = "No countries available"
        break
      case 'regionId':
        options = getFilteredOptions('regionId', row)
        placeholder = row.countryId ? "Select region" : "Select country first"
        emptyMessage = row.countryId ? "No regions available for selected country" : "Select country first"
        break
      case 'zoneId':
        options = getFilteredOptions('zoneId', row)
        placeholder = row.regionId ? "Select zone" : "Select region first"
        emptyMessage = row.regionId ? "No zones available for selected region" : "Select region first"
        break
      case 'cityId':
        options = getFilteredOptions('cityId', row)
        placeholder = row.zoneId ? "Select city" : "Select zone first"
        emptyMessage = row.zoneId ? "No cities available for selected zone" : "Select zone first"
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
      case 'disabilityIds':
        options = disabilities
        placeholder = "Select disabilities"
        emptyMessage = "No disabilities available"
        isMultiple = true
        break
      case 'marginalizedGroupIds':
        options = marginalizedGroups
        placeholder = "Select marginalized groups"
        emptyMessage = "No marginalized groups available"
        isMultiple = true
        break
      default:
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
      const currentIds = editValue ? editValue.split(',').map(id => id.trim()).filter(Boolean) : []
      
      return (
        <div className="space-y-2">
          <Select 
            value="" 
            onValueChange={(selectedId) => {
              if (!currentIds.includes(selectedId)) {
                const newValue = currentIds.length > 0 ? `${editValue},${selectedId}` : selectedId
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
                  <SelectItem key={option.id} value={option.id}>
                    {option.name}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-1 text-xs text-gray-500">{emptyMessage}</div>
              )}
            </SelectContent>
          </Select>
          {currentIds.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {currentIds.map((id, index) => {
                const option = options.find(o => o.id === id)
                return (
                  <span key={index} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    {option?.name || id}
                    <button
                      onClick={() => {
                        const newIds = currentIds.filter(cId => cId !== id)
                        setEditValue(newIds.join(','))
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
              <SelectItem key={option.id} value={option.id}>
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
    const isSelectField = ['languageId', 'academicLevelId', 'zoneId', 'cityId', 'countryId', 'regionId', 'gender', 'hasSmartphone', 'hasTrainingExperience', 'disabilityIds', 'marginalizedGroupIds'].includes(field)

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
              <th className="p-3 text-left font-medium text-gray-700">Last Name</th>
              <th className="p-3 text-left font-medium text-gray-700">Email</th>
              <th className="p-3 text-left font-medium text-gray-700">Phone</th>
              <th className="p-3 text-left font-medium text-gray-700">Date of Birth</th>
              <th className="p-3 text-left font-medium text-gray-700">Field of Study</th>
              <th className="p-3 text-left font-medium text-gray-700">Has Smartphone</th>
              <th className="p-3 text-left font-medium text-gray-700">Training Experience</th>
              <th className="p-3 text-left font-medium text-gray-700">Emergency Contact</th>
              <th className="p-3 text-left font-medium text-gray-700">Emergency Contact Phone</th>
              <th className="p-3 text-left font-medium text-gray-700">Emergency Contact Relationship</th>
              <th className="p-3 text-left font-medium text-gray-700">Gender</th>
              <th className="p-3 text-left font-medium text-gray-700">Country</th>
              <th className="p-3 text-left font-medium text-gray-700">Region</th>
              <th className="p-3 text-left font-medium text-gray-700">Zone</th>
              <th className="p-3 text-left font-medium text-gray-700">City</th>
              <th className="p-3 text-left font-medium text-gray-700">Language</th>
              <th className="p-3 text-left font-medium text-gray-700">Academic Level</th>
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
                <td className="p-3">{renderCell(row, 'lastName', row.lastName)}</td>
                <td className="p-3">{renderCell(row, 'email', row.email)}</td>
                <td className="p-3">{renderCell(row, 'contactPhone', row.contactPhone)}</td>
                <td className="p-3">{renderCell(row, 'dateOfBirth', row.dateOfBirth)}</td>
                <td className="p-3">{renderCell(row, 'gender', row.gender || "")}</td>
                <td className="p-3">{renderCell(row, 'fieldOfStudy', row.fieldOfStudy)}</td>
                <td className="p-3">{renderCell(row, 'hasSmartphone', row.hasSmartphone)}</td>
                <td className="p-3">{renderCell(row, 'hasTrainingExperience', row.hasTrainingExperience)}</td>
                <td className="p-3">{renderCell(row, 'emergencyContactName', row.emergencyContactName)}</td>
                <td className="p-3">{renderCell(row, 'emergencyContactPhone', row.emergencyContactPhone)}</td>
                <td className="p-3">{renderCell(row, 'emergencyContactRelationship', row.emergencyContactRelationship)}</td>
                <td className="p-3">{renderCell(row, 'countryId', row.countryId)}</td>
                <td className="p-3">{renderCell(row, 'regionId', row.regionId)}</td>
                <td className="p-3">{renderCell(row, 'zoneId', row.zoneId)}</td>
                <td className="p-3">{renderCell(row, 'cityId', row.cityId)}</td>
                <td className="p-3">{renderCell(row, 'languageId', row.languageId)}</td>
                <td className="p-3">{renderCell(row, 'academicLevelId', row.academicLevelId)}</td>
                <td className="p-3">{renderCell(row, 'disabilityIds', row.disabilityIds)}</td>
                <td className="p-3">{renderCell(row, 'marginalizedGroupIds', row.marginalizedGroupIds)}</td>
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