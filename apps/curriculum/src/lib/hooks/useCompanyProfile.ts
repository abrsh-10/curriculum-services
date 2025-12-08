"use client"

/* eslint-disable @typescript-eslint/no-explicit-any */
import { BusinessType, CompanyFileUpload, CompanyProfileFormData, IndustryType } from "@/types/company";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { getCookie } from "@curriculum-services/auth";


// Utility functions
function isBusinessType(value: unknown): value is BusinessType {
  return typeof value === "object" && value !== null && "id" in value
}

function isIndustryType(value: unknown): value is IndustryType {
  return typeof value === "object" && value !== null && "id" in value
}

function isCompanyFileUpload(value: unknown): value is CompanyFileUpload[] {
  return Array.isArray(value) && value.every(item => 
    typeof item === "object" && 
    item !== null && 
    "fileTypeId" in item && 
    "file" in item
  )
}

function formatPhoneNumber(phone: string): string {
  const cleanPhone = phone.replace(/^\+251/, '')
  return `+251${cleanPhone}`
}

function truncateEmployeeSize(size: string | undefined): string | undefined {
  if (!size) return undefined;
  if (size.includes("MICRO")) return "MICRO";
  if (size.includes("SMALL")) return "SMALL";
  if (size.includes("MEDIUM")) return "MEDIUM";
  if (size.includes("LARGE")) return "LARGE";
  return undefined;
}



export function useGetMyCompanyProfile() {
  return useQuery({
    queryKey: ['my-company-profile'],
    queryFn: async () => {
      const token = getCookie('token');
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API}/company-profile/me`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data.companyProfile;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes - company profile rarely changes
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

export function useCreateCompanyProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: CompanyProfileFormData) => {
      const token = getCookie('token');
      const formData = new FormData();
      
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (key === "businessType" && isBusinessType(value)) {
            formData.append("businessTypeId", value.id);
          } else if (key === "industryType" && isIndustryType(value)) {
            formData.append("industryTypeId", value.id);
          } else if (key === "companyFiles" && isCompanyFileUpload(value)) {
            value.forEach((fileData) => {
              formData.append(fileData.fileTypeId, fileData.file);
            });
          } else if (key === "phone") {
            formData.append(key, formatPhoneNumber(value.toString()));
          } else {
            formData.append(key, value.toString());
          }
        }
      });
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API}/company-profile`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          },
        }
      );
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Success", { description: data.message });
      queryClient.invalidateQueries({ queryKey: ["company-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["my-company-profile"] });
    },
    onError: (error: any) => {
      toast.error("Error", {
        description: error.message || "Failed to create company profile"
      });
    }
  });
}

export function useUpdateCompanyProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data, initialValues, company }: { 
      id: string, 
      data: Partial<CompanyProfileFormData>,
      initialValues: Partial<CompanyProfileFormData> | null,
      company: any
    }) => {
      const token = getCookie('token');
      // Prepare data for API by merging original data with edited data
      const formattedData = {
        name: data.name !== initialValues?.name ? data.name : company?.name,
        taxIdentificationNumber: data.taxIdentificationNumber !== initialValues?.taxIdentificationNumber 
          ? data.taxIdentificationNumber 
          : company?.taxIdentificationNumber,
        businessTypeId: data.businessType?.id !== initialValues?.businessType?.id 
          ? data.businessType?.id 
          : company?.businessType?.id,
        industryTypeId: data.industryType?.id !== initialValues?.industryType?.id 
          ? data.industryType?.id 
          : company?.industryType?.id,
        countryOfIncorporation: data.countryOfIncorporation !== initialValues?.countryOfIncorporation 
          ? data.countryOfIncorporation 
          : company?.countryOfIncorporation,
        address: data.address !== initialValues?.address 
          ? data.address 
          : company?.address,
        phone: data.phone !== initialValues?.phone 
          ? (data.phone ? `+251${data.phone}` : "") 
          : company?.phone,
        websiteUrl: data.websiteUrl !== initialValues?.websiteUrl 
          ? data.websiteUrl 
          : company?.websiteUrl,
        numberOfEmployees: data.numberOfEmployees !== initialValues?.numberOfEmployees 
          ? data.numberOfEmployees 
          : truncateEmployeeSize(company?.numberOfEmployees),
        otherDescription: data.otherDescription !== initialValues?.otherDescription 
          ? data.otherDescription 
          : company?.otherDescription,
        accreditation: company?.accreditation || "",
        license: company?.license || ""
      };
      
      const response = await axios.put(
        `${process.env.NEXT_PUBLIC_API}/company-profile/edit/${id}`,
        formattedData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`
          },
        }
      );
      
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Success", { description: data.message });
      queryClient.invalidateQueries({ queryKey: ["company-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["my-company-profile"] });
    },
    onError: (error: any) => {
      let errorMessage = "Failed to update profile. Please try again.";
      
      if (error && typeof error === 'object') {
        const axiosError = error as any;
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.message) {
          errorMessage = axiosError.message;
        }
        
        if (axiosError.response?.data) {
          const validationErrors = Object.entries(axiosError.response.data)
            .filter(([key]) => key !== 'code' && key !== 'message')
            .map(([field, message]) => `${field}: ${message}`)
            .join('\n');
            
          if (validationErrors) {
            console.log("Validation errors:", validationErrors);
          }
        }
      }
      
      toast.error(errorMessage);
    }
  });
}

export function useDeleteCompanyProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const token = getCookie('token');
      const response = await axios.delete(
        `${process.env.NEXT_PUBLIC_API}/company-profile/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      toast.success("Success", { description: data.message });
      queryClient.invalidateQueries({ queryKey: ["company-profiles"] });
    },
    onError: (error: any) => {
      toast.error("Error", {
        description: error.message || "Failed to delete company profile"
      });
    }
  });
}




