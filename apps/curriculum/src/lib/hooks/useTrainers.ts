/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { getCookie } from "@curriculum-services/auth"
import { toast } from "sonner"
import { useBaseData } from "./useBaseData"

// --- Reusable Interfaces (Consider moving to a common types file if used elsewhere) ---
export interface Language {
  id: string
  name: string
  description?: string // Make optional if not always present
}

export interface AcademicLevel {
  id: string
  name: string
  description?: string // Make optional if not always present
}

export interface TrainingTag {
  id: string;
  name: string;
  description?: string; // Make optional if not always present
}

// --- Trainer Specific Interfaces ---
export interface Trainer {
  id: string
  firstName: string
  lastName: string
  faydaId?: string
  email: string
  phoneNumber: string
  gender: "MALE" | "FEMALE" | "OTHER" // Assuming based on student type
  dateOfBirth: string // Assuming string format like 'YYYY-MM-DD'
  language: Language
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
  city?: {
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
  woreda?: string
  houseNumber?: string
  location: string // Assuming string, adjust if it's an object
  academicLevel: AcademicLevel
  trainingTags: TrainingTag[]
  experienceYears: number
  coursesTaught: string[]
  certifications: string[]
}

interface TrainersResponse {
  code: string
  message: string
  trainers: Trainer[]
  // Assuming pagination fields might be present based on useStudents & query params
  totalPages?: number
  pageSize?: number
  currentPage?: number
  totalElements?: number
}

export interface CreateTrainerData {
  firstName: string
  lastName: string
  faydaId: string
  email: string
  phoneNumber: string
  gender: "MALE" | "FEMALE" | "OTHER"
  dateOfBirth: string // e.g., "2025-04-21"
  languageId: string
  zoneId: string
  cityId: string
  woreda: string
  houseNumber: string
  location: string
  academicLevelId: string
  trainingTagIds?: string[] // Optional based on example
  experienceYears: number
  coursesTaught?: string[] // Optional based on example
  certifications?: string[] // Optional based on example
}


// --- Hook for Fetching Trainers ---
export function useTrainers(
  page?: number,
  pageSize?: number
) {
  return useQuery({
    // Include page and pageSize in queryKey for proper caching
    queryKey: ['trainers', page, pageSize],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        // Build URL with query parameters
        let url = `${process.env.NEXT_PUBLIC_API}/trainer`
        const params = new URLSearchParams()
        if (page !== undefined) params.append('page', page.toString())
        if (pageSize !== undefined) params.append('page-size', pageSize.toString())

        if (params.toString()) {
          url += `?${params.toString()}`
        }

        const response = await axios.get<TrainersResponse>(url, {
          headers: { Authorization: `Bearer ${token}` }
        })

        // Return the whole response data including potential pagination info
        return response.data
      } catch (error: any) {
        console.log("Error fetching trainers:", error)
        throw new Error(error?.response?.data?.message || 'Failed to load trainers')
      }
    },
    // Keep data fresh for a certain time or disable refetch on window focus if needed
    // staleTime: 5 * 60 * 1000, // e.g., 5 minutes
    // refetchOnWindowFocus: false,
  })
}


// --- Hook for Adding a Trainer ---
export function useAddTrainer() {
  const { data: languages } = useBaseData('language')
  const { data: academicLevels } = useBaseData('academic-level')
  const { data: trainingTags } = useBaseData('training-tag')

  const queryClient = useQueryClient()

  const addTrainerMutation = useMutation({
    mutationFn: async (trainerData: CreateTrainerData) => {
      const token = getCookie('token')
      if (!token) {
        throw new Error('No authentication token found')
      }
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/trainer`,
        trainerData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return response.data
    },
    onSuccess: (data) => {
      toast.success('Trainer added successfully')
      // Invalidate all trainer-related queries
      queryClient.invalidateQueries({ queryKey: ['trainers'] })
      // Add the new trainer to the cache
      queryClient.setQueryData(['trainer', data.trainer.id], data)
    },
    onError: (error: any) => {
      console.log("Error adding trainer:", error)
      toast.error(error.response?.data?.message || 'Failed to add trainer')
    }
  })

  return {
    languages,
    academicLevels,
    trainingTags,
    addTrainer: addTrainerMutation.mutate,
    addTrainerAsync: addTrainerMutation.mutateAsync,
    isLoading: addTrainerMutation.isPending,
    isSuccess: addTrainerMutation.isSuccess,
    isError: addTrainerMutation.isError,
    error: addTrainerMutation.error,
  }
}

// --- Hook for Fetching a Single Trainer by ID ---
export function useTrainerById(id: string) {
  return useQuery({
    queryKey: ['trainer', id],
    queryFn: async () => {
      try {
        const token = getCookie('token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        const response = await axios.get<{ code: string; message: string; trainer: Trainer }>(
          `${process.env.NEXT_PUBLIC_API}/trainer/${id}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )

        return response.data
      } catch (error: any) {
        console.log("Error fetching trainer:", error)
        throw new Error(error?.response?.data?.message || 'Failed to load trainer')
      }
    },
  })
}

// --- Hook for Updating a Trainer ---
export function useUpdateTrainer() {
  const queryClient = useQueryClient()

  const updateTrainerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateTrainerData }) => {
      const token = getCookie('token')
      if (!token) {
        throw new Error('No authentication token found')
      }
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API}/trainer/${id}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return response.data
    },
    onSuccess: (data, variables) => {
      toast.success('Trainer updated successfully')
      // Invalidate all trainer list queries
      queryClient.invalidateQueries({ queryKey: ['trainers'] })
      // Update the individual trainer in the cache
      queryClient.setQueryData(['trainer', variables.id], data)
      // Invalidate any queries that might depend on this trainer
      queryClient.invalidateQueries({ queryKey: ['trainer', variables.id], exact: false })
    },
    onError: (error: any) => {
      console.log("Error updating trainer:", error)
      toast.error(error.response?.data?.message || 'Failed to update trainer')
    }
  })

  return {
    updateTrainer: updateTrainerMutation.mutate,
    updateTrainerAsync: updateTrainerMutation.mutateAsync,
    isLoading: updateTrainerMutation.isPending,
    isSuccess: updateTrainerMutation.isSuccess,
    isError: updateTrainerMutation.isError,
    error: updateTrainerMutation.error,
  }
}

// --- Hook for Deleting a Trainer ---
export function useDeleteTrainer() {
  const queryClient = useQueryClient()

  const deleteTrainerMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = getCookie('token')
      if (!token) {
        throw new Error('No authentication token found')
      }
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API}/trainer/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return response.data
    },
    onSuccess: (_, id) => {
      toast.success('Trainer deleted successfully')
      // Remove the trainer from individual cache
      queryClient.removeQueries({ queryKey: ['trainer', id] })
      // Invalidate all trainer list queries to refetch
      queryClient.invalidateQueries({ queryKey: ['trainers'] })
      // Invalidate any queries that might depend on this trainer
      queryClient.invalidateQueries({ queryKey: ['trainer'], exact: false })
    },
    onError: (error: any) => {
      console.log("Error deleting trainer:", error)
      toast.error(error.response?.data?.message || 'Failed to delete trainer')
    }
  })

  return {
    deleteTrainer: deleteTrainerMutation.mutate,
    deleteTrainerAsync: deleteTrainerMutation.mutateAsync,
    isLoading: deleteTrainerMutation.isPending,
    isSuccess: deleteTrainerMutation.isSuccess,
    isError: deleteTrainerMutation.isError,
    error: deleteTrainerMutation.error,
  }
}
