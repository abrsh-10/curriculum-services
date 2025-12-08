"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { getCookie } from "@curriculum-services/auth";
import {
  assessmentQueryKeys,
  type CreateAssessmentPayload,
  type UpdateAssessmentPayload,
  type CreateAnswerLinkPayload,
  type ExtendAnswerLinkPayload,
  type UpdateAssessmentSectionPayload,
  type ApiErrorResponse,
  type AssessmentChoice,
  type AssessmentQuestion,
  type AssessmentSectionDetail,
  type AssessmentSummary,
  type AssessmentDetail,
  type AssessmentsResponse,
  type AssessmentDetailResponse,
  type AssessmentSectionsResponse,
  type AssessmentSectionResponse,
} from "./assessment-types";

// Re-export commonly used types for backwards compatibility
export type {
  AssessmentChoice,
  AssessmentQuestion,
  AssessmentSectionDetail,
  AssessmentSummary,
  AssessmentDetail,
  AssessmentsResponse,
  AssessmentDetailResponse,
  AssessmentSectionsResponse,
  AssessmentSectionResponse,
};

// =============================================================================
// GET HOOKS - Fetching Assessment Data
// =============================================================================

/**
 * Hook to fetch all assessments for a training
 */
export function useAssessments(trainingId: string) {
  return useQuery({
    queryKey: assessmentQueryKeys.training(trainingId),
    queryFn: async () => {
      try {
        const token = getCookie("token");
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API}/assessment/training/${trainingId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data as AssessmentsResponse;
      } catch (error: unknown) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        throw new Error(axiosError?.response?.data?.message || "Failed to load assessments");
      }
    },
    enabled: !!trainingId,
  });
}

/**
 * Hook to fetch assessment details by ID
 */
export function useAssessmentDetail(assessmentId: string) {
  return useQuery({
    queryKey: assessmentQueryKeys.detail(assessmentId),
    queryFn: async () => {
      try {
        const token = getCookie("token");
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API}/assessment/${assessmentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data as AssessmentDetailResponse;
      } catch (error: unknown) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        throw new Error(axiosError?.response?.data?.message || "Failed to load assessment details");
      }
    },
    enabled: !!assessmentId,
  });
}

/**
 * Hook to fetch assessment sections by assessment ID
 */
export function useAssessmentSections(assessmentId: string) {
  return useQuery({
    queryKey: assessmentQueryKeys.sections(assessmentId),
    queryFn: async () => {
      try {
        const token = getCookie("token");
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API}/assessment-section/assessment/${assessmentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data as AssessmentSectionsResponse;
      } catch (error: unknown) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        throw new Error(axiosError?.response?.data?.message || "Failed to load assessment sections");
      }
    },
    enabled: !!assessmentId,
  });
}

/**
 * Hook to fetch a specific assessment section by section ID
 */
export function useAssessmentSection(sectionId: string) {
  return useQuery({
    queryKey: assessmentQueryKeys.section(sectionId),
    queryFn: async () => {
      try {
        const token = getCookie("token");
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API}/assessment-section/${sectionId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data as AssessmentSectionResponse;
      } catch (error: unknown) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        throw new Error(axiosError?.response?.data?.message || "Failed to load assessment section");
      }
    },
    enabled: !!sectionId,
  });
}

// =============================================================================
// MUTATION HOOKS - Creating and Modifying Assessments
// =============================================================================

/**
 * Hook to create a new assessment
 */
export function useCreateAssessment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      trainingId, 
      data 
    }: { 
      trainingId: string;
      data: CreateAssessmentPayload;
    }) => {
      const token = getCookie("token");
      
      // Build multipart form data: send all fields as individual multipart keys (no JSON payload)
      const formData = new FormData();

      // Top-level fields
      formData.append('name', data.name ?? '');
      formData.append('type', data.type);
      formData.append('description', data.description ?? '');
      formData.append('duration', String(data.duration ?? 0));
      formData.append('maxAttempts', String(data.maxAttempts ?? 1));
      formData.append('contentDeveloperEmail', data.contentDeveloperEmail ?? '');
      formData.append('timed', String(!!data.timed));

      // Nested fields (sections, assessmentEntries, choices)
      data.sections.forEach((sec, si) => {
        formData.append(`sections[${si}].title`, sec.title ?? '');
        if (sec.description) formData.append(`sections[${si}].description`, sec.description);

        sec.assessmentEntries.forEach((entry, ei) => {
          formData.append(`sections[${si}].assessmentEntries[${ei}].question`, entry.question ?? '');
          formData.append(`sections[${si}].assessmentEntries[${ei}].questionType`, entry.questionType);
          formData.append(`sections[${si}].assessmentEntries[${ei}].weight`, String(entry.weight ?? 1));

          // Choices (text, image, and correctness)
          (entry.choices || []).forEach((c, ci) => {
            formData.append(`sections[${si}].assessmentEntries[${ei}].choices[${ci}].choice`, c.choice ?? '');
            formData.append(`sections[${si}].assessmentEntries[${ei}].choices[${ci}].isCorrect`, String(!!c.isCorrect));
            if (c.choiceImageFile instanceof File) {
              formData.append(`sections[${si}].assessmentEntries[${ei}].choices[${ci}].choiceImage`, c.choiceImageFile);
            } else if (c.choiceImage) {
              formData.append(`sections[${si}].assessmentEntries[${ei}].choices[${ci}].choiceImage`, c.choiceImage);
            }
          });

          // Question image (file or existing URL)
          if (entry.questionImageFile instanceof File) {
            formData.append(`sections[${si}].assessmentEntries[${ei}].questionImage`, entry.questionImageFile);
          } else if (entry.questionImage) {
            formData.append(`sections[${si}].assessmentEntries[${ei}].questionImage`, entry.questionImage);
          }
        });
      });
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/assessment/training/${trainingId}`,
        formData,
        {
          headers: { 
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}` 
          }
        }
      );
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Success", { 
        description: data.message || "Assessment created successfully" 
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ["assessments"] 
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      let errorMessage = "Failed to create assessment. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error("Error", {
        description: errorMessage
      });
    }
  });
}

// Hook to create answer link for assessment
export function useCreateAnswerLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      assessmentId, 
      data 
    }: { 
      assessmentId: string;
      data: CreateAnswerLinkPayload;
    }) => {
      const token = getCookie("token");
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/assessment/${assessmentId}/create-answer-link`,
        data,
        {
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          }
        }
      );
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Success", { 
        description: data.message || "Answer link created successfully" 
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ["assessmentLinks"] 
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      let errorMessage = "Failed to create answer link. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error("Error", {
        description: errorMessage
      });
    }
  });
}

export function useDeleteAssessmentLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (linkId: string) => {
      const token = getCookie("token");
      
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API}/assessment/answer-links/${linkId}`,
        {
          headers: { 
            Authorization: `Bearer ${token}` 
          }
        }
      );
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Success", { 
        description: data.message || "Assessment link deleted successfully" 
      });
      
      // Invalidate assessment links queries to immediately update the UI
      queryClient.invalidateQueries({ 
        queryKey: ["assessment", "answer-links"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["assessment", "answered-trainees"] 
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      let errorMessage = "Failed to delete assessment link. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error("Error", {
        description: errorMessage
      });
    }
  });
}

// Hook to change assessment status
export function useChangeAssessmentStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      assessmentId, 
      status 
    }: { 
      assessmentId: string;
      status: "PENDING" | "APPROVED" | "REJECTED";
    }) => {
      const token = getCookie("token");
      
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API}/assessment/${assessmentId}/change-status?status=${status}`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}` 
          }
        }
      );
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Success", { 
        description: data.message || "Assessment status updated successfully" 
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ["assessments"] 
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      let errorMessage = "Failed to update assessment status. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error("Error", {
        description: errorMessage
      });
    }
  });
}

// Hook to invalidate answer link
export function useInvalidateAnswerLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (linkId: string) => {
      const token = getCookie("token");
      
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API}/assessment/answer-links/${linkId}/invalidate`,
        {},
        {
          headers: { 
            Authorization: `Bearer ${token}` 
          }
        }
      );
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Success", { 
        description: data.message || "Answer link invalidated successfully" 
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ["assessmentLinks"] 
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      let errorMessage = "Failed to invalidate answer link. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error("Error", {
        description: errorMessage
      });
    }
  });
}

// Hook to extend answer link
export function useExtendAnswerLink() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      linkId, 
      data 
    }: { 
      linkId: string;
      data: ExtendAnswerLinkPayload;
    }) => {
      const token = getCookie("token");
      
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API}/assessment/answer-links/${linkId}/extend`,
        data,
        {
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          }
        }
      );
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Success", { 
        description: data.message || "Answer link extended successfully" 
      });
      
      // Invalidate assessment links queries to immediately update the UI
      queryClient.invalidateQueries({ 
        queryKey: ["assessment", "answer-links"] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ["assessment", "answered-trainees"] 
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      let errorMessage = "Failed to extend answer link. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error("Error", {
        description: errorMessage
      });
    }
  });
}

// Hook to update assessment
export function useUpdateAssessment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      assessmentId, 
      data 
    }: { 
      assessmentId: string;
      data: UpdateAssessmentPayload;
    }) => {
      const token = getCookie("token");
      
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API}/assessment/${assessmentId}`,
        data,
        {
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          }
        }
      );
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Success", { 
        description: data.message || "Assessment updated successfully" 
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: ["assessments"] 
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const message = error.response?.data?.message || "Failed to update assessment. Please try again."
      toast.error("Error", { description: message })
    }
  });
}

// Hook to delete assessment
export function useDeleteAssessment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (assessmentId: string) => {
      const token = getCookie("token");
      
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API}/assessment/${assessmentId}`,
        {
          headers: { 
            Authorization: `Bearer ${token}` 
          }
        }
      );
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Success", { 
        description: data.message || "Assessment deleted successfully" 
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: assessmentQueryKeys.all 
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      let errorMessage = "Failed to delete assessment. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error("Error", {
        description: errorMessage
      });
    }
  });
}

// =============================================================================
// SECTION MUTATION HOOKS - Managing Assessment Sections
// =============================================================================

/**
 * Hook to add a new section to an existing assessment
 * Now uses JSON format with sections wrapper to match bulk endpoint
 */
export function useAddAssessmentSection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      assessmentId, 
      data 
    }: { 
      assessmentId: string;
      data: {
        title: string;
        description: string;
        assessmentEntries: {
          question: string;
          questionImage?: string;
          questionImageFile?: File;
          questionType: "RADIO" | "CHECKBOX" | "TEXT";
          choices: {
            choice: string;
            choiceImage?: string;
            choiceImageFile?: File;
            isCorrect: boolean;
          }[];
          weight: number;
        }[];
      };
    }) => {
      const token = getCookie("token");
      
      // Convert to JSON format matching bulk endpoint (sections array wrapper)
      // Note: Files are not supported in this path; use question/choice image URLs instead
      const payload = {
        sections: [
          {
            title: data.title,
            description: data.description,
            assessmentEntries: data.assessmentEntries.map(entry => ({
              question: entry.question,
              questionImage: entry.questionImage || "",
              questionType: entry.questionType,
              weight: entry.weight,
              choices: entry.choices.map(choice => ({
                choice: choice.choice,
                choiceImage: choice.choiceImage || "",
                isCorrect: choice.isCorrect,
              })),
            })),
          }
        ]
      };
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/assessment-section/assessment/${assessmentId}`,
        payload,
        {
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          }
        }
      );
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Success", { 
        description: data.message || "Assessment section added successfully" 
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: assessmentQueryKeys.all 
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      let errorMessage = "Failed to add assessment section. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error("Error", {
        description: errorMessage
      });
    }
  });
}

/**
 * Hook to add multiple sections to an existing assessment in a single request
 * Expects a JSON payload with a top-level "sections" array as per API contract
 * Only PMs/Company Admins should call user-fetching APIs; this bulk section
 * creation is primarily used by content developers in the builder flow.
 */
export function useAddAssessmentSectionsBulk() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      assessmentId,
      sections,
    }: {
      assessmentId: string;
      sections: {
        title: string;
        description: string;
        assessmentEntries: {
          question: string;
          questionImage?: string;
          questionType: "RADIO" | "CHECKBOX" | "TEXT";
          choices: {
            choice: string;
            choiceImage?: string;
            isCorrect: boolean;
          }[];
          weight: number;
        }[];
      }[];
    }) => {
      const token = getCookie("token");

      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/assessment-section/assessment/${assessmentId}`,
        { sections },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success("Success", {
        description: data?.message || "Assessment sections added successfully",
      });

      // Invalidate relevant queries, including the specific assessment detail if available
      queryClient.invalidateQueries({ queryKey: assessmentQueryKeys.all });
      if (variables?.assessmentId) {
        queryClient.invalidateQueries({
          queryKey: assessmentQueryKeys.detail(variables.assessmentId),
        });
        queryClient.invalidateQueries({
          queryKey: assessmentQueryKeys.sections(variables.assessmentId),
        });
      }
      queryClient.invalidateQueries({ queryKey: ["assessments"] });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      let errorMessage = "Failed to add assessment sections. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      toast.error("Error", { description: errorMessage });
    },
  });
}

/**
 * Hook to delete an assessment section
 */
export function useDeleteAssessmentSection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (sectionId: string) => {
      const token = getCookie("token");
      
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API}/assessment-section/${sectionId}`,
        {
          headers: { 
            Authorization: `Bearer ${token}` 
          }
        }
      );
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Success", { 
        description: data.message || "Assessment section deleted successfully" 
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ 
        queryKey: assessmentQueryKeys.all 
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      let errorMessage = "Failed to delete assessment section. Please try again.";
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error("Error", {
        description: errorMessage
      });
    }
  });
}

/**
 * Hook to update an existing assessment section (title, description, sectionOrder)
 */
export function useUpdateAssessmentSection() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      sectionId,
      data
    }: {
      sectionId: string;
      data: {
        title?: string;
        description?: string;
        sectionOrder?: number;
      };
    }) => {
      const token = getCookie("token");
      
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API}/assessment-section/${sectionId}`,
        data,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      return response.data;
    },
    onSuccess: (data, variables) => {
      toast.success("Success", {
        description: data?.message || "Section updated successfully"
      });
      // Invalidate broad and specific queries
      queryClient.invalidateQueries({ queryKey: ['assessments'] });
      if (variables?.sectionId) {
        queryClient.invalidateQueries({ queryKey: assessmentQueryKeys.section(variables.sectionId) });
      }
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to update section";
      toast.error("Error", { description: errorMessage });
    }
  });
}

