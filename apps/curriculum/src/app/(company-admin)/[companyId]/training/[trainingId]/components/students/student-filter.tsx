/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import React, { useState, useMemo } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { MultiSelectCombobox } from "@/components/ui/multi-select-combobox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { useDebounce } from "@/lib/hooks/useDebounce"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { StudentFilters } from "@/lib/hooks/useStudents"
import { useCohorts } from "@/lib/hooks/useCohorts"
import { getAllLeafCohorts, getCohortHierarchyName } from "@/lib/utils/cohort-utils"
import { useSingleCascadingLocation } from "@/lib/hooks/useCascadingLocation"

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

// Reusable numeric range field (hoisted to avoid remounts on re-render)
function RangeField({
  label,
  aboveLabel = "Above",
  belowLabel = "Below",
  aboveValue,
  belowValue,
  setAbove,
  setBelow,
  min = 0,
  max = 100,
  placeholderAbove,
  placeholderBelow
}: {
  label: string
  aboveLabel?: string
  belowLabel?: string
  aboveValue?: number
  belowValue?: number
  setAbove: (value: number | undefined) => void
  setBelow: (value: number | undefined) => void
  min?: number
  max?: number
  placeholderAbove?: string
  placeholderBelow?: string
}) {
  return (
    <div className="space-y-3">
      <h4 className="text-base font-semibold">{label}</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium">{aboveLabel}</Label>
          <Input
            type="number"
            placeholder={placeholderAbove}
            value={aboveValue ?? ''}
            onChange={(e) => setAbove(e.target.value ? Number(e.target.value) : undefined)}
            className="h-10"
            min={min}
            max={max}
          />
        </div>
        <div className="space-y-2">
          <Label className="text-sm font-medium">{belowLabel}</Label>
          <Input
            type="number"
            placeholder={placeholderBelow}
            value={belowValue ?? ''}
            onChange={(e) => setBelow(e.target.value ? Number(e.target.value) : undefined)}
            className="h-10"
            min={min}
            max={max}
          />
        </div>
      </div>
    </div>
  )
}

interface StudentFilterProps {
  trainingId: string
  countries?: Country[]
  regions?: Region[]
  zones?: Zone[]
  languages?: Language[]
  academicLevels?: AcademicLevel[]
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onApply: (filters: StudentFilters) => void
  defaultSelected?: StudentFilters
}

const genderOptions = [
  { id: "MALE", label: "Male" },
  { id: "FEMALE", label: "Female" }
]


export function StudentFilter({
  trainingId,
  countries = [],
  regions = [],
  zones = [],
  languages = [],
  academicLevels = [],
  onApply,
  defaultSelected = {},
}: StudentFilterProps) {
  const [open, setOpen] = useState(false)

  
  // Fetch cohorts for this training
  const { data: cohortsData } = useCohorts({
    trainingId,
    pageSize: 100 // Get all cohorts
  })
  
  // Get leaf cohorts for selection
  const leafCohorts = cohortsData?.cohorts ? getAllLeafCohorts(cohortsData.cohorts) : []
  
  // Filter states
  const [selectedGenders, setSelectedGenders] = useState<string[]>(defaultSelected.genders || [])
  const [selectedLanguageIds, setSelectedLanguageIds] = useState<string[]>(defaultSelected.languageIds || [])
  const [selectedAcademicLevelIds, setSelectedAcademicLevelIds] = useState<string[]>(defaultSelected.academicLevelIds || [])
  const [selectedZoneIds, setSelectedZoneIds] = useState<string[]>(defaultSelected.zoneIds || [])
  
  // Age filter states
  const [ageAbove, setAgeAbove] = useState<number | undefined>(defaultSelected.ageAbove)
  const [ageBelow, setAgeBelow] = useState<number | undefined>(defaultSelected.ageBelow)
  
  // Consent form filter state
  const [hasConsentForm, setHasConsentForm] = useState<boolean | undefined>(defaultSelected.hasConsentForm)
  
  // Cohort filter states
  const [selectedCohortIds, setSelectedCohortIds] = useState<string[]>(defaultSelected.cohortIds || [])
  
  // Attendance filter states
  const [attendancePercentageAbove, setAttendancePercentageAbove] = useState<number | undefined>(defaultSelected.attendancePercentageAbove)
  const [attendancePercentageBelow, setAttendancePercentageBelow] = useState<number | undefined>(defaultSelected.attendancePercentageBelow)
  
  // Survey filter states
  const [hasFilledBaselineSurvey, setHasFilledBaselineSurvey] = useState<boolean | undefined>(defaultSelected.hasFilledBaselineSurvey)
  const [hasFilledEndlineSurvey, setHasFilledEndlineSurvey] = useState<boolean | undefined>(defaultSelected.hasFilledEndlineSurvey)
  
  // Assessment filter states
  const [hasPreAssessmentAttempt, setHasPreAssessmentAttempt] = useState<boolean | undefined>(defaultSelected.hasPreAssessmentAttempt)
  const [hasPostAssessmentAttempt, setHasPostAssessmentAttempt] = useState<boolean | undefined>(defaultSelected.hasPostAssessmentAttempt)
  const [preAssessmentScoreAbove, setPreAssessmentScoreAbove] = useState<number | undefined>(defaultSelected.preAssessmentScoreAbove)
  const [preAssessmentScoreBelow, setPreAssessmentScoreBelow] = useState<number | undefined>(defaultSelected.preAssessmentScoreBelow)
  const [postAssessmentScoreAbove, setPostAssessmentScoreAbove] = useState<number | undefined>(defaultSelected.postAssessmentScoreAbove)
  const [postAssessmentScoreBelow, setPostAssessmentScoreBelow] = useState<number | undefined>(defaultSelected.postAssessmentScoreBelow)
 
  // Location cascading states
  const [selectedCountryId, setSelectedCountryId] = useState("")
  const [selectedRegionId, setSelectedRegionId] = useState("")

  // Cascading location data based on current selections
  const {
    countries: cascadedCountries,
    regions: cascadedRegions,
    zones: cascadedZones
  } = useSingleCascadingLocation(selectedCountryId || undefined, selectedRegionId || undefined)

  // Prefer cascaded data when available, fallback to props
  const effectiveCountries = cascadedCountries.length > 0 ? cascadedCountries : countries
  const effectiveRegions = cascadedRegions.length > 0 ? cascadedRegions : regions
  const effectiveZones = cascadedZones.length > 0 ? cascadedZones : zones

  // Popover states for location selects
  const [openCountries, setOpenCountries] = useState(false)
  const [openRegions, setOpenRegions] = useState(false)
  
  // Search states for location selects
  const [countrySearch, setCountrySearch] = useState('')
  const [regionSearch, setRegionSearch] = useState('')
  
  // Debounced search values
  const debouncedCountrySearch = useDebounce(countrySearch, 300)
  const debouncedRegionSearch = useDebounce(regionSearch, 300)

  // Filter data based on selections (client-side filtering for hierarchical relationships)
  const availableCountries = useMemo(() => {
    if (!effectiveRegions || effectiveRegions.length === 0) return effectiveCountries || []
    const countryMap = new Map<string, Country>()
    effectiveRegions.forEach((r) => {
      if (r?.country) countryMap.set(r.country.id, r.country)
    })
    // Intersect with provided countries when available to keep consistent references
    const regionCountries = Array.from(countryMap.values())
    if (!effectiveCountries || effectiveCountries.length === 0) return regionCountries
    const countriesById = new Map(effectiveCountries.map((c: Country) => [c.id, c]))
    return regionCountries.map(rc => countriesById.get(rc.id) || rc)
  }, [effectiveCountries, effectiveRegions])
  const availableRegions = useMemo(() => {
    if (!selectedCountryId || !effectiveRegions) return []
    return effectiveRegions.filter((region: Region) => 
      region.country.id === selectedCountryId
    )
  }, [effectiveRegions, selectedCountryId])

  const availableZones = useMemo(() => {
    if (!selectedRegionId || !effectiveZones) return []
    return effectiveZones.filter((zone: Zone) => 
      zone.region.id === selectedRegionId
    )
  }, [effectiveZones, selectedRegionId])

  // Filter data based on search
  const filteredCountries = useMemo(() => {
    return availableCountries.filter((country: Country) =>
      country.name.toLowerCase().includes(debouncedCountrySearch.toLowerCase())
    )
  }, [availableCountries, debouncedCountrySearch])
  
  const filteredRegions = useMemo(() => {
    return availableRegions.filter((region) =>
      region.name.toLowerCase().includes(debouncedRegionSearch.toLowerCase())
    )
  }, [availableRegions, debouncedRegionSearch])

  // Handle cascading selection changes
  const handleCountryChange = (countryId: string) => {
    setSelectedCountryId(countryId)
    // Clear dependent selections
    setSelectedRegionId("")
    setSelectedZoneIds([])
    setOpenCountries(false)
  }

  const handleRegionChange = (regionId: string) => {
    setSelectedRegionId(regionId)
    // Clear dependent selections
    setSelectedZoneIds([])
    setOpenRegions(false)
  }

  // Clear search when popovers close
  const handleCountriesOpenChange = (open: boolean) => {
    setOpenCountries(open)
    if (!open) setCountrySearch('')
  }

  const handleRegionsOpenChange = (open: boolean) => {
    setOpenRegions(open)
    if (!open) setRegionSearch('')
  }

  // Get display names for selected items
  const getSelectedCountryName = () => {
    if (!selectedCountryId || !effectiveCountries) return ""
    const country = effectiveCountries.find((c: Country) => c.id === selectedCountryId)
    return country?.name || ""
  }

  const getSelectedRegionName = () => {
    if (!selectedRegionId || !availableRegions) return ""
    const region = availableRegions.find(r => r.id === selectedRegionId)
    return region?.name || ""
  }

  // Check if any filters are currently applied
  const hasActiveFilters = () => {
    return (
      selectedGenders.length > 0 ||
      selectedLanguageIds.length > 0 ||
      selectedAcademicLevelIds.length > 0 ||
      selectedZoneIds.length > 0 ||
      ageAbove !== undefined ||
      ageBelow !== undefined ||
      hasConsentForm !== undefined ||
      selectedCohortIds.length > 0 ||
      attendancePercentageAbove !== undefined ||
      attendancePercentageBelow !== undefined ||
      hasFilledBaselineSurvey !== undefined ||
      hasFilledEndlineSurvey !== undefined ||
      hasPreAssessmentAttempt !== undefined ||
      hasPostAssessmentAttempt !== undefined ||
      preAssessmentScoreAbove !== undefined ||
      preAssessmentScoreBelow !== undefined ||
      postAssessmentScoreAbove !== undefined ||
      postAssessmentScoreBelow !== undefined
    )
  }

  // Count active filters for display
  const getActiveFilterCount = () => {
    let count = 0
    if (selectedGenders.length > 0) count++
    if (selectedLanguageIds.length > 0) count++
    if (selectedAcademicLevelIds.length > 0) count++
    if (selectedZoneIds.length > 0) count++
    if (ageAbove !== undefined) count++
    if (ageBelow !== undefined) count++
    if (hasConsentForm !== undefined) count++
    if (selectedCohortIds.length > 0) count++
    if (attendancePercentageAbove !== undefined) count++
    if (attendancePercentageBelow !== undefined) count++
    if (hasFilledBaselineSurvey !== undefined) count++
    if (hasFilledEndlineSurvey !== undefined) count++
    if (hasPreAssessmentAttempt !== undefined) count++
    if (hasPostAssessmentAttempt !== undefined) count++
    if (preAssessmentScoreAbove !== undefined) count++
    if (preAssessmentScoreBelow !== undefined) count++
    if (postAssessmentScoreAbove !== undefined) count++
    if (postAssessmentScoreBelow !== undefined) count++
    return count
  }

 

  const handleApply = () => {
    const filters: StudentFilters = {}
    
    if (selectedGenders.length > 0) filters.genders = selectedGenders
    if (selectedLanguageIds.length > 0) filters.languageIds = selectedLanguageIds
    if (selectedAcademicLevelIds.length > 0) filters.academicLevelIds = selectedAcademicLevelIds
    if (selectedZoneIds.length > 0) filters.zoneIds = selectedZoneIds
    
    // Age filters
    if (ageAbove !== undefined) filters.ageAbove = ageAbove
    if (ageBelow !== undefined) filters.ageBelow = ageBelow
    
    // Consent form filter
    if (hasConsentForm !== undefined) filters.hasConsentForm = hasConsentForm
    
    // Cohort filters
    if (selectedCohortIds.length > 0) filters.cohortIds = selectedCohortIds
    
    // Attendance filters
    if (attendancePercentageAbove !== undefined) filters.attendancePercentageAbove = attendancePercentageAbove
    if (attendancePercentageBelow !== undefined) filters.attendancePercentageBelow = attendancePercentageBelow
    
    // Survey filters
    if (hasFilledBaselineSurvey !== undefined) filters.hasFilledBaselineSurvey = hasFilledBaselineSurvey
    if (hasFilledEndlineSurvey !== undefined) filters.hasFilledEndlineSurvey = hasFilledEndlineSurvey
    
    // Assessment filters
    if (hasPreAssessmentAttempt !== undefined) filters.hasPreAssessmentAttempt = hasPreAssessmentAttempt
    if (hasPostAssessmentAttempt !== undefined) filters.hasPostAssessmentAttempt = hasPostAssessmentAttempt
    if (preAssessmentScoreAbove !== undefined) filters.preAssessmentScoreAbove = preAssessmentScoreAbove
    if (preAssessmentScoreBelow !== undefined) filters.preAssessmentScoreBelow = preAssessmentScoreBelow
    if (postAssessmentScoreAbove !== undefined) filters.postAssessmentScoreAbove = postAssessmentScoreAbove
    if (postAssessmentScoreBelow !== undefined) filters.postAssessmentScoreBelow = postAssessmentScoreBelow
    
  
    onApply(filters)
    setOpen(false)
  }

  const handleGenderToggle = (checked: boolean, gender: string) => {
    setSelectedGenders(prev =>
      checked ? [...prev, gender] : prev.filter(item => item !== gender)
    )
  }


  const clearAllFilters = () => {
    setSelectedGenders([])
    setSelectedLanguageIds([])
    setSelectedAcademicLevelIds([])
    setSelectedZoneIds([])
    setSelectedCountryId("")
    setSelectedRegionId("")
    
    // Clear age filters
    setAgeAbove(undefined)
    setAgeBelow(undefined)
    
    // Clear consent form filter
    setHasConsentForm(undefined)
    
    // Clear cohort filters
    setSelectedCohortIds([])
    
    // Clear attendance filters
    setAttendancePercentageAbove(undefined)
    setAttendancePercentageBelow(undefined)
    
    // Clear survey filters
    setHasFilledBaselineSurvey(undefined)
    setHasFilledEndlineSurvey(undefined)
    
    // Clear assessment filters
    setHasPreAssessmentAttempt(undefined)
    setHasPostAssessmentAttempt(undefined)
    setPreAssessmentScoreAbove(undefined)
    setPreAssessmentScoreBelow(undefined)
    setPostAssessmentScoreAbove(undefined)
    setPostAssessmentScoreBelow(undefined)
    
    onApply({})
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="default"
          className={cn(
            "h-10 px-4 border-gray-200 rounded-lg font-normal text-sm transition-colors",
            hasActiveFilters() && "border-blue-500 bg-blue-50 text-blue-700"
          )}
        >
          <Image
            src="/filter.svg"
            alt="Filter"
            width={19}
            height={19}
            className="h-4 w-4 mr-2"
          />
          Filter
          {hasActiveFilters() && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-blue-700 bg-blue-200 rounded-full">
              {getActiveFilterCount()}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[500px] p-0 max-h-[55vh] flex flex-col overflow-y-auto" 
        align="end" 
        alignOffset={-40}
        sideOffset={8}
      >
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Filter Students</h3>
          
          {/* Gender Filter */}
          <div className="space-y-3">
            <h4 className="text-base font-semibold">Gender</h4>
            <div className="grid grid-cols-2 gap-4">
              {genderOptions.map((gender) => (
                <div key={gender.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={gender.id}
                    checked={selectedGenders.includes(gender.id)}
                    onCheckedChange={(checked) => 
                      handleGenderToggle(checked as boolean, gender.id)
                    }
                    className="h-5 w-5 rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                  />
                  <Label 
                    htmlFor={gender.id}
                    className="text-base font-normal"
                  >
                    {gender.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Location Filter */}
          <div className="space-y-3">
            <h4 className="text-base font-semibold">Location</h4>
            
            {/* Country Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Country</Label>
              <Popover open={openCountries} onOpenChange={handleCountriesOpenChange}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-10"
                    type="button"
                  >
                    <span className="truncate">
                      {getSelectedCountryName() || "Select a country"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search countries..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {filteredCountries.length > 0 ? (
                      filteredCountries.map((country: Country) => (
                        <div
                          key={country.id}
                          className={cn(
                            "flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors",
                            selectedCountryId === country.id && "bg-gray-100"
                          )}
                          onClick={() => handleCountryChange(country.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedCountryId === country.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {country.name}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        No countries found
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Region Selection */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Region</Label>
              <Popover open={openRegions} onOpenChange={handleRegionsOpenChange}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-between h-10"
                    disabled={!selectedCountryId}
                    type="button"
                  >
                    <span className="truncate">
                      {getSelectedRegionName() || (!selectedCountryId ? "Select country first" : "Select a region")}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                  <div className="p-3 border-b">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search regions..."
                        value={regionSearch}
                        onChange={(e) => setRegionSearch(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    {filteredRegions.length > 0 ? (
                      filteredRegions.map((region) => (
                        <div
                          key={region.id}
                          className={cn(
                            "flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100 transition-colors",
                            selectedRegionId === region.id && "bg-gray-100"
                          )}
                          onClick={() => handleRegionChange(region.id)}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedRegionId === region.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {region.name}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-500">
                        {selectedCountryId ? "No regions found" : "Select country first"}
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Zone Multi-Select - Only show when region is selected */}
            {selectedRegionId && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Zones</Label>
                <MultiSelectCombobox
                  options={availableZones.map(zone => ({ value: zone.id, label: zone.name }))}
                  selected={selectedZoneIds}
                  onChange={setSelectedZoneIds}
                  placeholder="Search and select zones..."
                  searchPlaceholder="Search zones..."
                  noResultsText="No zones found."
                  className="w-full"
                />
              </div>
            )}
          </div>

          {/* Languages Filter */}
          {languages.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-base font-semibold">Languages</h4>
              <MultiSelectCombobox
                options={languages.map(lang => ({ value: lang.id, label: lang.name }))}
                selected={selectedLanguageIds}
                onChange={setSelectedLanguageIds}
                placeholder="Search and select languages..."
                searchPlaceholder="Search languages..."
                noResultsText="No languages found."
                className="w-full"
              />
            </div>
          )}

          {/* Academic Levels Filter */}
          {academicLevels.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-base font-semibold">Academic Levels</h4>
              <MultiSelectCombobox
                options={academicLevels.map(level => ({ value: level.id, label: level.name }))}
                selected={selectedAcademicLevelIds}
                onChange={setSelectedAcademicLevelIds}
                placeholder="Search and select academic levels..."
                searchPlaceholder="Search academic levels..."
                noResultsText="No academic levels found."
                className="w-full"
              />
            </div>
          )}

          {/* Age Filter */}
          <RangeField
            label="Age Range"
            aboveLabel="Above (years)"
            belowLabel="Below (years)"
            aboveValue={ageAbove}
            belowValue={ageBelow}
            setAbove={setAgeAbove}
            setBelow={setAgeBelow}
            min={0}
            max={120}
            placeholderAbove="e.g., 18"
            placeholderBelow="e.g., 65"
          />

          {/* Consent Form Filter */}
          <div className="space-y-3">
            <h4 className="text-base font-semibold">Consent Form</h4>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="consent-form"
                checked={hasConsentForm === true}
                onCheckedChange={(checked) => 
                  setHasConsentForm(checked ? true : undefined)
                }
                className="h-5 w-5 rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
              />
              <Label 
                htmlFor="consent-form"
                className="text-base font-normal"
              >
                Has Consent Form
              </Label>
            </div>
          </div>

          {/* Cohort Filter */}
          {leafCohorts.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-base font-semibold">Cohorts</h4>
              <MultiSelectCombobox
                options={leafCohorts.map(cohort => ({ 
                  value: cohort.id, 
                  label: getCohortHierarchyName(cohort) 
                }))}
                selected={selectedCohortIds}
                onChange={setSelectedCohortIds}
                placeholder="Search and select cohorts..."
                searchPlaceholder="Search cohorts..."
                noResultsText="No cohorts found."
                className="w-full"
              />
            </div>
          )}

          {/* Attendance Percentage Filter */}
          <RangeField
            label="Attendance Percentage"
            aboveLabel="Above (%)"
            belowLabel="Below (%)"
            aboveValue={attendancePercentageAbove}
            belowValue={attendancePercentageBelow}
            setAbove={setAttendancePercentageAbove}
            setBelow={setAttendancePercentageBelow}
            min={0}
            max={100}
            placeholderAbove="e.g., 80"
            placeholderBelow="e.g., 50"
          />

          {/* Survey Filters */}
          <div className="space-y-3">
            <h4 className="text-base font-semibold">Survey Completion</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="baseline-survey"
                  checked={hasFilledBaselineSurvey === true}
                  onCheckedChange={(checked) => 
                    setHasFilledBaselineSurvey(checked ? true : undefined)
                  }
                  className="h-5 w-5 rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <Label 
                  htmlFor="baseline-survey"
                  className="text-base font-normal"
                >
                  Has Baseline Survey
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="endline-survey"
                  checked={hasFilledEndlineSurvey === true}
                  onCheckedChange={(checked) => 
                    setHasFilledEndlineSurvey(checked ? true : undefined)
                  }
                  className="h-5 w-5 rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <Label 
                  htmlFor="endline-survey"
                  className="text-base font-normal"
                >
                  Has Endline Survey
                </Label>
              </div>
            </div>
          </div>

          {/* Assessment Filters */}
          <div className="space-y-3">
            <h4 className="text-base font-semibold">Assessment Attempts</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="pre-assessment"
                  checked={hasPreAssessmentAttempt === true}
                  onCheckedChange={(checked) => 
                    setHasPreAssessmentAttempt(checked ? true : undefined)
                  }
                  className="h-5 w-5 rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <Label 
                  htmlFor="pre-assessment"
                  className="text-base font-normal"
                >
                  Has Pre-Assessment
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="post-assessment"
                  checked={hasPostAssessmentAttempt === true}
                  onCheckedChange={(checked) => 
                    setHasPostAssessmentAttempt(checked ? true : undefined)
                  }
                  className="h-5 w-5 rounded-[4px] border-gray-300 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                />
                <Label 
                  htmlFor="post-assessment"
                  className="text-base font-normal"
                >
                  Has Post-Assessment
                </Label>
              </div>
            </div>
          </div>

          {/* Assessment Score Filters */}
          <div className="space-y-3">
            <h4 className="text-base font-semibold">Assessment Scores</h4>
            
            {/* Pre-Assessment Scores */}
            <RangeField
              label="Pre-Assessment Score"
              aboveLabel="Above (%)"
              belowLabel="Below (%)"
              aboveValue={preAssessmentScoreAbove}
              belowValue={preAssessmentScoreBelow}
              setAbove={setPreAssessmentScoreAbove}
              setBelow={setPreAssessmentScoreBelow}
              min={0}
              max={100}
              placeholderAbove="e.g., 70"
              placeholderBelow="e.g., 50"
            />

            {/* Post-Assessment Scores */}
            <RangeField
              label="Post-Assessment Score"
              aboveLabel="Above (%)"
              belowLabel="Below (%)"
              aboveValue={postAssessmentScoreAbove}
              belowValue={postAssessmentScoreBelow}
              setAbove={setPostAssessmentScoreAbove}
              setBelow={setPostAssessmentScoreBelow}
              min={0}
              max={100}
              placeholderAbove="e.g., 80"
              placeholderBelow="e.g., 60"
            />
          </div>
          </div>
        </div>
        
        {/* Sticky buttons at bottom */}
        <div className="p-4 border-t bg-white flex justify-between gap-3">
          <Button
            variant="outline"
            className="flex-1 border-gray-200"
            onClick={clearAllFilters}
          >
            Clear All
          </Button>
          <Button
            className="flex-1 bg-brand text-white hover:bg-blue-600"
            onClick={handleApply}
          >
            Apply
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}  