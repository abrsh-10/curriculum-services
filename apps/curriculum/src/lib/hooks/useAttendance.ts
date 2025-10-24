
"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { toast } from "sonner";
import { getCookie } from "@curriculum-services/auth";
import { Student } from "./useStudents";

// ID Types for ID upload functionality
export const ID_TYPES = [
  { id: 'passport', name: 'Passport', requiresBack: false },
  { id: 'national_id', name: 'National ID', requiresBack: false },
  { id: 'kebele_id', name: 'Resident (Kebele) ID', requiresBack: true },
  { id: 'driving_license', name: 'Driving License', requiresBack: true },
  // Not a government ID, but a special upload handled by student consent endpoint
  { id: 'consent_form', name: 'Consent Form', requiresBack: false },
]

// Types for attendance
interface AttendanceRecord {
  id: string;
  trainee: Student;
  isPresent: boolean;
  comment: string;
}

interface AttendanceResponse {
  code: string;
  message: string;
  attendance: AttendanceRecord[];
}

interface AttendanceSubmission {
  traineeId: string;
  sessionId: string;
  comment: string;
  present: boolean;
}

interface StudentIdSubmission {
  pendingTraineeId: string; // the student id
  idType: string;
  idFrontFile: File;
  idBackFile?: File;
} 

interface ApiErrorResponse {
  message: string;
  [key: string]: unknown;
}

// Hook to get attendance records for a session
export function useSessionAttendance(sessionId: string) {
  return useQuery({
    queryKey: ["attendance", sessionId],
    queryFn: async () => {
      try {
        const token = getCookie("token");
        const response = await axios.get<AttendanceResponse>(
          `${process.env.NEXT_PUBLIC_API}/attendance/session/${sessionId}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );
        
        return response.data;
      } catch (error) {
        const axiosError = error as AxiosError<ApiErrorResponse>;
        throw new Error(
          axiosError.response?.data?.message || 
          "Failed to load attendance records"
        );
      }
    },
    enabled: !!sessionId
  });
}

// Hook to submit attendance
export function useSubmitAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (attendanceData: AttendanceSubmission) => {
      const token = getCookie("token");
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/attendance`,
        attendanceData,
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
      // toast.success("Success", { 
      //   description: data.message || "Attendance recorded successfully" 
      // });
      
      // Invalidate the attendance query for this session
      queryClient.invalidateQueries({ 
        queryKey: ["attendance", variables.sessionId] 
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      let errorMessage = "Failed to record attendance. Please try again.";
      
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

// Hook to submit multiple attendance records at once
export function useSubmitBulkAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ 
      sessionId,
      attendanceRecords 
    }: { 
      sessionId: string,
      attendanceRecords: Omit<AttendanceSubmission, "sessionId">[] 
    }) => {
      const token = getCookie("token");
      
      // Map to the new bulk API structure
      const attendances = attendanceRecords.map(record => ({
        traineeId: record.traineeId,
        comment: record.comment,
        present: record.present
      }));
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/attendance/bulk`,
        { 
          sessionId,
          attendances 
        },
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
        description: data.message || "Attendance records submitted successfully" 
      });
      
      // Invalidate the attendance query for this session
      queryClient.invalidateQueries({ 
        queryKey: ["attendance", variables.sessionId] 
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      let errorMessage = "Failed to submit attendance records. Please try again.";
      
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

// Hook to upload student ID documents
export function useSubmitStudentId() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: StudentIdSubmission) => {
      const token = getCookie("token");
      const formData = new FormData();
      
      // Add student ID to formData
      formData.append("pendingTraineeId", data.pendingTraineeId);
      formData.append("idType", data.idType);
      
      // Add front ID image
      formData.append("idFrontFile", data.idFrontFile);
      
      // Add back ID image if required and provided
      if (data.idBackFile) {
        formData.append("idBackFile", data.idBackFile);
      }
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/pending-trainee/update-id`,
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
        description: data.message || "ID documents uploaded successfully" 
      });
      
      // Invalidate the student data query to refresh with new ID info
      queryClient.invalidateQueries({ 
        queryKey: ["students"] 
      });
      queryClient.invalidateQueries({
        queryKey: ["student", data.pendingTraineeId]
      });
    },
    onError: (error: AxiosError<ApiErrorResponse>) => {
      let errorMessage = "Failed to upload ID documents. Please try again.";
      
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
