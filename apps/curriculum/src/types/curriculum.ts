export interface BaseItem {
  id: string
  name: string
  description: string
  range?: string | null
}

export interface PrerequisiteData {
  languageId: string
  educationLevelId: string
  specificCourseList: string[]
  trainingId: string
  certifications: string
  licenses: string
  workExperienceId: string
  specificPrerequisites: string[]
}

export interface PrerequisiteResponse {
  language?: BaseItem
  educationLevel?: BaseItem
  specificCourseList: string[]
  trainingId: string
  certifications: string
  licenses: string
  workExperience?: BaseItem
  specificPrerequisites: string[]
} 