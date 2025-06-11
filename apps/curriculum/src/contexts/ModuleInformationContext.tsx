/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { useSubmitModuleInformation, useGetModuleInformation } from "@/lib/hooks/useModuleInformation"
import { Loading } from "@/components/ui/loading"
import { useReferences } from "@/lib/hooks/useReferences"
import { useAppendices } from "@/lib/hooks/useAppendices"

interface ModuleInformationData {
  keyConcepts: string
  primaryMaterials: string[]
  secondaryMaterials: string[]
  digitalTools: string[]
  instructionMethodIds: string[]
  differentiationStrategies: string
  technologyIntegrationId: string
  technologyIntegrationDescription: string
  inclusionStrategy: string
  teachingStrategy: string
  duration: number
  durationType: 'DAYS' | 'WEEKS' | 'MONTHS' | 'HOURS' | 'MINUTES'
}

interface ModuleProfile {
  moduleId: string
  keyConcepts: string
  primaryMaterials: string[]
  secondaryMaterials: string[]
  digitalTools: string[]
  instructionMethods: Array<{
    id: string
    name: string
    description: string
  }>
  differentiationStrategies: string
  technologyIntegration: {
    id: string
    name: string
    description: string
  }
  technologyIntegrationDescription: string
  inclusionStrategy: string
  teachingStrategy: string
  duration: number
  durationType: 'DAYS' | 'WEEKS' | 'MONTHS' | 'HOURS' | 'MINUTES'
}

interface ModuleResponse {
  code: string
  message: string
  moduleProfile?: ModuleProfile
}

interface ModuleInformationContextType {
  formData: ModuleInformationData
  updateFormData: (field: keyof ModuleInformationData, value: any) => void
  submitForm: () => Promise<void>
  hasModuleInformation: boolean
  hasReferences: boolean
  hasAppendices: boolean
  isLoadingReferences: boolean
  isLoadingAppendices: boolean
}

const ModuleInformationContext = createContext<ModuleInformationContextType | null>(null)

const initialFormData: ModuleInformationData = {
  keyConcepts: '',
  primaryMaterials: [''],
  secondaryMaterials: [''],
  digitalTools: [''],
  instructionMethodIds: [],
  differentiationStrategies: '',
  technologyIntegrationId: '',
  technologyIntegrationDescription: '',
  inclusionStrategy: '',
  teachingStrategy: '',
  duration: 0,
  durationType: 'DAYS'
}

export function ModuleInformationProvider({ children, moduleId }: { children: ReactNode, moduleId: string }) {
  const [formData, setFormData] = useState<ModuleInformationData>(initialFormData)
  const { mutateAsync: submitModuleInformation } = useSubmitModuleInformation(moduleId)
  const { data: existingData, isLoading: isLoadingModuleInfo } = useGetModuleInformation(moduleId)
  
  // Use moduleId for references and appendices hooks since the API has been updated
  const { 
    data: referencesData, 
    isLoading: isLoadingReferences 
  } = useReferences(moduleId);
  
  const { 
    data: appendicesData, 
    isLoading: isLoadingAppendices 
  } = useAppendices(moduleId);

  // Improved implementation for hasReferences and hasAppendices
  const hasReferences = Boolean(referencesData?.references && referencesData.references.length > 0);
  const hasAppendices = Boolean(appendicesData?.appendices && appendicesData.appendices.length > 0);

  // Determine if we have module information based on existing data
  const hasModuleInformation = Boolean(
    existingData && (
      existingData.keyConcepts || 
      existingData.primaryMaterials?.some(material => material.trim() !== '') ||
      existingData.instructionMethodIds?.length > 0 ||
      existingData.technologyIntegrationId ||
      existingData.teachingStrategy ||
      existingData.duration > 0
    )
  );

  useEffect(() => {
    if (existingData) {
      setFormData(existingData)
    }
  }, [existingData])

  const updateFormData = (field: keyof ModuleInformationData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const submitForm = async () => {
    await submitModuleInformation(formData)
  }

  if (isLoadingModuleInfo || isLoadingReferences || isLoadingAppendices) {
    return <Loading />
  }

  return (
    <ModuleInformationContext.Provider value={{ 
      formData, 
      updateFormData, 
      submitForm,
      hasModuleInformation,
      hasReferences,
      hasAppendices,
      isLoadingReferences,
      isLoadingAppendices
    }}>
      {children}
    </ModuleInformationContext.Provider>
  )
}

export const useModuleInformation = () => {
  const context = useContext(ModuleInformationContext)
  if (!context) throw new Error('useModuleInformation must be used within ModuleInformationProvider')
  return context
} 