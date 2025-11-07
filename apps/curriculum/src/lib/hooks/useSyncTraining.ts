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

export function useSyncTraining() {
  const queryClient = useQueryClient();

  const mutation = useMutation<SyncResponse, any, string>({
    mutationFn: async (trainingId: string) => {
      const token = getCookie("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await axios.post<SyncResponse>(
        `${process.env.NEXT_PUBLIC_API}/edge-integration/sync-training/${trainingId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data?.message || "Training sync triggered successfully");
      // Invalidate lists that may be affected
      queryClient.invalidateQueries({ queryKey: ["trainings"] });
      queryClient.invalidateQueries({ queryKey: ["training"] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to sync training");
    },
  });

  return {
    syncTraining: mutation.mutate,
    syncTrainingAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
  };
}


