/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { getCookie } from "@curriculum-services/auth"
import { toast } from "sonner"
import { Student } from "./useStudents"

export interface Cohort {
  id: string
  name: string
  description: string
  tags: string[]
  trainingTitle: string
  parentCohortName: string | null
}

export interface CreateCohortData {
  name: string
  description: string
  tags: string[]
  trainingId: string
  cohortId?: string
}

export interface UpdateCohortData {
  name: string
  description: string
  tags: string[]
}

interface CohortsResponse {
  code: string
  totalPages: number
  pageSize: number
  message: string
  currentPage: number
  cohorts: Cohort[]
  totalElements: number
}

interface CohortResponse {
  code: string
  cohort: Cohort
  message: string
}

interface CohortTraineesResponse {
  code: string
  trainees: Student[]
  totalPages: number
  pageSize: number
  message: string
  currentPage: number
  totalElements: number
}

interface CohortQueryParams {
  trainingId: string
  cohortId?: string
  searchQuery?: string
  name?: string
  tags?: string[]
  createdAtFrom?: string
  createdAtTo?: string
  page?: number
  pageSize?: number
}

// Get single cohort by ID
export function useCohort(cohortId: string) {
  return useQuery({
    queryKey: ['cohort', cohortId],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        const response = await axios.get<CohortResponse>(
          `${process.env.NEXT_PUBLIC_API}/cohort/${cohortId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        return response.data.cohort
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || 'Failed to load cohort details')
      }
    },
    enabled: !!cohortId
  })
}

// Get cohorts with query parameters
export function useCohorts(params: CohortQueryParams) {
  return useQuery<CohortsResponse, Error>({
    queryKey: ['cohorts', params],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        
        const url = `${process.env.NEXT_PUBLIC_API}/cohort`
        const queryParams = new URLSearchParams()
        
        // Required parameter
        queryParams.append('training-id', params.trainingId)
        
        // Optional parameters
        if (params.cohortId) queryParams.append('cohort-id', params.cohortId)
        if (params.searchQuery) queryParams.append('search-query', params.searchQuery)
        if (params.name) queryParams.append('name', params.name)
        if (params.tags && params.tags.length > 0) {
          params.tags.forEach(tag => queryParams.append('tags', tag))
        }
        if (params.createdAtFrom) queryParams.append('created-at-from', params.createdAtFrom)
        if (params.createdAtTo) queryParams.append('created-at-to', params.createdAtTo)
        
        // Pagination - ensure page is at least 1
        const pageNumber = Math.max(1, params.page || 1)
        queryParams.append('page', pageNumber.toString())
        
        const pageSize = params.pageSize || 10
        queryParams.append('page-size', pageSize.toString())
        
        const response = await axios.get<CohortsResponse>(
          `${url}?${queryParams.toString()}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        
        return response.data
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Failed to load cohorts'
        console.log("Error fetching cohorts:", error)
        throw new Error(errorMessage)
      }
    },
    enabled: !!params.trainingId,
    retry: 1,
    staleTime: 1000 * 60 * 2, // Cache for 2 minutes
    refetchOnWindowFocus: false,
  })
}

// Get cohort trainees
export function useCohortTrainees(
  cohortId: string, 
  page?: number, 
  pageSize?: number,
  options?: { noCohorts?: boolean }
) {
  return useQuery({
    queryKey: ['cohortTrainees', cohortId, page, pageSize, options?.noCohorts],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        
        let url = `${process.env.NEXT_PUBLIC_API}/cohort/${cohortId}/trainees`
        
        const params = new URLSearchParams()
        if (page !== undefined) params.append('page', Math.max(1, page).toString())
        if (pageSize !== undefined) params.append('pageSize', pageSize.toString())
        if (options?.noCohorts) params.append('no-cohorts', 'true')
        
        if (params.toString()) {
          url += `?${params.toString()}`
        }
        
        const response = await axios.get<CohortTraineesResponse>(
          url,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        
        return response.data
      } catch (error: any) {
        throw new Error(error?.response?.data?.message || 'Failed to load cohort trainees')
      }
    },
    enabled: !!cohortId
  })
}

// Create cohort
export function useCreateCohort() {
  const queryClient = useQueryClient()

  const createCohortMutation = useMutation({
    mutationFn: async (cohortData: CreateCohortData) => {
      const token = getCookie('token')
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/cohort`,
        cohortData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return { responseData: response.data, trainingId: cohortData.trainingId }
    },
    onSuccess: ({ trainingId }) => {
      toast.success('Cohort created successfully')
      queryClient.invalidateQueries({ 
        queryKey: ['cohorts', { trainingId }] 
      })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create cohort')
    }
  })

  return {
    createCohort: createCohortMutation.mutate,
    isLoading: createCohortMutation.isPending
  }
}

// Update cohort
export function useUpdateCohort() {
  const queryClient = useQueryClient()

  const updateCohortMutation = useMutation({
    mutationFn: async ({ 
      cohortId, 
      cohortData,
      trainingId 
    }: { 
      cohortId: string, 
      cohortData: UpdateCohortData,
      trainingId?: string 
    }) => {
      const token = getCookie('token')
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API}/cohort/${cohortId}`,
        cohortData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return { responseData: response.data, cohortId, trainingId }
    },
    onSuccess: ({ cohortId, trainingId }) => {
      toast.success('Cohort updated successfully')
      
      // Invalidate cohort queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey
          return (
            Array.isArray(queryKey) && 
            (queryKey.includes('cohorts') || queryKey.includes(cohortId))
          )
        }
      })
      
      // Also invalidate training-level cohort queries if trainingId is provided
      if (trainingId) {
        queryClient.invalidateQueries({
          queryKey: ['cohorts', { trainingId }]
        })
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update cohort')
    }
  })

  return {
    updateCohort: updateCohortMutation.mutate,
    isLoading: updateCohortMutation.isPending
  }
}

// Add trainees to cohort
export function useAddTraineesToCohort() {
  const queryClient = useQueryClient()
  
  const addTraineesMutation = useMutation({
    mutationFn: async ({ 
      cohortId, 
      traineeIds,
      trainingId 
    }: { 
      cohortId: string, 
      traineeIds: string[],
      trainingId?: string 
    }) => {
      const token = getCookie('token')
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API}/cohort/${cohortId}/add-trainees`,
        { traineeIds },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return { responseData: response.data, cohortId, trainingId }
    },
    onSuccess: ({ cohortId, trainingId }) => {
      toast.success('Trainees added to cohort successfully')
      
      // Invalidate cohort-specific trainee queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey
          return (
            Array.isArray(queryKey) && 
            (queryKey.includes('cohortTrainees') || queryKey.includes(cohortId))
          )
        }
      })
      
      // Also invalidate training-level queries if trainingId is provided
      if (trainingId) {
        queryClient.invalidateQueries({
          queryKey: ['cohorts', { trainingId }]
        })
        queryClient.invalidateQueries({
          queryKey: ['students', trainingId]
        })
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add trainees to cohort')
    }
  })

  return {
    addTrainees: addTraineesMutation.mutate,
    isLoading: addTraineesMutation.isPending
  }
}

// Remove trainees from cohort
export function useRemoveTraineesFromCohort() {
  const queryClient = useQueryClient()
  
  const removeTraineesMutation = useMutation({
    mutationFn: async ({ 
      cohortId, 
      traineeIds,
      trainingId 
    }: { 
      cohortId: string, 
      traineeIds: string[],
      trainingId?: string 
    }) => {
      const token = getCookie('token')
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API}/cohort/${cohortId}/remove-trainees`,
        { traineeIds },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return { responseData: response.data, cohortId, trainingId }
    },
    onSuccess: ({ cohortId, trainingId }) => {
      // toast.success('Trainees removed from cohort successfully')
      
      // Invalidate cohort-specific trainee queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey
          return (
            Array.isArray(queryKey) && 
            (queryKey.includes('cohortTrainees') || queryKey.includes(cohortId))
          )
        }
      })
      
      // Also invalidate training-level queries if trainingId is provided
      if (trainingId) {
        queryClient.invalidateQueries({
          queryKey: ['cohorts', { trainingId }]
        })
        queryClient.invalidateQueries({
          queryKey: ['students', trainingId]
        })
      }
    },
    onError: () => {
      // toast.error(error.response?.data?.message || 'Failed to remove trainees from cohort')
    }
  })

  return {
    removeTrainees: removeTraineesMutation.mutate,
    isLoading: removeTraineesMutation.isPending
  }
}

// Delete cohort
export function useDeleteCohort() {
  const queryClient = useQueryClient()

  const deleteCohortMutation = useMutation({
    mutationFn: async ({ 
      cohortId, 
      trainingId 
    }: { 
      cohortId: string, 
      trainingId?: string 
    }) => {
      const token = getCookie('token')
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API}/cohort/${cohortId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return { responseData: response.data, cohortId, trainingId }
    },
    onSuccess: ({ cohortId, trainingId }) => {
      toast.success('Cohort deleted successfully')
      
      // Invalidate cohort queries
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const queryKey = query.queryKey
          return (
            Array.isArray(queryKey) && 
            (queryKey.includes('cohorts') || queryKey.includes(cohortId))
          )
        }
      })
      
      // Also invalidate training-level cohort queries if trainingId is provided
      if (trainingId) {
        queryClient.invalidateQueries({
          queryKey: ['cohorts', { trainingId }]
        })
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete cohort')
    }
  })

  return {
    deleteCohort: deleteCohortMutation.mutate,
    isLoading: deleteCohortMutation.isPending
  }
}


