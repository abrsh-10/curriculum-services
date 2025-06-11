"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { X, Plus } from "lucide-react"
import { useCreateCohort, useUpdateCohort, Cohort } from "@/lib/hooks/useCohorts"
import { toast } from "sonner"

const cohortSchema = z.object({
  name: z.string().min(1, "Cohort name is required"),
  description: z.string().min(1, "Description is required"),
  tags: z.array(z.string()).optional().default([]),
})

type CohortFormValues = z.infer<typeof cohortSchema>

interface CohortFormProps {
  trainingId: string
  companyId: string
  parentCohortId?: string | null
  cohort?: Cohort | null // For edit mode
  isEditing?: boolean
  onSuccess: () => void
  onCancel: () => void
}

export function CohortForm({ trainingId, companyId, parentCohortId, cohort, isEditing = false, onSuccess, onCancel }: CohortFormProps) {
  const [tagInput, setTagInput] = useState("")
  const { createCohort, isLoading: isCreating } = useCreateCohort()
  const { updateCohort, isLoading: isUpdating } = useUpdateCohort()
  
  const isLoading = isCreating || isUpdating
  
  const form = useForm<CohortFormValues>({
    resolver: zodResolver(cohortSchema),
    defaultValues: {
      name: isEditing && cohort ? cohort.name : "",
      description: isEditing && cohort ? cohort.description : "",
      tags: isEditing && cohort ? cohort.tags : [],
    },
  })
  
  const handleAddTag = () => {
    if (tagInput.trim() && !form.getValues("tags").includes(tagInput.trim())) {
      const currentTags = form.getValues("tags")
      form.setValue("tags", [...currentTags, tagInput.trim()])
      setTagInput("")
    }
  }
  
  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = form.getValues("tags")
    form.setValue("tags", currentTags.filter(tag => tag !== tagToRemove))
  }
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleAddTag()
    }
  }
  
  const onSubmit = (values: CohortFormValues) => {
    if (isEditing && cohort) {
      // Update existing cohort
      const cohortData = {
        name: values.name,
        description: values.description,
        tags: values.tags,
      }
      
      updateCohort({
        cohortId: cohort.id,
        cohortData,
        trainingId
      }, {
        onSuccess: () => {
          toast.success("Cohort updated successfully")
          onSuccess()
        },
        onError: (error) => {
          toast.error("Failed to update cohort")
          console.error(error)
        }
      })
    } else {
      // Create new cohort
      const cohortData = {
        name: values.name,
        description: values.description,
        tags: values.tags,
        trainingId,
        ...(parentCohortId && { cohortId: parentCohortId })
      }
      
      createCohort(cohortData, {
        onSuccess: () => {
          toast.success(parentCohortId ? "Sub-cohort created successfully" : "Cohort created successfully")
          onSuccess()
        },
        onError: (error) => {
          toast.error("Failed to create cohort")
          console.error(error)
        }
      })
    }
  }
  
  return (
    <div className="relative">
      <ScrollArea className="h-[65vh] md:h-[65vh] pr-4">
        <div className="px-4 py-2 pb-24">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-[#292827]">
                      {parentCohortId ? "Sub-Cohort Name" : "Cohort Name"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={`Enter ${parentCohortId ? "sub-cohort" : "cohort"} name`}
                        className="bg-white border-[#E4E4E4]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-[#292827]">
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter description"
                        className="bg-white border-[#E4E4E4] min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-[#292827]">
                      Tags (Optional)
                    </FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {/* Tag Input */}
                        <div className="border border-[#E4E4E4] rounded-md p-3 bg-white min-h-[120px]">
                          <div className="flex flex-wrap gap-2 mb-3">
                            {field.value.map((tag, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="bg-[#ECF4FF] text-[#0B75FF] hover:bg-[#DCE9FF] px-3 py-1.5 text-xs font-medium border border-[#B8DDFF] flex items-center gap-1.5"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTag(tag)}
                                  className="hover:text-red-500 transition-colors"
                                  title={`Remove ${tag} tag`}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                            {field.value.length === 0 && (
                              <span className="text-[#667085] text-sm italic">No tags added yet</span>
                            )}
                          </div>
                          
                          {/* Add Tag Input */}
                          <div className="flex gap-2 pt-2 border-t border-[#F0F0F0]">
                            <Input
                              placeholder="Type a tag"
                              value={tagInput}
                              onChange={(e) => setTagInput(e.target.value)}
                              onKeyPress={handleKeyPress}
                              className="flex-1 h-9 text-sm border-[#E4E4E4] focus:border-[#0B75FF] focus:ring-1 focus:ring-[#0B75FF]"
                            />
                            <Button
                              type="button"
                              onClick={handleAddTag}
                              disabled={!tagInput.trim()}
                              size="sm"
                              className="h-9 px-3 bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white flex items-center gap-1"
                            >
                              <Plus className="h-3 w-3" />
                              Add
                            </Button>
                          </div>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
      </ScrollArea>

      {/* Fixed footer */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t p-4 flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          className="border-[#E4E4E4] text-[#565555]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          onClick={form.handleSubmit(onSubmit)}
          disabled={isLoading}
          className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white"
        >
          {isLoading ? (isEditing ? "Updating..." : "Creating...") : (isEditing ? "Update Cohort" : `Create ${parentCohortId ? "Sub-Cohort" : "Cohort"}`)}
        </Button>
      </div>
    </div>
  )
} 