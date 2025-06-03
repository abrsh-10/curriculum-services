/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { EditFormContainer } from "@/components/ui/edit-form-container"
import { useBulkCreateObjective, useBulkUpdateObjective, useDeleteObjective } from "@/lib/hooks/useObjective"
import { toast } from "sonner"

export interface ObjectiveFormData {
  generalObjective: string
  specificObjective: string
  outcome: string
}

interface ObjectiveProps {
  trainingId: string
  initialData?: {
    generalObjective?: { definition: string, id: string }
    specificObjectives?: Array<{
      id: string
      definition: string
      outcomes: Array<{
        id: string
        definition: string
      }>
    }>
  } | null
  onSave: (data: ObjectiveFormData) => Promise<void>
  onCancel: () => void
}

interface SpecificObjective {
  id?: string // Optional for new objectives
  definition: string
  outcomes: Array<{
    id?: string // Optional for new outcomes
    definition: string
  }>
}

export function Objective({ trainingId, initialData, onSave, onCancel }: ObjectiveProps) {
  const [generalObjective, setGeneralObjective] = useState(initialData?.generalObjective?.definition || "")
  const [specificObjectives, setSpecificObjectives] = useState<SpecificObjective[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const bulkCreateMutation = useBulkCreateObjective()
  const bulkUpdateMutation = useBulkUpdateObjective()
  const deleteMutation = useDeleteObjective()

  // Initialize specific objectives from initial data
  useEffect(() => {
    if (initialData?.specificObjectives) {
      setSpecificObjectives(
        initialData.specificObjectives.map(obj => ({
          id: obj.id,
          definition: obj.definition,
          outcomes: obj.outcomes.map(outcome => ({
            id: outcome.id,
            definition: outcome.definition
          }))
        }))
      )
    }
  }, [initialData])

  const handleAddSpecificObjective = () => {
    setSpecificObjectives(prev => [...prev, { 
      definition: "", 
      outcomes: []
    }])
  }

  const handleRemoveSpecificObjective = async (index: number) => {
    const objective = specificObjectives[index]
    
    // If it's an existing objective (has ID), delete it from the server
    if (objective.id) {
      try {
        await deleteMutation.mutateAsync({ 
          objectiveId: objective.id, 
          trainingId 
        })
        toast.success("Objective deleted successfully")
      } catch (error: any) {
        toast.error(error.message || "Failed to delete objective")
        return // Don't remove from UI if server deletion failed
      }
    }
    
    // Remove from local state
    setSpecificObjectives(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpdateSpecificObjective = (index: number, value: string) => {
    setSpecificObjectives(prev => prev.map((obj, i) => 
      i === index ? { ...obj, definition: value } : obj
    ))
  }

  const handleAddOutcome = (specificIndex: number) => {
    setSpecificObjectives(prev => prev.map((obj, i) => 
      i === specificIndex ? { 
        ...obj, 
        outcomes: [...obj.outcomes, { definition: "" }] 
      } : obj
    ))
  }

  const handleUpdateOutcome = (specificIndex: number, outcomeIndex: number, value: string) => {
    setSpecificObjectives(prev => prev.map((obj, i) => 
      i === specificIndex ? {
        ...obj,
        outcomes: obj.outcomes.map((outcome, oi) => 
          oi === outcomeIndex ? { ...outcome, definition: value } : outcome
        )
      } : obj
    ))
  }

  const handleRemoveOutcome = (specificIndex: number, outcomeIndex: number) => {
    setSpecificObjectives(prev => prev.map((obj, i) => 
      i === specificIndex ? {
        ...obj,
        outcomes: obj.outcomes.filter((_, oi) => oi !== outcomeIndex)
      } : obj
    ))
  }

  const handleSave = async () => {
    try {
      setIsSubmitting(true)

      const isCreating = !initialData?.generalObjective?.id
      
      if (isCreating) {
        // Use bulk create for new objectives
        const createData = {
          trainingId,
          generalObjective,
          specificObjectives: specificObjectives
            .filter(obj => obj.definition.trim())
            .map(obj => ({
              specificObjective: obj.definition,
              outcomes: obj.outcomes
                .filter(outcome => outcome.definition.trim())
                .map(outcome => outcome.definition)
            }))
        }

        await bulkCreateMutation.mutateAsync(createData)
      } else {
        // Use bulk update for existing objectives
        const updateData = {
          generalObjectiveId: initialData!.generalObjective!.id,
          generalObjective,
          specificObjectives: specificObjectives
            .filter(obj => obj.definition.trim())
            .map(obj => ({
              id: obj.id || "", // For new objectives without ID, the backend should handle this
              specificObjective: obj.definition,
              outcomes: obj.outcomes
                .filter(outcome => outcome.definition.trim())
                .map(outcome => ({
                  id: outcome.id || "", // For new outcomes without ID, the backend should handle this
                  definition: outcome.definition
                }))
            }))
        }

        await bulkUpdateMutation.mutateAsync({ 
          data: updateData, 
          trainingId 
        })
      }

      toast.success("Objectives saved successfully")
      
      // Call onSave with empty data since everything is already saved
      onSave({ 
        generalObjective: "", 
        specificObjective: "",
        outcome: ""
      })
    } catch (error: any) {
      toast.error(error.message || "Failed to save objectives")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <EditFormContainer
      title="Curriculum Objective"
      description="Enter a brief overview of this section's content to give users a clear understanding of what to enter."
    >
      <div className="space-y-6">
        {/* General Objective */}
        <div className="space-y-4">
          <label className="text-sm font-medium">General Objective</label>
          <Input
            value={generalObjective}
            onChange={(e) => setGeneralObjective(e.target.value)}
            placeholder="Enter general objective"
          />
        </div>

        {/* Specific Objectives Section */}
        <div className="space-y-4">
          {specificObjectives.map((obj, index) => (
            <div key={obj.id || `new-${index}`} className="space-y-2">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Specific Objective
                </label>
                <div className="relative">
                  <Input
                    value={obj.definition}
                    onChange={(e) => handleUpdateSpecificObjective(index, e.target.value)}
                    placeholder="Enter specific objective"
                    className="pr-10"
                  />
                  <div className="absolute right-10 top-1/2 -translate-y-1/2 h-full w-[1px] bg-gray-200" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSpecificObjective(index)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-red-50 hover:bg-red-100 p-0"
                    disabled={deleteMutation.isPending}
                  >
                    <img src="/delete.svg" alt="delete" className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Outcomes Section */}
              <div className="pl-8 space-y-2">
                {obj.outcomes.map((outcome, outcomeIndex) => (
                  <div key={outcome.id || `outcome-${outcomeIndex}`}>
                    <label className="text-sm font-medium py-3 block">
                      Outcome
                    </label>
                    <div className="relative">
                      <Input
                        value={outcome.definition}
                        onChange={(e) => handleUpdateOutcome(index, outcomeIndex, e.target.value)}
                        placeholder="Enter outcome"
                        className="pr-10"
                      />
                      <div className="absolute right-10 top-1/2 -translate-y-1/2 h-full w-[1px] bg-gray-200" />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveOutcome(index, outcomeIndex)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-red-50 hover:bg-red-100 p-0"
                      >
                        <img src="/delete.svg" alt="delete" className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  onClick={() => handleAddOutcome(index)}
                  variant="link"
                  className="text-brand"
                >
                  + Add Outcome
                </Button>
              </div>
            </div>
          ))}

          {/* Add Specific Objective Button */}
          <Button
            onClick={handleAddSpecificObjective}
            variant="link"
            className="text-brand"
          >
            + Add Specific Objective
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-10 pt-8">
          <Button variant="outline" onClick={onCancel}>
            Back
          </Button>
          <Button
            onClick={handleSave}
            className="bg-brand text-white"
            disabled={!generalObjective || isSubmitting || deleteMutation.isPending}
          >
            {isSubmitting
              ? "Saving..."
              : initialData?.generalObjective?.id
              ? "Update Objectives"
              : "Save Objectives"}
          </Button>
        </div>
      </div>
    </EditFormContainer>
  );
} 