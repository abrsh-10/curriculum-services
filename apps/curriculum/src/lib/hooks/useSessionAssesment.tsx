import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { getCookie } from "@curriculum-services/auth";
import { toast } from "sonner";

// Define error interface for API responses
interface ApiErrorResponse {
  message?: string;
}

// Define types based on the API structure
export interface SurveyQuestion {
  question: string;
  choices: string[];
}

export interface SurveyEntry {
  id: string;
  question: string;
  choices: string[];
  answer: string | null;
}

export interface Survey {
  id: string;
  name: string;
  description: string;
  sessionId: string | null;
  sessionName: string | null;
}

export interface SurveyDetail {
  id: string;
  name: string;
  description: string;
  sessionId: string | null;
  sessionName: string | null;
  surveyEntries: SurveyEntry[];
}

export interface SurveysResponse {
  code: string;
  surveys: Survey[];
  message: string;
}

export interface SurveyDetailResponse {
  code: string;
  survey: SurveyDetail;
  message: string;
}

export interface CreateSurveyData {
  name: string;
  description: string;
  surveyQuestions: SurveyQuestion[];
}

export interface UpdateSurveyData {
  name: string;
  description: string;
}

export interface SubmitAnswerData {
  answer: string;
  traineeId: string;
}

export interface UpdateQuestionData {
  question: string;
  choices: string[];
}

// Define query keys
const surveyQueryKeys = {
  all: ['surveys'] as const,
  training: (trainingId: string) => ['surveys', 'training', trainingId] as const,
  detail: (surveyId: string, traineeId?: string) => ['surveys', 'detail', surveyId, traineeId] as const,
  session: (sessionId: string) => ['surveys', 'session', sessionId] as const,
};

/**
 * Hook to fetch all surveys for a training
 */
export function useSurveys(trainingId: string) {
  return useQuery({
    queryKey: surveyQueryKeys.training(trainingId),
    queryFn: async () => {
      try {
        const token = getCookie("token");
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API}/survey/training/${trainingId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data as SurveysResponse;
      } catch (error: unknown) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        throw new Error(axiosError?.response?.data?.message || "Failed to load surveys");
      }
    },
  });
}

/**
 * Hook to fetch survey details including all questions
 */
export function useSurveyDetail(surveyId: string, traineeId?: string) {
  return useQuery({
    queryKey: surveyQueryKeys.detail(surveyId, traineeId),
    queryFn: async () => {
      try {
        const token = getCookie("token");
        let url = `${process.env.NEXT_PUBLIC_API}/survey/${surveyId}`;
        if (traineeId) {
          url += `?traineeId=${traineeId}`;
        }
        
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        return response.data as SurveyDetailResponse;
      } catch (error: unknown) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        throw new Error(axiosError?.response?.data?.message || "Failed to load survey details");
      }
    },
    enabled: !!surveyId,
  });
}

/**
 * Hook to fetch surveys by session
 */
export function useSurveysBySession(sessionId: string) {
  return useQuery({
    queryKey: surveyQueryKeys.session(sessionId),
    queryFn: async () => {
      try {
        const token = getCookie("token");
        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API}/survey/session/${sessionId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        return response.data;
      } catch (error: unknown) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        throw new Error(axiosError?.response?.data?.message || "Failed to load session surveys");
      }
    },
    enabled: !!sessionId,
  });
}

/**
 * Hook for creating a new survey with questions
 */
export function useCreateSurvey(trainingId: string) {
  const queryClient = useQueryClient();

  const createSurveyMutation = useMutation({
    mutationFn: async (surveyData: CreateSurveyData) => {
      const token = getCookie("token");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/survey/training/${trainingId}`,
        surveyData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Survey created successfully");
      queryClient.invalidateQueries({ queryKey: surveyQueryKeys.training(trainingId) });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || "Failed to create survey");
    },
  });

  return {
    createSurvey: createSurveyMutation.mutate,
    isLoading: createSurveyMutation.isPending,
    isSuccess: createSurveyMutation.isSuccess,
    isError: createSurveyMutation.isError,
    error: createSurveyMutation.error,
  };
}

/**
 * Hook for updating survey name and description only
 */
export function useUpdateSurvey() {
  const queryClient = useQueryClient();

  const updateSurveyMutation = useMutation({
    mutationFn: async ({ surveyId, data }: { surveyId: string; data: UpdateSurveyData }) => {
      const token = getCookie("token");
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API}/survey/${surveyId}`,
        data,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return { responseData: response.data, surveyId };
    },
    onSuccess: ({ responseData, surveyId }) => {
      toast.success(responseData.message || "Survey updated successfully");
      queryClient.invalidateQueries({ queryKey: surveyQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: surveyQueryKeys.detail(surveyId) });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || "Failed to update survey");
    },
  });

  return {
    updateSurvey: updateSurveyMutation.mutate,
    isLoading: updateSurveyMutation.isPending,
    isSuccess: updateSurveyMutation.isSuccess,
    isError: updateSurveyMutation.isError,
    error: updateSurveyMutation.error,
  };
}

/**
 * Hook for deleting a survey
 */
export function useDeleteSurvey() {
  const queryClient = useQueryClient();

  const deleteSurveyMutation = useMutation({
    mutationFn: async (surveyId: string) => {
      const token = getCookie("token");
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API}/survey/${surveyId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Survey deleted successfully");
      queryClient.invalidateQueries({ queryKey: surveyQueryKeys.all });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || "Failed to delete survey");
    },
  });

  return {
    deleteSurvey: deleteSurveyMutation.mutate,
    isLoading: deleteSurveyMutation.isPending,
    isSuccess: deleteSurveyMutation.isSuccess,
    isError: deleteSurveyMutation.isError,
    error: deleteSurveyMutation.error,
  };
}

/**
 * Hook for adding a single question to an existing survey
 */
export function useAddQuestionToSurvey() {
  const queryClient = useQueryClient();

  const addQuestionMutation = useMutation({
    mutationFn: async ({
      surveyId,
      questionData,
    }: {
      surveyId: string;
      questionData: SurveyQuestion;
    }) => {
      const token = getCookie("token");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/survey/${surveyId}/question`,
        questionData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return { responseData: response.data, surveyId };
    },
    onSuccess: ({ responseData, surveyId }) => {
      toast.success(responseData.message || "Question added successfully");
      queryClient.invalidateQueries({ queryKey: surveyQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: surveyQueryKeys.detail(surveyId) });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || "Failed to add question");
    },
  });

  return {
    addQuestion: addQuestionMutation.mutate,
    isLoading: addQuestionMutation.isPending,
    isSuccess: addQuestionMutation.isSuccess,
    isError: addQuestionMutation.isError,
    error: addQuestionMutation.error,
  };
}

/**
 * Hook for adding multiple questions to an existing survey
 */
export function useAddQuestionsToSurvey() {
  const queryClient = useQueryClient();

  const addQuestionsMutation = useMutation({
    mutationFn: async ({
      surveyId,
      questions,
    }: {
      surveyId: string;
      questions: SurveyQuestion[];
    }) => {
      const token = getCookie("token");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/survey/${surveyId}/questions`,
        questions,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return { responseData: response.data, surveyId };
    },
    onSuccess: ({ responseData, surveyId }) => {
      toast.success(responseData.message || "Questions added successfully");
      queryClient.invalidateQueries({ queryKey: surveyQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: surveyQueryKeys.detail(surveyId) });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || "Failed to add questions");
    },
  });

  return {
    addQuestions: addQuestionsMutation.mutate,
    isLoading: addQuestionsMutation.isPending,
    isSuccess: addQuestionsMutation.isSuccess,
    isError: addQuestionsMutation.isError,
    error: addQuestionsMutation.error,
  };
}

/**
 * Hook for updating a specific question (survey entry)
 */
export function useUpdateSurveyQuestion() {
  const queryClient = useQueryClient();

  const updateQuestionMutation = useMutation({
    mutationFn: async ({
      surveyEntryId,
      questionData,
    }: {
      surveyEntryId: string;
      questionData: UpdateQuestionData;
    }) => {
      const token = getCookie("token");
      const response = await axios.patch(
        `${process.env.NEXT_PUBLIC_API}/survey/entry/${surveyEntryId}/question`,
        questionData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Question updated successfully");
      queryClient.invalidateQueries({ queryKey: surveyQueryKeys.all });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || "Failed to update question");
    },
  });

  return {
    updateQuestion: updateQuestionMutation.mutate,
    isLoading: updateQuestionMutation.isPending,
    isSuccess: updateQuestionMutation.isSuccess,
    isError: updateQuestionMutation.isError,
    error: updateQuestionMutation.error,
  };
}

/**
 * Hook for deleting a specific survey entry (question)
 */
export function useDeleteSurveyEntry() {
  const queryClient = useQueryClient();

  const deleteSurveyEntryMutation = useMutation({
    mutationFn: async (surveyEntryId: string) => {
      const token = getCookie("token");
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API}/survey/entry/${surveyEntryId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Question deleted successfully");
      queryClient.invalidateQueries({ queryKey: surveyQueryKeys.all });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || "Failed to delete question");
    },
  });

  return {
    deleteSurveyEntry: deleteSurveyEntryMutation.mutate,
    isLoading: deleteSurveyEntryMutation.isPending,
    isSuccess: deleteSurveyEntryMutation.isSuccess,
    isError: deleteSurveyEntryMutation.isError,
    error: deleteSurveyEntryMutation.error,
  };
}

/**
 * Hook for submitting an answer to a survey question (trainee side)
 */
export function useSubmitSurveyAnswer() {
  const queryClient = useQueryClient();

  const submitAnswerMutation = useMutation({
    mutationFn: async ({
      surveyEntryId,
      answerData,
    }: {
      surveyEntryId: string;
      answerData: SubmitAnswerData;
    }) => {
      const token = getCookie("token");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/survey/entry/${surveyEntryId}/answer`,
        answerData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Answer submitted successfully");
      queryClient.invalidateQueries({ queryKey: surveyQueryKeys.all });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || "Failed to submit answer");
    },
  });

  return {
    submitAnswer: submitAnswerMutation.mutate,
    isLoading: submitAnswerMutation.isPending,
    isSuccess: submitAnswerMutation.isSuccess,
    isError: submitAnswerMutation.isError,
    error: submitAnswerMutation.error,
  };
}

/**
 * Hook for assigning a survey to a session
 */
export function useAssignSurveyToSession() {
  const queryClient = useQueryClient();

  const assignSurveyMutation = useMutation({
    mutationFn: async (surveyId: string) => {
      const token = getCookie("token");
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/survey/${surveyId}/assign-session`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Survey assigned to session successfully");
      queryClient.invalidateQueries({ queryKey: surveyQueryKeys.all });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      toast.error(error.response?.data?.message || "Failed to assign survey to session");
    },
  });

  return {
    assignSurveyToSession: assignSurveyMutation.mutate,
    isLoading: assignSurveyMutation.isPending,
    isSuccess: assignSurveyMutation.isSuccess,
    isError: assignSurveyMutation.isError,
    error: assignSurveyMutation.error,
  };
}
