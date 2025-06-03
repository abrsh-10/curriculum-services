'use client'

import { useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { StepProps } from '../types'
import { TrainingFormData } from '@/types/training-form'
import { BaseItem } from '@/types/curriculum'
import { useBaseData } from '@/lib/hooks/useBaseData'
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, ChevronsUpDown } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from '@/lib/utils'

export function CreateTrainingStep1({ onNext, onBack, onCancel, isEditing = false }: StepProps) {
  const { data: trainingTags, isLoading } = useBaseData('training-tag', { enabled: true });

  const {
    register,
    watch,
    setValue,
    formState: { errors }
  } = useFormContext<TrainingFormData>();

  const [openTrainingTags, setOpenTrainingTags] = useState(false);

  const title = watch('title');
  const rationale = watch('rationale'); 
  const trainingTagIds = watch('trainingTagIds') || [];

  const handleSelectTrainingTag = (tagId: string) => {
    let newTagIds: string[];
    if (trainingTagIds.includes(tagId)) {
      newTagIds = trainingTagIds.filter(id => id !== tagId);
    } else {
      newTagIds = [...trainingTagIds, tagId];
    }
    setValue('trainingTagIds', newTagIds, { shouldValidate: true });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="lg:text-2xl md:text-xl text-lg font-semibold mb-2 text-center">
          What is the title, rationale and tags of the training?
        </h2>
        <p className="lg:text-sm md:text-xs text-xs text-gray-500 text-center">
          Provide basic information about your training program
        </p>
      </div>

      <div className="flex flex-col max-w-xl mx-auto space-y-10 justify-center">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Training Title <span className="text-red-500">*</span>
          </label>
          <Input
            {...register('title')}
            placeholder="Enter a descriptive title for the training"
            className="max-w-xl text-sm md:text-md"
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Training Rationale <span className="text-red-500">*</span></label>
          <Input
            {...register('rationale')}
            placeholder="Explain the purpose and goals of this training"
            className="max-w-xl text-sm md:text-md"
          />
          {errors.rationale && (
            <p className="text-sm text-red-500">{errors.rationale.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Training Tags <span className="text-red-500">*</span></label>
          <Popover
            open={openTrainingTags}
            onOpenChange={setOpenTrainingTags}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-between py-6"
                type="button"
                disabled={isLoading}
              >
                <div className="flex flex-wrap gap-1 items-center">
                  {trainingTagIds && trainingTagIds.length > 0 ? (
                    <>
                      {trainingTagIds.slice(0, 3).map((id) => {
                        const tag = trainingTags?.find((item: BaseItem) => item.id === id);
                        return tag ? (
                          <Badge key={id} variant="pending" className="rounded-sm text-xs">
                            {tag.name}
                          </Badge>
                        ) : null;
                      })}
                      {trainingTagIds.length > 3 && (
                        <span className="text-sm text-gray-500 ml-1">
                          + {trainingTagIds.length - 3} more
                        </span>
                      )}
                    </>
                  ) : (
                    "Select training tags..."
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <div className="max-h-[300px] overflow-auto">
                {trainingTags && trainingTags.length > 0 ? (
                  trainingTags.map((tag: BaseItem) => (
                    <div
                      key={tag.id}
                      className={cn(
                        "flex items-center px-4 py-2 text-sm cursor-pointer hover:bg-gray-100",
                        trainingTagIds.includes(tag.id) && "bg-gray-100"
                      )}
                      onClick={() => handleSelectTrainingTag(tag.id)}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          trainingTagIds.includes(tag.id) ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {tag.name}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    {isLoading ? "Loading tags..." : "No training tags available"}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
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
                type="button"
                disabled={!title?.trim() || !rationale?.trim()}
              >
                Continue
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={onNext}
            className="bg-blue-500 text-white px-8 w-[25%] mx-auto"
            type="button"
            disabled={!title?.trim() || !rationale?.trim()}
          >
            Continue
          </Button>
        )}
      </div>
    </div>
  );
} 