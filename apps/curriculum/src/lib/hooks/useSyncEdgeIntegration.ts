/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { getCookie } from "@curriculum-services/auth";

interface SyncResponse {
  code?: string;
  message?: string;
}

interface SyncWithTraineeIdsParams {
  traineeIds: string[];
}

interface SyncTrainingParams {
  trainingId: string;
}

// Sync Pre-Assessment (selected students)
export function useSyncPreAssessment() {
  const queryClient = useQueryClient();

  const mutation = useMutation<SyncResponse, any, SyncWithTraineeIdsParams>({
    mutationFn: async ({ traineeIds }) => {
      const token = getCookie("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post<SyncResponse>(
        `${process.env.NEXT_PUBLIC_API}/edge-integration/sync-pre-assessment`,
        { traineeIds },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    },
    onSuccess: (data, variables) => {
      const count = variables.traineeIds.length;
      toast.success(
        data?.message || 
        `Successfully synced pre-assessment for ${count} ${count === 1 ? "student" : "students"}`
      );
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to sync pre-assessment");
    },
  });

  return {
    syncPreAssessment: mutation.mutate,
    syncPreAssessmentAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

// Sync Pre-Assessment (all in training)
export function useSyncPreAssessmentTraining() {
  const queryClient = useQueryClient();

  const mutation = useMutation<SyncResponse, any, SyncTrainingParams>({
    mutationFn: async ({ trainingId }) => {
      const token = getCookie("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post<SyncResponse>(
        `${process.env.NEXT_PUBLIC_API}/edge-integration/sync-pre-assessment/training/${trainingId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Successfully synced all pre-assessments for training");
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to sync pre-assessments");
    },
  });

  return {
    syncPreAssessmentTraining: mutation.mutate,
    syncPreAssessmentTrainingAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

// Sync Post-Assessment (selected students)
export function useSyncPostAssessment() {
  const queryClient = useQueryClient();

  const mutation = useMutation<SyncResponse, any, SyncWithTraineeIdsParams>({
    mutationFn: async ({ traineeIds }) => {
      const token = getCookie("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post<SyncResponse>(
        `${process.env.NEXT_PUBLIC_API}/edge-integration/sync-post-assessment`,
        { traineeIds },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    },
    onSuccess: (data, variables) => {
      const count = variables.traineeIds.length;
      toast.success(
        data?.message || 
        `Successfully synced post-assessment for ${count} ${count === 1 ? "student" : "students"}`
      );
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to sync post-assessment");
    },
  });

  return {
    syncPostAssessment: mutation.mutate,
    syncPostAssessmentAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

// Sync Post-Assessment (all in training)
export function useSyncPostAssessmentTraining() {
  const queryClient = useQueryClient();

  const mutation = useMutation<SyncResponse, any, SyncTrainingParams>({
    mutationFn: async ({ trainingId }) => {
      const token = getCookie("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post<SyncResponse>(
        `${process.env.NEXT_PUBLIC_API}/edge-integration/sync-post-assessment/training/${trainingId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Successfully synced all post-assessments for training");
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to sync post-assessments");
    },
  });

  return {
    syncPostAssessmentTraining: mutation.mutate,
    syncPostAssessmentTrainingAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

// Sync Enroll Trainees (selected students)
export function useSyncEnrollTrainees() {
  const queryClient = useQueryClient();

  const mutation = useMutation<SyncResponse, any, SyncWithTraineeIdsParams>({
    mutationFn: async ({ traineeIds }) => {
      const token = getCookie("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post<SyncResponse>(
        `${process.env.NEXT_PUBLIC_API}/edge-integration/sync-enroll-trainees`,
        { traineeIds },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    },
    onSuccess: (data, variables) => {
      const count = variables.traineeIds.length;
      toast.success(
        data?.message || 
        `Successfully synced enrollment for ${count} ${count === 1 ? "student" : "students"}`
      );
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to sync enrollments");
    },
  });

  return {
    syncEnrollTrainees: mutation.mutate,
    syncEnrollTraineesAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

// Sync Enroll Trainees (all in training)
export function useSyncEnrollTraineesTraining() {
  const queryClient = useQueryClient();

  const mutation = useMutation<SyncResponse, any, SyncTrainingParams>({
    mutationFn: async ({ trainingId }) => {
      const token = getCookie("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post<SyncResponse>(
        `${process.env.NEXT_PUBLIC_API}/edge-integration/sync-enroll-trainees/training/${trainingId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Successfully synced all enrollments for training");
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to sync enrollments");
    },
  });

  return {
    syncEnrollTraineesTraining: mutation.mutate,
    syncEnrollTraineesTrainingAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

// Sync Create Trainees (selected students)
export function useSyncCreateTrainees() {
  const queryClient = useQueryClient();

  const mutation = useMutation<SyncResponse, any, SyncWithTraineeIdsParams>({
    mutationFn: async ({ traineeIds }) => {
      const token = getCookie("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post<SyncResponse>(
        `${process.env.NEXT_PUBLIC_API}/edge-integration/sync-create-trainees`,
        { traineeIds },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    },
    onSuccess: (data, variables) => {
      const count = variables.traineeIds.length;
      toast.success(
        data?.message || 
        `Successfully synced creation for ${count} ${count === 1 ? "student" : "students"}`
      );
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to sync student creation");
    },
  });

  return {
    syncCreateTrainees: mutation.mutate,
    syncCreateTraineesAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

// Sync Create Trainees (all in training)
export function useSyncCreateTraineesTraining() {
  const queryClient = useQueryClient();

  const mutation = useMutation<SyncResponse, any, SyncTrainingParams>({
    mutationFn: async ({ trainingId }) => {
      const token = getCookie("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post<SyncResponse>(
        `${process.env.NEXT_PUBLIC_API}/edge-integration/sync-create-trainees/training/${trainingId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Successfully synced all student creations for training");
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to sync student creations");
    },
  });

  return {
    syncCreateTraineesTraining: mutation.mutate,
    syncCreateTraineesTrainingAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}

