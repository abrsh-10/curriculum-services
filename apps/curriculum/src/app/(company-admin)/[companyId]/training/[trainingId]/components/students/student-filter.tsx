/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import React, { useState } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { StudentFilters } from "@/lib/hooks/useStudents"
import { useCohorts } from "@/lib/hooks/useCohorts"
import { getAllLeafCohorts } from "@/lib/utils/cohort-utils"
import { useSingleCascadingLocation } from "@/lib/hooks/useCascadingLocation"

// Import filter components
import { GenderFilter } from "./filters/GenderFilter"
import { LocationFilter } from "./filters/LocationFilter"
import { MultiSelectFilter } from "./filters/MultiSelectFilter"
import { CohortFilter } from "./filters/CohortFilter"
import { RangeField } from "./filters/RangeField"
import { ConsentFormFilter } from "./filters/ConsentFormFilter"
import { SurveyFilter } from "./filters/SurveyFilter"
import { AssessmentAttemptFilter } from "./filters/AssessmentAttemptFilter"
import { CertificateFilter } from "./filters/CertificateFilter"
import { EdgeSyncFilter } from "./filters/EdgeSyncFilter"
import { useStudentFilterState } from "./filters/useStudentFilterState"

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

interface StudentFilterProps {
  trainingId: string
  countries?: Country[]
  regions?: Region[]
  zones?: Zone[]
  languages?: Language[]
  academicLevels?: AcademicLevel[]
  onApply: (filters: StudentFilters) => void
  defaultSelected?: StudentFilters
}

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

  // Use custom hook for state management
  const filterState = useStudentFilterState(defaultSelected)

  // Fetch cohorts for this training
  const { data: cohortsData } = useCohorts({
    trainingId,
    pageSize: 100
  })

  // Get leaf cohorts for selection
  const leafCohorts = cohortsData?.cohorts ? getAllLeafCohorts(cohortsData.cohorts) : []

  // Cascading location data based on current selections
  const {
    countries: cascadedCountries,
    regions: cascadedRegions,
    zones: cascadedZones
  } = useSingleCascadingLocation(
    filterState.selectedCountryId || undefined, 
    filterState.selectedRegionId || undefined
  )

  // Prefer cascaded data when available, fallback to props
  const effectiveCountries = cascadedCountries.length > 0 ? cascadedCountries : countries
  const effectiveRegions = cascadedRegions.length > 0 ? cascadedRegions : regions
  const effectiveZones = cascadedZones.length > 0 ? cascadedZones : zones

  // Handle apply
  const handleApply = () => {
    onApply(filterState.buildFilters())
    setOpen(false)
  }

  // Handle clear all
  const handleClearAll = () => {
    filterState.clearAll()
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
            filterState.hasActiveFilters() && "border-blue-500 bg-blue-50 text-blue-700"
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
          {filterState.hasActiveFilters() && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-medium text-blue-700 bg-blue-200 rounded-full">
              {filterState.getActiveFilterCount()}
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
            <GenderFilter 
              selectedGenders={filterState.selectedGenders}
              onGenderToggle={filterState.handleGenderToggle}
            />

            {/* Location Filter */}
            <LocationFilter
              countries={effectiveCountries}
              regions={effectiveRegions}
              zones={effectiveZones}
              selectedCountryId={filterState.selectedCountryId}
              selectedRegionId={filterState.selectedRegionId}
              selectedZoneIds={filterState.selectedZoneIds}
              onCountryChange={filterState.handleCountryChange}
              onRegionChange={filterState.handleRegionChange}
              onZoneIdsChange={filterState.setSelectedZoneIds}
            />

            {/* Languages Filter */}
            {languages.length > 0 && (
              <MultiSelectFilter
                title="Languages"
                options={languages}
                selected={filterState.selectedLanguageIds}
                onChange={filterState.setSelectedLanguageIds}
                placeholder="Search and select languages..."
                searchPlaceholder="Search languages..."
                noResultsText="No languages found."
              />
            )}

            {/* Academic Levels Filter */}
            {academicLevels.length > 0 && (
              <MultiSelectFilter
                title="Academic Levels"
                options={academicLevels}
                selected={filterState.selectedAcademicLevelIds}
                onChange={filterState.setSelectedAcademicLevelIds}
                placeholder="Search and select academic levels..."
                searchPlaceholder="Search academic levels..."
                noResultsText="No academic levels found."
              />
            )}

            {/* Age Filter */}
            <RangeField
              label="Age Range"
              aboveLabel="Above (years)"
              belowLabel="Below (years)"
              aboveValue={filterState.ageAbove}
              belowValue={filterState.ageBelow}
              setAbove={filterState.setAgeAbove}
              setBelow={filterState.setAgeBelow}
              min={0}
              max={120}
              placeholderAbove="e.g., 18"
              placeholderBelow="e.g., 65"
            />

            {/* Edge Age Filter */}
            <RangeField
              label="Edge Age Range"
              aboveLabel="Above (years)"
              belowLabel="Below (years)"
              aboveValue={filterState.edgeAgeAbove}
              belowValue={filterState.edgeAgeBelow}
              setAbove={filterState.setEdgeAgeAbove}
              setBelow={filterState.setEdgeAgeBelow}
              min={0}
              max={120}
              placeholderAbove="e.g., 18"
              placeholderBelow="e.g., 65"
            />

            {/* Consent Form Filter */}
            <ConsentFormFilter
              hasConsentForm={filterState.hasConsentForm}
              onChange={(checked) => filterState.setHasConsentForm(checked ? true : undefined)}
            />

            {/* Cohort Filter */}
            <CohortFilter
              cohorts={leafCohorts}
              selectedCohortIds={filterState.selectedCohortIds}
              onChange={filterState.setSelectedCohortIds}
            />

            {/* Attendance Percentage Filter */}
            <RangeField
              label="Attendance Percentage"
              aboveLabel="Above (%)"
              belowLabel="Below (%)"
              aboveValue={filterState.attendancePercentageAbove}
              belowValue={filterState.attendancePercentageBelow}
              setAbove={filterState.setAttendancePercentageAbove}
              setBelow={filterState.setAttendancePercentageBelow}
              min={0}
              max={100}
              placeholderAbove="e.g., 80"
              placeholderBelow="e.g., 50"
            />

            {/* Survey Filters */}
            <SurveyFilter
              hasFilledBaselineSurvey={filterState.hasFilledBaselineSurvey}
              hasFilledEndlineSurvey={filterState.hasFilledEndlineSurvey}
              onBaselineSurveyChange={(checked) => filterState.setHasFilledBaselineSurvey(checked ? true : undefined)}
              onEndlineSurveyChange={(checked) => filterState.setHasFilledEndlineSurvey(checked ? true : undefined)}
            />

            {/* Assessment Attempt Filters */}
            <AssessmentAttemptFilter
              hasPreAssessmentAttempt={filterState.hasPreAssessmentAttempt}
              hasPostAssessmentAttempt={filterState.hasPostAssessmentAttempt}
              onPreAssessmentChange={(checked) => filterState.setHasPreAssessmentAttempt(checked ? true : undefined)}
              onPostAssessmentChange={(checked) => filterState.setHasPostAssessmentAttempt(checked ? true : undefined)}
            />

            {/* Assessment Score Filters */}
            <div className="space-y-3">
              <h4 className="text-base font-semibold">Assessment Scores</h4>
              
              <RangeField
                label="Pre-Assessment Score"
                aboveLabel="Above (%)"
                belowLabel="Below (%)"
                aboveValue={filterState.preAssessmentScoreAbove}
                belowValue={filterState.preAssessmentScoreBelow}
                setAbove={filterState.setPreAssessmentScoreAbove}
                setBelow={filterState.setPreAssessmentScoreBelow}
                min={0}
                max={100}
                placeholderAbove="e.g., 70"
                placeholderBelow="e.g., 50"
              />

              <RangeField
                label="Post-Assessment Score"
                aboveLabel="Above (%)"
                belowLabel="Below (%)"
                aboveValue={filterState.postAssessmentScoreAbove}
                belowValue={filterState.postAssessmentScoreBelow}
                setAbove={filterState.setPostAssessmentScoreAbove}
                setBelow={filterState.setPostAssessmentScoreBelow}
                min={0}
                max={100}
                placeholderAbove="e.g., 80"
                placeholderBelow="e.g., 60"
              />
            </div>

            {/* Certificate Filters */}
            <CertificateFilter
              isCertified={filterState.isCertified}
              isCertificateSmsSent={filterState.isCertificateSmsSent}
              onCertifiedChange={(checked) => filterState.setIsCertified(checked ? true : undefined)}
              onSmsSentChange={(checked) => filterState.setIsCertificateSmsSent(checked ? true : undefined)}
            />

            {/* Edge Sync Filters */}
            <EdgeSyncFilter
              isCreationSyncedWithEdge={filterState.isCreationSyncedWithEdge}
              isEnrollmentSyncedWithEdge={filterState.isEnrollmentSyncedWithEdge}
              isPreAssessmentSyncedWithEdge={filterState.isPreAssessmentSyncedWithEdge}
              isPostAssessmentSyncedWithEdge={filterState.isPostAssessmentSyncedWithEdge}
              onCreationSyncChange={filterState.setIsCreationSyncedWithEdge}
              onEnrollmentSyncChange={filterState.setIsEnrollmentSyncedWithEdge}
              onPreAssessmentSyncChange={filterState.setIsPreAssessmentSyncedWithEdge}
              onPostAssessmentSyncChange={filterState.setIsPostAssessmentSyncedWithEdge}
            />
          </div>
        </div>
        
        {/* Sticky buttons at bottom */}
        <div className="p-4 border-t bg-white flex justify-between gap-3">
          <Button
            variant="outline"
            className="flex-1 border-gray-200"
            onClick={handleClearAll}
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

