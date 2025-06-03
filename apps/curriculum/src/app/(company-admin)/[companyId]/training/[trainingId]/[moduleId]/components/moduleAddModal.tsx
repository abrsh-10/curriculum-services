"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBaseData } from "@/lib/hooks/useBaseData"
import { BaseItem } from "@/types/curriculum"

interface ModuleFormData {
  name: string;
  description: string;
  trainingTagId: string;
}

interface ModuleAddModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ModuleFormData) => void
  isLoading?: boolean
  editData?: {
    id: string
    name: string
    description: string
    trainingTag?: {
      id: string
      name: string
      description: string
    } | null
  } | null
  mode?: 'module' | 'submodule'
  preloadedTrainingTags?: BaseItem[]
}

export function ModuleAddModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  isLoading,
  editData,
  mode = 'module',
  preloadedTrainingTags = []
}: ModuleAddModalProps) {
  const [formData, setFormData] = useState<ModuleFormData>({
    name: "",
    description: "",
    trainingTagId: ""
  })

  const [errors, setErrors] = useState({
    name: '',
    description: '',
    trainingTagId: ''
  })

  const [openTrainingTags, setOpenTrainingTags] = useState(false)

  const { data: fetchedTrainingTags, isLoading: isLoadingTags } = useBaseData(
    'training-tag',
    { enabled: isOpen && preloadedTrainingTags.length === 0 }
  )

  const allTrainingTags = preloadedTrainingTags.length > 0 ? preloadedTrainingTags : (fetchedTrainingTags || [])

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: editData?.name || "",
        description: editData?.description || "",
        trainingTagId: editData?.trainingTag?.id || ""
      })
      setErrors({ name: '', description: '', trainingTagId: '' })
    }
  }, [isOpen, editData])

  const handleClose = useCallback(() => {
    setFormData({ name: "", description: "", trainingTagId: "" })
    setErrors({ name: '', description: '', trainingTagId: '' })
    setOpenTrainingTags(false)
    onClose()
  }, [onClose])

  const validateForm = () => {
    const newErrors = {
      name: formData.name.trim() === '' ? 'Name is required' : '',
      description: formData.description.trim() === '' ? 'Description is required' : '',
      trainingTagId: formData.trainingTagId === '' ? 'Training tag is required' : ''
    }
    setErrors(newErrors)
    return !Object.values(newErrors).some(error => error !== '')
  }

  const handleSelectTrainingTag = (tagId: string) => {
    console.log('handleSelectTrainingTag called with tagId:', tagId);
    console.log('Current formData.trainingTagId:', formData.trainingTagId);
    
    setFormData({
      ...formData,
      trainingTagId: tagId
    });

    if (errors.trainingTagId) {
      setErrors(prev => ({ ...prev, trainingTagId: '' }));
    }

    // Close the popover after selection
    setOpenTrainingTags(false);
  }

  const handleSubmit = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (validateForm()) {
      onSubmit(formData)
    }
  }, [formData, onSubmit])

  const getTitle = () => {
    if (editData) {
      return `Edit ${mode === 'submodule' ? 'Sub-Module' : 'Module'}`
    }
    return `Create ${mode === 'submodule' ? 'Sub-Module' : 'Module'}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-w-[350px]">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        <hr className="my-1 -mx-6" />
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{mode === 'submodule' ? 'Sub-Module' : 'Module'} Name</label>
            <Input
              value={formData.name}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, name: e.target.value }));
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              placeholder="type here"
              className={`w-full ${errors.name ? 'border-red-500' : ''}`}
            />
            {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, description: e.target.value }));
                if (errors.description) setErrors(prev => ({ ...prev, description: '' }));
              }}
              placeholder="type here"
              className={`w-full min-h-[100px] ${errors.description ? 'border-red-500' : ''}`}
            />
            {errors.description && <span className="text-red-500 text-sm">{errors.description}</span>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Training Tag</label>
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between py-6"
                onClick={() => setOpenTrainingTags(!openTrainingTags)}
                disabled={isLoadingTags && preloadedTrainingTags.length === 0}
              >
                <div className="flex flex-wrap gap-1 items-center">
                  {formData.trainingTagId ? (
                    <Badge variant="pending" className="rounded-sm text-xs">
                      {allTrainingTags.find((tag: BaseItem) => tag.id === formData.trainingTagId)?.name || 'Unknown tag'}
                    </Badge>
                  ) : (
                    "Select training tag..."
                  )}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
              {openTrainingTags && (
                <div className="absolute z-50 w-full bottom-full mb-1 bg-white rounded-md border shadow-lg">
                  <div className="max-h-[300px] overflow-auto p-1">
                    {allTrainingTags.length > 0 ? (
                      allTrainingTags.map((tag: BaseItem) => (
                        <button
                          key={tag.id}
                          type="button"
                          className={cn(
                            "flex w-full items-center px-4 py-2 text-sm hover:bg-gray-100 rounded",
                            formData.trainingTagId === tag.id && "bg-gray-100"
                          )}
                          onClick={() => {
                            console.log('Tag button clicked:', tag.name);
                            handleSelectTrainingTag(tag.id);
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.trainingTagId === tag.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {tag.name}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">
                        {isLoadingTags ? "Loading tags..." : "No training tags available"}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.trainingTagId && <span className="text-red-500 text-sm">{errors.trainingTagId}</span>}
          </div>
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSubmit}
              className="bg-[#0B75FF] hover:bg-blue-700 text-white px-6"
              disabled={isLoading}
            >
              {isLoading ? `${editData ? 'Updating...' : 'Creating...'}` : editData ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
