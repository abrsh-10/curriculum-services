/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { getCookie } from "@curriculum-services/auth"
import { toast } from "sonner"
import { useBaseData } from "./useBaseData"

export interface City {
  id: string
  name: string
  description: string
  zone?: {
    id: string
    name: string
    description: string
    region: {
      id: string
      name: string
      description: string
      country: {
        id: string
        name: string
        description: string
      }
    }
  }
}

export interface Language {
  id: string
  name: string
  description: string
  alternateNames?: {
    [key: string]: string
  }
}

export interface AcademicLevel {
  id: string
  name: string
  description: string
  alternateNames?: {
    [key: string]: string
  }
}

export interface Disability {
  id: string
  name: string
  description: string
  alternateNames?: {
    [key: string]: string
  }
}

export interface Region {
  id: string
  name: string
  description: string
  alternateNames?: {
    [key: string]: string
  }
  country: {
    id: string
    name: string
    description: string
    alternateNames?: {
      [key: string]: string
    }
  }
}

export interface Zone {
  id: string
  name: string
  description: string
  alternateNames?: {
    [key: string]: string
  }
  region: {
    id: string
    name: string
    description: string
    alternateNames?: {
      [key: string]: string
    }
    country: {
      id: string
      name: string
      description: string
      alternateNames?: {
        [key: string]: string
      }
    }
  }
}

export interface Student {
  id: string
  firstName: string
  middleName: string | null
  lastName: string
  email: string
  contactPhone: string
  dateOfBirth: string
  gender: string
  zone: Zone | null
  city: City | null
  woreda: string
  houseNumber: string
  language: Language
  academicLevel: AcademicLevel
  fieldOfStudy: string
  hasSmartphone: boolean
  hasTrainingExperience: boolean
  trainingExperienceDescription: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
  disabilities: Disability[]
  marginalizedGroups: any[]
  // New fields after leyu pending trainees
  didSignConsentForm: boolean | null
  consentFormUrl: string | null
  pendingTraineeId: string | null
  idType: string | null
  frontIdUrl: string | null
  backIdUrl: string | null
  signatureUrl: string | null
  certificateUrl: string | null
  certificateSmsSent: boolean
  selfRegistered: boolean
  cohortName:string
}

export interface CreateStudentData {
  firstName: string
  middleName?: string
  lastName: string
  email: string
  contactPhone: string
  dateOfBirth: string
  gender: "MALE" | "FEMALE" 
  zoneId: string
  cityId: string
  woreda: string
  houseNumber: string
  languageId: string
  academicLevelId: string
  fieldOfStudy: string
  hasSmartphone: boolean
  hasTrainingExperience: boolean
  trainingExperienceDescription?: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
  disabilityIds?: string[]
  marginalizedGroupIds?: string[]
}

export interface CreateStudentByNameData {
  firstName: string
  middleName?: string
  lastName: string
  email: string
  contactPhone: string
  dateOfBirth: string
  gender?: "MALE" | "FEMALE" 
  countryName: string
  regionName: string
  zoneName: string
  cityName?: string
  woreda: string
  houseNumber: string
  languageName: string
  academicLevelName: string
  fieldOfStudy: string
  hasSmartphone: boolean
  hasTrainingExperience: boolean
  trainingExperienceDescription?: string
  emergencyContactName: string
  emergencyContactPhone: string
  emergencyContactRelationship: string
  disabilityNames?: string[]
  marginalizedGroupNames?: string[]
}

interface StudentsResponse {
  code: string
  trainees: Student[]
  totalPages: number
  pageSize: number
  message: string
  currentPage: number
  totalElements: number
}

interface StudentResponse {
  code: string
  trainee: Student
  message: string
}

// Helper function to add +251 prefix to phone numbers if not already present
const addPhonePrefix = (phone: string): string => {
  if (!phone) return phone
  // If phone already has a + prefix, return as is
  if (phone.startsWith('+')) return phone
  // If phone starts with 251, add the + prefix
  if (phone.startsWith('251')) return `+${phone}`
  // If phone starts with 0, replace 0 with +251
  if (phone.startsWith('0')) return `+251${phone.substring(1)}`
  // Otherwise add +251 prefix
  return `+251${phone}`
}

export interface StudentFilters {
  genders?: string[]
  languageIds?: string[]
  academicLevelIds?: string[]
  zoneIds?: string[]
  // Age filters
  ageAbove?: number
  ageBelow?: number
  // Consent form filter
  hasConsentForm?: boolean
  // Cohort filters
  cohortIds?: string[]
  // Attendance filters
  attendancePercentageAbove?: number
  attendancePercentageBelow?: number
  // Survey filters
  hasFilledBaselineSurvey?: boolean
  hasFilledEndlineSurvey?: boolean
  // Assessment filters
  hasPreAssessmentAttempt?: boolean
  hasPostAssessmentAttempt?: boolean
  preAssessmentScoreAbove?: number
  preAssessmentScoreBelow?: number
  postAssessmentScoreAbove?: number
  postAssessmentScoreBelow?: number
  // Commented out for now - can be enabled later
  // disabilityIds?: string[]
  // marginalizedGroupIds?: string[]
  // hasSmartphone?: boolean
  // hasTrainingExperience?: boolean
  // Certificate filters
  isCertified?: boolean
  isCertificateSmsSent?: boolean
  // Edge sync filters
  isCreationSyncedWithEdge?: boolean
  isEnrollmentSyncedWithEdge?: boolean
  isPreAssessmentSyncedWithEdge?: boolean
  isPostAssessmentSyncedWithEdge?: boolean
  // Completion sync filter
  isCompletionSyncedWithEdge?: boolean
  // Edge relative date filter (single date, not range)
  relativeDate?: string
}

export function useStudents(
  trainingId: string, 
  page?: number, 
  pageSize?: number,
  sessionId?: string,
  noCohorts?: boolean,
  search?: string,
  filters?: StudentFilters
) {
  return useQuery({
    queryKey: ['students', trainingId, page, pageSize, sessionId, noCohorts, search, filters],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        
        // Build URL with query parameters
        let url = `${process.env.NEXT_PUBLIC_API}/trainee/training/${trainingId}`
        
        // Add pagination parameters if provided
        const params = new URLSearchParams()
        if (page !== undefined) params.append('page', page.toString())
        if (pageSize !== undefined) params.append('page-size', pageSize.toString())
        if (noCohorts !== undefined) params.append('no-cohorts', noCohorts.toString())
        if (search !== undefined && search.trim() !== '') params.append('search-query', search.trim())
        
        // Add filter parameters
        if (filters) {
          if (filters.genders && filters.genders.length > 0) {
            filters.genders.forEach(gender => params.append('gender', gender))
          }
          if (filters.languageIds && filters.languageIds.length > 0) {
            filters.languageIds.forEach(languageId => params.append('language-ids', languageId))
          }
          if (filters.academicLevelIds && filters.academicLevelIds.length > 0) {
            filters.academicLevelIds.forEach(levelId => params.append('academic-level-ids', levelId))
          }
          if (filters.zoneIds && filters.zoneIds.length > 0) {
            filters.zoneIds.forEach(zoneId => params.append('zone-ids', zoneId))
          }
          
          // Age filters
          if (filters.ageAbove !== undefined) {
            params.append('age-above', filters.ageAbove.toString())
          }
          if (filters.ageBelow !== undefined) {
            params.append('age-below', filters.ageBelow.toString())
          }
          
          // Consent form filter
          if (filters.hasConsentForm !== undefined) {
            params.append('has-consent-form', filters.hasConsentForm.toString())
          }
          
          // Cohort filters
          if (filters.cohortIds && filters.cohortIds.length > 0) {
            filters.cohortIds.forEach(cohortId => params.append('cohort-ids', cohortId))
          }
          
          // Attendance filters
          if (filters.attendancePercentageAbove !== undefined) {
            params.append('attendance-percentage-above', filters.attendancePercentageAbove.toString())
          }
          if (filters.attendancePercentageBelow !== undefined) {
            params.append('attendance-percentage-below', filters.attendancePercentageBelow.toString())
          }
          
          // Survey filters
          if (filters.hasFilledBaselineSurvey !== undefined) {
            params.append('has-filled-baseline-survey', filters.hasFilledBaselineSurvey.toString())
          }
          if (filters.hasFilledEndlineSurvey !== undefined) {
            params.append('has-filled-endline-survey', filters.hasFilledEndlineSurvey.toString())
          }
          
          // Assessment filters
          if (filters.hasPreAssessmentAttempt !== undefined) {
            params.append('has-pre-assessment-attempt', filters.hasPreAssessmentAttempt.toString())
          }
          if (filters.hasPostAssessmentAttempt !== undefined) {
            params.append('has-post-assessment-attempt', filters.hasPostAssessmentAttempt.toString())
          }
          if (filters.preAssessmentScoreAbove !== undefined) {
            params.append('pre-assessment-score-above', filters.preAssessmentScoreAbove.toString())
          }
          if (filters.preAssessmentScoreBelow !== undefined) {
            params.append('pre-assessment-score-below', filters.preAssessmentScoreBelow.toString())
          }
          if (filters.postAssessmentScoreAbove !== undefined) {
            params.append('post-assessment-score-above', filters.postAssessmentScoreAbove.toString())
          }
          if (filters.postAssessmentScoreBelow !== undefined) {
            params.append('post-assessment-score-below', filters.postAssessmentScoreBelow.toString())
          }

          // Certificate filters
          if (filters.isCertified !== undefined) {
            params.append('is-certified', filters.isCertified.toString())
          }
          if (filters.isCertificateSmsSent !== undefined) {
            params.append('is-certificate-sms-sent', filters.isCertificateSmsSent.toString())
          }

          // Edge sync filters
          if (filters.isCreationSyncedWithEdge !== undefined) {
            params.append('is-creation-synced-with-edge', filters.isCreationSyncedWithEdge.toString())
          }
          if (filters.isEnrollmentSyncedWithEdge !== undefined) {
            params.append('is-enrollment-synced-with-edge', filters.isEnrollmentSyncedWithEdge.toString())
          }
          if (filters.isPreAssessmentSyncedWithEdge !== undefined) {
            params.append('is-pre-assessment-synced-with-edge', filters.isPreAssessmentSyncedWithEdge.toString())
          }
          if (filters.isPostAssessmentSyncedWithEdge !== undefined) {
            params.append('is-post-assessment-synced-with-edge', filters.isPostAssessmentSyncedWithEdge.toString())
          }
          if (filters.isCompletionSyncedWithEdge !== undefined) {
            params.append('is-completion-synced-with-edge', filters.isCompletionSyncedWithEdge.toString())
          }
          // Edge relative date filter
          if (filters.relativeDate !== undefined) {
            params.append('relative-date', filters.relativeDate)
          }
          
          // Commented out for now - can be enabled later
          // if (filters.disabilityIds && filters.disabilityIds.length > 0) {
          //   filters.disabilityIds.forEach(disabilityId => params.append('disability-id', disabilityId))
          // }
          // if (filters.marginalizedGroupIds && filters.marginalizedGroupIds.length > 0) {
          //   filters.marginalizedGroupIds.forEach(groupId => params.append('marginalized-group-id', groupId))
          // }
          // if (filters.hasSmartphone !== undefined) {
          //   params.append('has-smartphone', filters.hasSmartphone.toString())
          // }
          // if (filters.hasTrainingExperience !== undefined) {
          //   params.append('has-training-experience', filters.hasTrainingExperience.toString())
          // }
        }
        
        // Append query parameters if any exist
        if (params.toString()) {
          url += `?${params.toString()}`
        }
        
        const response = await axios.get<StudentsResponse>(
          url,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        
        return response.data
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || 'Failed to load students')
      }
    },
    enabled: !!trainingId,
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: false,
  })
}

export function useAddStudent() {
  // Fetch non-location base data with reasonable pagination
  const { data: languages } = useBaseData('language', {
    enabled: true,
    page: 1,
    pageSize: 200 // Increased to match bulk import requirements
  })
  
  const { data: academicLevels } = useBaseData('academic-level', {
    enabled: true,
    page: 1,
    pageSize: 50 // Increased for better coverage
  })
  
  const { data: disabilities } = useBaseData('disability', {
    enabled: true,
    page: 1,
    pageSize: 100 // Increased to match bulk import for consistency
  })
  
  const { data: marginalizedGroups } = useBaseData('marginalized-group', {
    enabled: true,
    page: 1,
    pageSize: 100 // Increased to match bulk import for consistency
  })

  // Location data will be handled by cascading location hook in components

  // Get query client instance
  const queryClient = useQueryClient()

  // Mutation for adding a student to a training
  const addStudentMutation = useMutation({
    mutationFn: async ({ 
      trainingId, 
      studentData 
    }: { 
      trainingId: string, 
      studentData: CreateStudentData 
    }) => {
      const token = getCookie('token')
      
      // Add +251 prefix to phone numbers if not already present
      const processedData = {
        ...studentData,
        contactPhone: addPhonePrefix(studentData.contactPhone),
        emergencyContactPhone: addPhonePrefix(studentData.emergencyContactPhone)
      }
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/trainee/training/${trainingId}`,
        processedData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return { responseData: response.data, trainingId }
    },
    onSuccess: ({ trainingId }) => {
      toast.success('Student added successfully')
      queryClient.invalidateQueries({ queryKey: ['students', trainingId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add student')
    }
  })

  return {
    languages,
    academicLevels,
    disabilities,
    marginalizedGroups,
    addStudent: addStudentMutation.mutate,
    isLoading: addStudentMutation.isPending
  }
}

export function useStudentById(id: string) {
  return useQuery({
    queryKey: ['student', id],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        const response = await axios.get<StudentResponse>(
          `${process.env.NEXT_PUBLIC_API}/trainee/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        return response.data
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || 'Failed to load student')
      }
    },
    enabled: !!id
  })
}

export function useDeleteStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const token = getCookie('token')
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API}/trainee/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return response.data
    },
    onSuccess: () => {
      toast.success('Student deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete student')
    }
  })
}

export function useBulkDeleteStudents() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (traineeIds: string[]) => {
      const token = getCookie('token')
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API}/trainee/bulk`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { traineeIds }
        }
      )
      return response.data
    },
    onSuccess: (data, traineeIds) => {
      const count = traineeIds.length
      toast.success(`${count} student${count > 1 ? 's' : ''} deleted successfully`)
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete students')
    }
  })
}

export function useUploadConsentForm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      consentFormFile 
    }: { 
      id: string, 
      consentFormFile: File 
    }) => {
      const token = getCookie('token')
      
      // Create form data for the file upload
      const formData = new FormData()
      formData.append('consent-form-photo', consentFormFile)
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/trainee/${id}/consent-form`,
        formData,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      )
      return { responseData: response.data, id }
    },
    onSuccess: ({ id }) => {
      toast.success('Consent form uploaded successfully')
      queryClient.invalidateQueries({ queryKey: ['student', id] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      // Also invalidate cohortTrainees to update the attendance view
      queryClient.invalidateQueries({ queryKey: ['cohortTrainees'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload consent form')
    }
  })
}

export function useDeleteConsentForm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const token = getCookie('token')
      
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API}/trainee/${id}/consent-form`,
        {
          headers: { 
            Authorization: `Bearer ${token}`
          }
        }
      )
      return { responseData: response.data, id }
    },
    onSuccess: ({ id }) => {
      toast.success('Consent form deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['student', id] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      // Also invalidate cohortTrainees to update the attendance view
      queryClient.invalidateQueries({ queryKey: ['cohortTrainees'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete consent form')
    }
  })
}

export function useUpdateStudent() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      id, 
      studentData 
    }: { 
      id: string, 
      studentData: Partial<CreateStudentData> 
    }) => {
      const token = getCookie('token')
      
      // Process phone numbers if they exist in the update data
      const processedData = { ...studentData }
      if (processedData.contactPhone) {
        processedData.contactPhone = addPhonePrefix(processedData.contactPhone)
      }
      if (processedData.emergencyContactPhone) {
        processedData.emergencyContactPhone = addPhonePrefix(processedData.emergencyContactPhone)
      }
      
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API}/trainee/${id}`,
        processedData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return { responseData: response.data, id }
    },
    onSuccess: ({ id }) => {
      toast.success('Student updated successfully')
      queryClient.invalidateQueries({ queryKey: ['student', id] })
      queryClient.invalidateQueries({ queryKey: ['students'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update student')
    }
  })
}

export function useBulkImportStudents() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      trainingId, 
      studentsData 
    }: { 
      trainingId: string, 
      studentsData: CreateStudentData[] 
    }) => {
      const token = getCookie('token')
      
      // Process phone numbers for all students
      const processedData = studentsData.map(studentData => ({
        ...studentData,
        contactPhone: addPhonePrefix(studentData.contactPhone),
        emergencyContactPhone: addPhonePrefix(studentData.emergencyContactPhone)
      }))
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/trainee/bulk/training/${trainingId}`,
        processedData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return { responseData: response.data, trainingId }
    },
    onSuccess: ({ trainingId }) => {
      toast.success('Students imported successfully')
      queryClient.invalidateQueries({ queryKey: ['students', trainingId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to import students')
    }
  })
}

export function useBulkImportStudentsByName(enabled: boolean = true) {
  // Fetch countries (always needed for CSV validation)
  // Use large page size instead of disablePagination to ensure we get all data
  // Add staleTime to prevent refetching on every component mount
  const countriesQuery = useBaseData('country', {
    enabled,
    page: 1,
    pageSize: 1000 // Reduced from 10000 - most countries won't exceed this
  })
  
  // Fetch all regions, zones, and cities without pagination for client-side filtering
  // Only fetch when CSV import view is open to avoid unnecessary API calls
  // Note: These endpoints return nested data (region includes country, zone includes region, etc.)
  const regionsQuery = useBaseData('region', {
    enabled,
    page: 1,
    pageSize: 1000 // Reduced from 10000
  })
  
  const zonesQuery = useBaseData('zone', {
    enabled,
    page: 1,
    pageSize: 2000 // Reduced from 10000
  })
  
  const citiesQuery = useBaseData('city', {
    enabled,
    page: 1,
    pageSize: 3000 // Reduced from 10000 - most relevant use cases won't exceed this
  })
  
  const languagesQuery = useBaseData('language', {
    enabled,
    page: 1,
    pageSize: 200 // Reduced from 10000
  })
  
  const academicLevelsQuery = useBaseData('academic-level', {
    enabled,
    page: 1,
    pageSize: 50 // Reduced from 10000
  })
  
  const disabilitiesQuery = useBaseData('disability', {
    enabled,
    page: 1,
    pageSize: 100 // Reduced from 10000
  })
  
  const marginalizedGroupsQuery = useBaseData('marginalized-group', {
    enabled,
    page: 1,
    pageSize: 100 // Reduced from 10000
  })
  
  // Wrap data in objects with .data property for CSVImportView
  const countries = countriesQuery.data ? { data: countriesQuery.data } : null
  const regions = regionsQuery.data ? { data: regionsQuery.data } : null
  const zones = zonesQuery.data ? { data: zonesQuery.data } : null
  const cities = citiesQuery.data ? { data: citiesQuery.data } : null
  const languages = languagesQuery.data ? { data: languagesQuery.data } : null
  const academicLevels = academicLevelsQuery.data ? { data: academicLevelsQuery.data } : null
  const disabilities = disabilitiesQuery.data ? { data: disabilitiesQuery.data } : null
  const marginalizedGroups = marginalizedGroupsQuery.data ? { data: marginalizedGroupsQuery.data } : null

  const queryClient = useQueryClient()

  const bulkImportMutation = useMutation({
    mutationFn: async ({ 
      trainingId, 
      studentsData 
    }: { 
      trainingId: string, 
      studentsData: CreateStudentByNameData[] 
    }) => {
      const token = getCookie('token')
      
      // Process phone numbers for all students
      const processedData = studentsData.map(studentData => ({
        ...studentData,
        contactPhone: addPhonePrefix(studentData.contactPhone),
        emergencyContactPhone: addPhonePrefix(studentData.emergencyContactPhone)
      }))
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/trainee/bulk-name/training/${trainingId}`,
        processedData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return { responseData: response.data, trainingId }
    },
    onSuccess: ({ trainingId }) => {
      toast.success('Students imported successfully')
      queryClient.invalidateQueries({ queryKey: ['students', trainingId] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to import students')
    }
  })

  return {
    countries,
    regions,
    zones,
    cities,
    languages,
    academicLevels,
    disabilities,
    marginalizedGroups,
    bulkImportByName: bulkImportMutation.mutate,
    bulkImportByNameAsync: bulkImportMutation.mutateAsync,
    isLoading: bulkImportMutation.isPending
  }
}






