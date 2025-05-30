"use client"

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StepProps } from '../types'
import { TrainingFormData, BaseItem } from '@/types/training-form'
import { useBaseData } from '@/lib/hooks/useBaseData'

export function CreateTrainingStep3({ onNext, onBack, onCancel, initialData, isEditing = false }: StepProps) {
  // Fetch training types if not provided
  const { data: trainingTypes, isLoading: isLoadingTrainingTypes } = useBaseData(
    'training-type', 
    { enabled: !initialData?.preloadedTrainingTypes?.length }
  )

  // Use preloaded or fetched training types
  const allTrainingTypes = initialData?.preloadedTrainingTypes || trainingTypes || []

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

  const handleDurationTypeChange = (value: "DAYS" | "WEEKS" | "MONTHS" | "HOURS") => {
    setValue('durationType', value, { shouldValidate: true })
  }

  const handleTrainingTypeChange = (value: string) => {
    setValue('trainingTypeId', value, { shouldValidate: true })
  }
  
  const handleDeliveryMethodChange = (value: "BLENDED" | "ONLINE" | "VIRTUAL") => {
    setValue('deliveryMethod', value, { shouldValidate: true })
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
              <SelectItem value="ONLINE">Online</SelectItem>
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
                disabled={!duration || !durationType || !trainingTypeId || !deliveryMethod}
                type="button"
              >
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={onNext}
            className="bg-blue-500 text-white px-8 w-[25%] mx-auto"
            disabled={!duration || !durationType || !trainingTypeId || !deliveryMethod}
            type="button"
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  )
} 