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
}

export interface AcademicLevel {
  id: string
  name: string
  description: string
}

export interface Disability {
  id: string
  name: string
  description: string
}

export interface Zone {
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
  city: City
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

export function useStudents(
  trainingId: string, 
  page?: number, 
  pageSize?: number,
  sessionId?: string
) {
  return useQuery({
    queryKey: ['students', trainingId, page, pageSize, sessionId],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        
        // Build URL with query parameters
        let url = `${process.env.NEXT_PUBLIC_API}/trainee/training/${trainingId}`
        
        // Add pagination parameters if provided
        const params = new URLSearchParams()
        if (page !== undefined) params.append('page', page.toString())
        if (pageSize !== undefined) params.append('page-size', pageSize.toString())
        
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
    enabled: !!trainingId
  })
}

export function useAddStudent() {
  // Always fetch countries first
  const { data: countries } = useBaseData('country', {
    enabled: true,
    disablePagination: true
  })
  
  // Fetch all regions, zones, and cities without pagination for client-side filtering
  // This matches the venue form pattern exactly
  const { data: regions } = useBaseData('region', {
    enabled: true,
    disablePagination: true
  })
  
  const { data: zones } = useBaseData('zone', {
    enabled: true,
    disablePagination: true
  })
  
  const { data: cities } = useBaseData('city', {
    enabled: true,
    disablePagination: true
  })
  
  const { data: languages } = useBaseData('language', {
    enabled: true,
    disablePagination: true
  })
  
  const { data: academicLevels } = useBaseData('academic-level', {
    enabled: true,
    disablePagination: true
  })
  
  const { data: disabilities } = useBaseData('disability', {
    enabled: true,
    disablePagination: true
  })
  
  const { data: marginalizedGroups } = useBaseData('marginalized-group', {
    enabled: true,
    disablePagination: true
  })

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
    countries,
    regions,
    zones,
    cities,
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

export function useBulkImportStudentsByName() {
  // Always fetch countries first
  const { data: countries } = useBaseData('country', {
    enabled: true,
    disablePagination: true
  })
  
  // Fetch all regions, zones, and cities without pagination for client-side filtering
  const { data: regions } = useBaseData('region', {
    enabled: true,
    disablePagination: true
  })
  
  const { data: zones } = useBaseData('zone', {
    enabled: true,
    disablePagination: true
  })
  
  const { data: cities } = useBaseData('city', {
    enabled: true,
    disablePagination: true
  })
  
  const { data: languages } = useBaseData('language', {
    enabled: true,
    disablePagination: true
  })
  
  const { data: academicLevels } = useBaseData('academic-level', {
    enabled: true,
    disablePagination: true
  })
  
  const { data: disabilities } = useBaseData('disability', {
    enabled: true,
    disablePagination: true
  })
  
  const { data: marginalizedGroups } = useBaseData('marginalized-group', {
    enabled: true,
    disablePagination: true
  })

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
    isLoading: bulkImportMutation.isPending
  }
}



