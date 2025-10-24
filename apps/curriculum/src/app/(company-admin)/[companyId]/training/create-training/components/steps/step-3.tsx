"use client"

import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { DatePicker } from '@/components/ui/date-picker'
import { StepProps } from '../types'
import { TrainingFormData } from '@/types/training-form'
import { BaseItem } from '@/types/curriculum'
import { useBaseData } from '@/lib/hooks/useBaseData'

export function CreateTrainingStep3({ onNext, onBack, onCancel, initialData, isEditing = false }: StepProps) {
  // Fetch training types - enabled for editing to ensure all data is available
  const { data: trainingTypes, isLoading: isLoadingTrainingTypes } = useBaseData(
    'training-type', 
    { enabled: isEditing || !initialData?.preloadedTrainingTypes?.length }
  )

  // Use fetched data when editing (to show all options), otherwise use preloaded data if available
  const allTrainingTypes = isEditing 
    ? trainingTypes || []
    : (initialData?.preloadedTrainingTypes?.length ? initialData.preloadedTrainingTypes : trainingTypes || [])

  const {
    register,
    setValue,
    watch,
    formState: { errors }
  } = useFormContext<TrainingFormData>()

  const duration = watch('duration')
  const durationType = watch('durationType')
  const trainingTypeId = watch('trainingTypeId')
  const deliveryMethod = watch('deliveryMethod')
  const startDateString = watch('startDate') || initialData?.startDate || ''
  const endDateString = watch('endDate') || initialData?.endDate || ''
  const productKey = (watch('productKey') ?? initialData?.productKey) ?? null
  const edgeProduct = watch('edgeProduct') ?? initialData?.edgeProduct ?? false

  // Convert strings to Date objects for DatePicker components
  const startDate = startDateString ? new Date(startDateString) : undefined
  const endDate = endDateString ? new Date(endDateString) : undefined

  // Helper function to format date to YYYY-MM-DD string
  const formatDateToString = (date: Date | undefined): string => {
    if (!date) return ''
    return date.toISOString().split('T')[0]
  }

  const handleDurationTypeChange = (value: "MINUTES" | "HOURS" | "DAYS" | "WEEKS" | "MONTHS") => {
    setValue('durationType', value, { shouldValidate: true })
  }

  const handleTrainingTypeChange = (value: string) => {
    setValue('trainingTypeId', value, { shouldValidate: true })
  }
  
  const handleDeliveryMethodChange = (value: "BLENDED" | "OFFLINE" | "VIRTUAL") => {
    setValue('deliveryMethod', value, { shouldValidate: true })
  }

  const handleProductKeyChange = (value: 'LEYU' | 'OTHER' | 'NONE') => {
    setValue('productKey', value === 'NONE' ? null : value, { shouldValidate: true })
  }

  const handleEdgeProductToggle = (checked: boolean | 'indeterminate') => {
    setValue('edgeProduct', checked === true, { shouldValidate: true })
  }

  const handleStartDateChange = (date: Date | undefined) => {
    const dateString = formatDateToString(date)
    setValue('startDate', dateString, { shouldValidate: true })
  }

  const handleEndDateChange = (date: Date | undefined) => {
    const dateString = formatDateToString(date)
    setValue('endDate', dateString, { shouldValidate: true })
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="lg:text-2xl md:text-xl text-lg font-semibold mb-2 text-center">
          What is the duration and type of this training?
        </h2>
        <p className="lg:text-sm md:text-xs text-xs text-gray-500 text-center">
          Provide details about the training duration, delivery method, and type
        </p>
      </div>

      <div className="flex flex-col max-w-xl mx-auto space-y-10 justify-center">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Estimated duration <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              min={1}
              {...register('duration', { valueAsNumber: true })}
              placeholder="Enter duration"
              className="text-sm md:text-md"
            />
            {errors.duration && (
              <p className="text-sm text-red-500">{errors.duration.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Duration type <span className="text-red-500">*</span>
            </label>
            <Select value={durationType} onValueChange={handleDurationTypeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select duration type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MINUTES">Minutes</SelectItem>
                <SelectItem value="HOURS">Hours</SelectItem>
                <SelectItem value="DAYS">Days</SelectItem>
                <SelectItem value="WEEKS">Weeks</SelectItem>
                <SelectItem value="MONTHS">Months</SelectItem>
              </SelectContent>
            </Select>
            {errors.durationType && (
              <p className="text-sm text-red-500">{errors.durationType.message}</p>
            )}
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Delivery Method <span className="text-red-500">*</span>
          </label>
          <Select value={deliveryMethod} onValueChange={handleDeliveryMethodChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select delivery method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="BLENDED">Blended</SelectItem>
              <SelectItem value="OFFLINE">Offline</SelectItem>
              <SelectItem value="VIRTUAL">Virtual</SelectItem>
            </SelectContent>
          </Select>
          {errors.deliveryMethod && (
            <p className="text-sm text-red-500">{errors.deliveryMethod.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Training Type <span className="text-red-500">*</span>
          </label>
          <Select 
            value={trainingTypeId} 
            onValueChange={handleTrainingTypeChange}
            disabled={isLoadingTrainingTypes && !allTrainingTypes.length}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select training type" />
            </SelectTrigger>
            <SelectContent>
              {allTrainingTypes.map((type: BaseItem) => (
                <SelectItem key={type.id} value={type.id}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.trainingTypeId && (
            <p className="text-sm text-red-500">{errors.trainingTypeId.message}</p>
          )}
        </div>

        {/* New Edge Product fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Product Key</label>
            <Select value={(productKey ?? undefined) as unknown as string} onValueChange={(v) => handleProductKeyChange(v as 'LEYU' | 'OTHER' | 'NONE')}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NONE">None</SelectItem>
                <SelectItem value="LEYU">LEYU</SelectItem>
                <SelectItem value="OTHER">OTHER</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Is Edge Product?</label>
            <div className="h-12 flex items-center px-3 border rounded-md gap-3">
              <Checkbox checked={edgeProduct} onCheckedChange={handleEdgeProductToggle} />
              <span className="text-sm">Enable</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Start Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              date={startDate}
              setDate={handleStartDateChange}
              placeholder="Select start date"
              disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              className="text-sm md:text-md h-12"
            />
            {errors.startDate && (
              <p className="text-sm text-red-500">{errors.startDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              End Date <span className="text-red-500">*</span>
            </label>
            <DatePicker
              date={endDate}
              setDate={handleEndDateChange}
              placeholder="Select end date"
              disabled={(date) => {
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                
                if (startDate) {
                  const selectedStartDate = new Date(startDate)
                  selectedStartDate.setHours(0, 0, 0, 0)
                  return date < today || date < selectedStartDate
                }
                
                return date < today
              }}
              className="text-sm md:text-md h-12"
            />
            {errors.endDate && (
              <p className="text-sm text-red-500">{errors.endDate.message}</p>
            )}
          </div>
        </div>

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
                onClick={onNext}
                className="bg-blue-500 text-white px-8"
                disabled={!duration || !durationType || !trainingTypeId || !deliveryMethod || !startDateString || !endDateString}
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
               onClick={onNext}
               className="bg-blue-500 text-white px-8"
                               disabled={!duration || !durationType || !trainingTypeId || !deliveryMethod || !startDateString || !endDateString}
               type="button"
             >
               Continue
             </Button>
          </div>
        )}
      </div>
    </div>
  )
} 