"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import axios from "axios"
import { TrainingProfile } from "./useTrainingProfile"
import { getCookie } from "@curriculum-services/auth"


export function useCreateTrainingProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TrainingProfile) => {
      const token = getCookie('token')
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/training/add-training-profile`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['training-profile', variables.trainingId] 
      })
    }
  })
}

export function useUpdateTrainingProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: TrainingProfile) => {
      const token = getCookie('token')
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/training/add-training-profile`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      return response.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['training-profile', variables.trainingId] 
      })
    }
  })
} 