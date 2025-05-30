"use client"

import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useBaseData } from '@/lib/hooks/useBaseData'
import { StepProps } from '../types'
import { TrainingFormData } from '@/types/training-form'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Check, ChevronsUpDown } from 'lucide-react'
import { GenderSlider } from '@/components/ui/gender-slider'
import { Input } from '@/components/ui/input'

interface BaseItem {
  id: string
  name: string
  description: string
}

export function CreateTrainingStep4({ onNext, onBack, onCancel, initialData, isEditing = false }: StepProps) {
  // Only fetch data if not preloaded
  const { data: ageGroups } = useBaseData('age-group', { 
    enabled: !initialData?.preloadedAgeGroups?.length
  })
  const { data: disabilities } = useBaseData('disability', {
    enabled: !initialData?.preloadedDisabilities?.length
  })
  const { data: marginalizedGroups } = useBaseData('marginalized-group', {
    enabled: !initialData?.preloadedMarginalizedGroups?.length
  })
  const { data: economicBackgrounds } = useBaseData('economic-background', {
    enabled: !initialData?.preloadedEconomicBackgrounds?.length
  })
  const { data: academicQualifications } = useBaseData('academic-qualification', {
    enabled: !initialData?.preloadedAcademicQualifications?.length
  })

  // Popover states
  const [openAgeGroups, setOpenAgeGroups] = useState(false)
  const [openDisabilities, setOpenDisabilities] = useState(false)
  const [openMarginalizedGroups, setOpenMarginalizedGroups] = useState(false)
  const [openEconomicBackgrounds, setOpenEconomicBackgrounds] = useState(false)
  const [openAcademicQualifications, setOpenAcademicQualifications] = useState(false)

  const {
    setValue,
    watch,
    register,
    formState: { errors }
  } = useFormContext<TrainingFormData>()

  const ageGroupIds = watch('ageGroupIds') || []
  const economicBackgroundIds = watch('economicBackgroundIds') || []
  const academicQualificationIds = watch('academicQualificationIds') || []
  const genderPercentages = watch('genderPercentages') || [
    { gender: "MALE", percentage: 50 },
    { gender: "FEMALE", percentage: 50 }
  ]
  const disabilityPercentages = watch('disabilityPercentages') || []
  const marginalizedGroupPercentages = watch('marginalizedGroupPercentages') || []
  const totalParticipants = watch('totalParticipants') || 0

  // Extract IDs for easier handling in UI
  const disabilityIds = disabilityPercentages?.map(d => d.disabilityId) || []
  const marginalizedGroupIds = marginalizedGroupPercentages?.map(m => m.marginalizedGroupId) || []

  // Use preloaded data or fetched data
  const safeAgeGroups = initialData?.preloadedAgeGroups?.length 
    ? initialData.preloadedAgeGroups 
    : ageGroups || []
  
  const safeDisabilities = initialData?.preloadedDisabilities?.length
    ? initialData.preloadedDisabilities
    : disabilities || []
  
  const safeMarginalizedGroups = initialData?.preloadedMarginalizedGroups?.length
    ? initialData.preloadedMarginalizedGroups
    : marginalizedGroups || []
  
  const safeEconomicBackgrounds = initialData?.preloadedEconomicBackgrounds?.length
    ? initialData.preloadedEconomicBackgrounds
    : economicBackgrounds || []
  
  const safeAcademicQualifications = initialData?.preloadedAcademicQualifications?.length
    ? initialData.preloadedAcademicQualifications
    : academicQualifications || []

  // Handle age group selection
  const handleAgeGroupChange = (value: string) => {
    const currentAgeGroups = ageGroupIds || []
    const newAgeGroups = currentAgeGroups.includes(value)
      ? currentAgeGroups.filter(id => id !== value)
      : [...currentAgeGroups, value]
    
    setValue('ageGroupIds', newAgeGroups, { shouldValidate: true })
  }

  // Handle economic background selection
  const handleSelectEconomicBackground = (backgroundId: string) => {
    let newBackgroundIds: string[]
    
    if (economicBackgroundIds.includes(backgroundId)) {
      newBackgroundIds = economicBackgroundIds.filter(id => id !== backgroundId)
    } else {
      newBackgroundIds = [...economicBackgroundIds, backgroundId]
    }
    
    setValue('economicBackgroundIds', newBackgroundIds, { shouldValidate: true })
  }

  // Handle gender slider changes
  const handleGenderPercentageChange = (value: number) => {
    setValue('genderPercentages', [
      { gender: "MALE", percentage: value },
      { gender: "FEMALE", percentage: 100 - value }
    ], { shouldValidate: true })
  }

  // Handle disability selection
  const handleSelectDisability = (disabilityId: string) => {
    const newDisabilityPercentages = [...(disabilityPercentages || [])]
    
    // Check if it's already selected
    const existingIndex = newDisabilityPercentages.findIndex(d => d.disabilityId === disabilityId)
    
    if (existingIndex >= 0) {
      // Remove it if it exists
      newDisabilityPercentages.splice(existingIndex, 1)
    } else {
      // Add it with default 20% if it doesn't exist
      newDisabilityPercentages.push({
        disabilityId,
        percentage: 20
      })
    }
    
    setValue('disabilityPercentages', newDisabilityPercentages, { shouldValidate: true })
  }

  // Handle disability percentage change
  const handleDisabilityPercentageChange = (disabilityId: string, percentage: number | null) => {
    const newDisabilityPercentages = disabilityPercentages?.map(d => 
      d.disabilityId === disabilityId 
        ? { ...d, percentage: percentage === null ? 0 : Math.min(100, Math.max(1, percentage)) } 
        : d
    ) || []
    
    setValue('disabilityPercentages', newDisabilityPercentages, { shouldValidate: true })
  }

  // Handle marginalized group selection
  const handleSelectMarginalizedGroup = (groupId: string) => {
    const newMarginalizedGroupPercentages = [...(marginalizedGroupPercentages || [])]
    
    // Check if it's already selected
    const existingIndex = newMarginalizedGroupPercentages.findIndex(m => m.marginalizedGroupId === groupId)
    
    if (existingIndex >= 0) {
      // Remove it if it exists
      newMarginalizedGroupPercentages.splice(existingIndex, 1)
    } else {
      // Add it with default 20% if it doesn't exist
      newMarginalizedGroupPercentages.push({
        marginalizedGroupId: groupId,
        percentage: 20
      })
    }
    
    setValue('marginalizedGroupPercentages', newMarginalizedGroupPercentages, { shouldValidate: true })
  }

  // Handle marginalized group percentage change
  const handleMarginalizedGroupPercentageChange = (groupId: string, percentage: number | null) => {
    const newMarginalizedGroupPercentages = marginalizedGroupPercentages?.map(m => 
      m.marginalizedGroupId === groupId 
        ? { ...m, percentage: percentage === null ? 0 : Math.min(100, Math.max(1, percentage)) } 
        : m
    ) || []
    
    setValue('marginalizedGroupPercentages', newMarginalizedGroupPercentages, { shouldValidate: true })
  }

  // Handle academic qualification selection
  const handleSelectAcademicQualification = (qualificationId: string) => {
    let newQualificationIds: string[]
    
    if (academicQualificationIds.includes(qualificationId)) {
      newQualificationIds = academicQualificationIds.filter(id => id !== qualificationId)
    } else {
      newQualificationIds = [...academicQualificationIds, qualificationId]
    }
    
    setValue('academicQualificationIds', newQualificationIds, { shouldValidate: true })
  }

  // Calculate male percentage for the slider
  const malePercentage = genderPercentages?.find(g => g.gender === "MALE")?.percentage || 0

  const handleContinue = () => {
    onNext?.();
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="lg:text-2xl md:text-xl text-lg font-semibold mb-2 text-center">
          Who are the target audience?
        </h2>
        <p className="lg:text-sm md:text-xs text-xs text-gray-500 text-center">
          Define the characteristics of your target participants
        </p>
      </div>

      <div className="flex flex-col max-w-xl mx-auto space-y-10 justify-center">
        {/* Total Participants */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Total Participants <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min={1}
            {...register('totalParticipants', { valueAsNumber: true })}
            placeholder="Enter total number of participants"
            className="text-sm md:text-md"
          />
          {errors.totalParticipants && (
            <p className="text-sm text-red-500">{errors.totalParticipants.message}</p>
          )}
        </div>

        {/* Age Group Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Age Group <span className="text-red-500">*</span>
          </label>
          <Popover
            open={openAgeGroups}
            onOpenChange={setOpenAgeGroups}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between py-6"
                type="button"
              >
                <div className="flex flex-wrap gap-1 items-center">
                  {ageGroupIds && ageGroupIds.length > 0 ? (
                    <>
                      {ageGroupIds.slice(0, 1).map((id, index) => {
                        const ageGroup = safeAgeGroups.find((group: BaseItem) => group.id === id)
                        return ageGroup ? (
                          <Badge key={`age-${id}-${index}`} variant="pending" className="rounded-sm text-xs">
                            {ageGroup.name}
                          </Badge>
                        ) : null
                      })}
                      {ageGroupIds.length > 1 && (
                        <span className="text-sm text-gray-500 ml-1">
                          + {ageGroupIds.length - 1} more
                        </span>
                      )}
                    </>
                  ) : (
                    "Select age groups..."
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <div className="max-h-[300px] overflow-auto">
                {safeAgeGroups.length > 0 ? (
                  safeAgeGroups.map((ageGroup: BaseItem) => (
                    <div
                      key={ageGroup.id}
                      className={cn(
                        "flex items-center px-4 py-2 cursor-pointer hover:bg-gray-100",
                        ageGroupIds?.includes(ageGroup.id) && "bg-gray-100"
                      )}
                      onClick={() => handleAgeGroupChange(ageGroup.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          ageGroupIds?.includes(ageGroup.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {ageGroup.name}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">No age groups available</div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          {errors.ageGroupIds && (
            <p className="text-sm text-red-500">{errors.ageGroupIds.message}</p>
          )}
        </div>

        {/* Gender Distribution */}
        <div className="space-y-4">
          <label className="text-sm font-medium">Gender Distribution</label>
          <GenderSlider
            value={[malePercentage]}
            onValueChange={([value]) => handleGenderPercentageChange(value)}
            max={100}
            step={1}
          />
        </div>

        {/* Economic Backgrounds Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Economic Background <span className="text-red-500">*</span>
          </label>
          <Popover
            open={openEconomicBackgrounds}
            onOpenChange={setOpenEconomicBackgrounds}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between py-6"
                type="button"
              >
                <div className="flex flex-wrap gap-1 items-center">
                  {economicBackgroundIds && economicBackgroundIds.length > 0 ? (
                    <>
                      {economicBackgroundIds.slice(0, 1).map((id, index) => {
                        const background = safeEconomicBackgrounds.find((item: BaseItem) => 
                          item.id === id
                        )
                        return (
                          <Badge key={`econ-${id}-${index}`} variant="pending" className="rounded-sm text-xs">
                            {background?.name}
                          </Badge>
                        );
                      })}
                      {economicBackgroundIds.length > 1 && (
                        <span className="text-sm text-gray-500 ml-1">
                          + {economicBackgroundIds.length - 1} more
                        </span>
                      )}
                    </>
                  ) : (
                    "Select economic backgrounds..."
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <div className="max-h-[300px] overflow-auto">
                {safeEconomicBackgrounds.length > 0 ? (
                  safeEconomicBackgrounds.map((background: BaseItem) => (
                    <div
                      key={background.id}
                      className={cn(
                        "flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-gray-100",
                        economicBackgroundIds.includes(background.id) &&
                          "bg-gray-100"
                      )}
                      onClick={() =>
                        handleSelectEconomicBackground(background.id)
                      }
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          economicBackgroundIds.includes(background.id)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {background.name}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No economic backgrounds available
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          {errors.economicBackgroundIds && (
            <p className="text-sm text-red-500">
              {errors.economicBackgroundIds.message}
            </p>
          )}
        </div>

        {/* Academic Qualifications Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Academic Qualifications <span className="text-red-500">*</span>
          </label>
          <Popover
            open={openAcademicQualifications}
            onOpenChange={setOpenAcademicQualifications}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between py-6"
                type="button"
              >
                <div className="flex flex-wrap gap-1 items-center">
                  {academicQualificationIds && academicQualificationIds.length > 0 ? (
                    <>
                      {academicQualificationIds.slice(0, 1).map((id, index) => {
                        const qualification = safeAcademicQualifications.find((item: BaseItem) => 
                          item.id === id
                        )
                        return (
                          <Badge key={`acad-${id}-${index}`} variant="pending" className="rounded-sm text-xs">
                            {qualification?.name}
                          </Badge>
                        );
                      })}
                      {academicQualificationIds.length > 1 && (
                        <span className="text-sm text-gray-500 ml-1">
                          + {academicQualificationIds.length - 1} more
                        </span>
                      )}
                    </>
                  ) : (
                    "Select academic qualifications..."
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <div className="max-h-[300px] overflow-auto">
                {safeAcademicQualifications.length > 0 ? (
                  safeAcademicQualifications.map((qualification: BaseItem) => (
                    <div
                      key={qualification.id}
                      className={cn(
                        "flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-gray-100",
                        academicQualificationIds.includes(qualification.id) &&
                          "bg-gray-100"
                      )}
                      onClick={() =>
                        handleSelectAcademicQualification(qualification.id)
                      }
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          academicQualificationIds.includes(qualification.id)
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {qualification.name}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No academic qualifications available
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
          {errors.academicQualificationIds && (
            <p className="text-sm text-red-500">
              {errors.academicQualificationIds.message}
            </p>
          )}
        </div>

        {/* Disabilities Selection (Optional) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Disabilities (Optional)</label>
          <Popover open={openDisabilities} onOpenChange={setOpenDisabilities}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between py-6"
                type="button"
              >
                <div className="flex flex-wrap gap-1 items-center">
                  {disabilityPercentages && disabilityPercentages.length > 0 ? (
                    <>
                      {disabilityPercentages.slice(0, 1).map(dp => {
                        const disability = safeDisabilities.find((item: BaseItem) => 
                          item.id === dp.disabilityId
                        )
                        return (
                          <Badge key={dp.disabilityId} variant="pending" className="rounded-sm text-xs">
                            {disability?.name} ({dp.percentage}%)
                          </Badge>
                        )
                      })}
                      {disabilityPercentages.length > 1 && (
                        <span className="text-sm text-gray-500 ml-1">
                          + {disabilityPercentages.length - 1} more
                        </span>
                      )}
                    </>
                  ) : (
                    "Select disabilities..."
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <div className="max-h-[300px] overflow-auto">
                {safeDisabilities.length > 0 ? (
                  safeDisabilities.map((disability: BaseItem) => (
                    <div key={disability.id} className="border-b border-gray-100 last:border-0">
                      <div
                        className={cn(
                          "flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-gray-100",
                          disabilityIds.includes(disability.id) && "bg-gray-50"
                        )}
                        onClick={() => handleSelectDisability(disability.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            disabilityIds.includes(disability.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {disability.name}
                      </div>
                      {disabilityIds.includes(disability.id) && (
                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Percentage:</span>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={disabilityPercentages?.find(d => d.disabilityId === disability.id)?.percentage || ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : parseInt(e.target.value);
                                handleDisabilityPercentageChange(disability.id, val);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                              className="w-16 h-7 text-xs border rounded-md px-2"
                              aria-label={`Percentage for ${disability.name}`}
                              title={`Set percentage for ${disability.name}`}
                            />
                            <span className="text-xs">%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No disabilities available
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Marginalized Groups Selection (Optional) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Marginalized Groups (Optional)</label>
          <Popover open={openMarginalizedGroups} onOpenChange={setOpenMarginalizedGroups}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between py-6"
                type="button"
              >
                <div className="flex flex-wrap gap-1 items-center">
                  {marginalizedGroupPercentages && marginalizedGroupPercentages.length > 0 ? (
                    <>
                      {marginalizedGroupPercentages.slice(0, 1).map(mgp => {
                        const group = safeMarginalizedGroups.find((item: BaseItem) => 
                          item.id === mgp.marginalizedGroupId
                        )
                        return (
                          <Badge key={mgp.marginalizedGroupId} variant="pending" className="rounded-sm text-xs">
                            {group?.name} ({mgp.percentage}%)
                          </Badge>
                        )
                      })}
                      {marginalizedGroupPercentages.length > 1 && (
                        <span className="text-sm text-gray-500 ml-1">
                          + {marginalizedGroupPercentages.length - 1} more
                        </span>
                      )}
                    </>
                  ) : (
                    "Select marginalized groups..."
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <div className="max-h-[400px] overflow-auto">
                {safeMarginalizedGroups.length > 0 ? (
                  safeMarginalizedGroups.map((group: BaseItem) => (
                    <div key={group.id} className="border-b border-gray-100 last:border-0">
                      <div
                        className={cn(
                          "flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-gray-100",
                          marginalizedGroupIds.includes(group.id) && "bg-gray-50"
                        )}
                        onClick={() => handleSelectMarginalizedGroup(group.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            marginalizedGroupIds.includes(group.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {group.name}
                      </div>
                      {marginalizedGroupIds.includes(group.id) && (
                        <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-gray-500">Percentage:</span>
                            <input
                              type="number"
                              min="1"
                              max="100"
                              value={marginalizedGroupPercentages?.find(m => m.marginalizedGroupId === group.id)?.percentage || ''}
                              onChange={(e) => {
                                const val = e.target.value === '' ? null : parseInt(e.target.value);
                                handleMarginalizedGroupPercentageChange(group.id, val);
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onFocus={(e) => e.stopPropagation()}
                              className="w-16 h-7 text-xs border rounded-md px-2"
                              aria-label={`Percentage for ${group.name}`}
                              title={`Set percentage for ${group.name}`}
                            />
                            <span className="text-xs">%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No marginalized groups available
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Navigation Buttons */}
        {isEditing ? (
          <div className="flex justify-between pt-8 w-full">
            <div>
              {onBack && (
                <Button 
                  onClick={onBack} 
                  variant="outline" 
                  type="button"
                >
                  Back
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {onCancel && (
                <Button 
                  onClick={onCancel} 
                  variant="outline" 
                  type="button"
                >
                  Cancel
                </Button>
              )}
              <Button 
                onClick={handleContinue}
                className="bg-blue-500 text-white px-8"
                disabled={
                  !ageGroupIds?.length ||
                  !economicBackgroundIds?.length ||
                  !academicQualificationIds?.length
                }
                type="button"
              >
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-between pt-8 w-full">
            {onBack && (
              <Button 
                onClick={onBack} 
                variant="outline" 
                type="button"
              >
                Back
              </Button>
            )}
            <Button 
              onClick={handleContinue}
              className="bg-blue-500 text-white px-8"
              disabled={
                !ageGroupIds?.length ||
                !economicBackgroundIds?.length ||
                !academicQualificationIds?.length
              }
              type="button"
            >
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 