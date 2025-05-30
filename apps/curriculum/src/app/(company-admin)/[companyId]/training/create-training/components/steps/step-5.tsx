"use client"

import { useFormContext } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useBaseData } from '@/lib/hooks/useBaseData'
import { StepProps } from '../types'
import { TrainingFormData, BaseItem } from '@/types/training-form'

export function CreateTrainingStep5({ onNext, onBack, onCancel, isSubmitting, isEditing = false }: StepProps) {
  const { data: trainingPurposes, isLoading } = useBaseData('training-purpose', { enabled: true });
  
  const { watch, setValue } = useFormContext<TrainingFormData>();
  
  const trainingPurposeIds = watch('trainingPurposeIds') || [];
  const selectedPurposeId = trainingPurposeIds[0] || '';

  const handlePurposeChange = (value: string) => {
    setValue('trainingPurposeIds', [value], { shouldValidate: true });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="lg:text-2xl md:text-xl text-lg font-semibold mb-2 text-center">
          What is the purpose for the training?
        </h2>
        <p className="lg:text-sm md:text-xs text-xs text-gray-500 text-center">
          Select the main purpose of this training program
        </p>
      </div>

      <div className="flex flex-col max-w-xl mx-auto space-y-10 justify-center">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Training Purpose <span className="text-red-500">*</span>
          </label>
          <Select
            value={selectedPurposeId}
            onValueChange={handlePurposeChange}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select purpose" />
            </SelectTrigger>
            <SelectContent>
              {trainingPurposes?.map((item: BaseItem) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                disabled={!selectedPurposeId || isSubmitting}
                type="button"
              >
                {isSubmitting ? 'Editing...' : 'Edit Training'}
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
              disabled={!selectedPurposeId || isSubmitting}
              type="button"
            >
              {isSubmitting ? 'Creating...' : 'Create Training'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
} 