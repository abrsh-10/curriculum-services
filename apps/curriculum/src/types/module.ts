export interface Module {
  id: string
  name: string
  description: string
  trainingTag?: {
    id: string
    name: string
    description: string
  } | null
}

export interface ModulesResponse {
  code: string
  message: string
  modules: Module[]
}

export interface CreateModuleData {
  name: string
  description: string
  trainingId: string
  moduleId?: string
  trainingTagId: string
} 


export interface ModuleInformationData {
  moduleId?: string
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