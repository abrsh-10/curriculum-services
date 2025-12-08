/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  companyProfileSchema,
  CompanyProfileFormSchema,
} from "@/types/company-profile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUpdateCompanyProfile, useGetMyCompanyProfile } from "@/lib/hooks/useCompanyProfile";
import { useParams, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBusinessTypes } from "@/lib/hooks/useBusinessTypes";
import { toast } from "sonner";
import { Loading } from "@/components/ui/loading";


const Company = () => {
  const router = useRouter();
  const { companyId } = useParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialValues, setInitialValues] = useState<Partial<CompanyProfileFormSchema> | null>(null);

  const {
    register,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CompanyProfileFormSchema>({
    resolver: zodResolver(companyProfileSchema),
  });
  
  // Use our consolidated hook instead of the one from useFetchCompanyProfiles
  const {
    data: company,
    isLoading: isFetchingCompanyProfile,
  } = useGetMyCompanyProfile();

  // Use the updated hook
  const updateCompanyProfile = useUpdateCompanyProfile();

  // Fetch business types and industry types
  const { businessTypes, industryTypes, isLoading: isLoadingBusinessTypes } = useBusinessTypes();

  // Watch all form values to determine if there are changes
  const formValues = watch();

  useEffect(() => {
    if (initialValues && Object.keys(initialValues).length > 0) {
      // Compare current form values with initial values
      const valueChanged = Object.keys(formValues).some(key => {
        const initialValue = initialValues[key as keyof CompanyProfileFormSchema];
        const currentValue = formValues[key as keyof CompanyProfileFormSchema];
        
        // Special case for objects like businessType and industryType
        if (
          (key === 'businessType' || key === 'industryType') && 
          typeof initialValue === 'object' && 
          initialValue !== null &&
          typeof currentValue === 'object' && 
          currentValue !== null
        ) {
          return (initialValue as any).id !== (currentValue as any).id;
        }
        
        return initialValue !== currentValue;
      });
      
      setHasChanges(valueChanged);
    }
  }, [formValues, initialValues]);

  useEffect(() => {
    if (!isFetchingCompanyProfile && company) {
      const mapNumberOfEmployees = (employeeSize: string | undefined) => {
        if (!employeeSize) return undefined;
        if (employeeSize.includes("MICRO")) return "MICRO";
        if (employeeSize.includes("SMALL")) return "SMALL";
        if (employeeSize.includes("MEDIUM")) return "MEDIUM";
        if (employeeSize.includes("LARGE")) return "LARGE";
        return undefined;
      };

      const numberOfEmployees = mapNumberOfEmployees(company.numberOfEmployees);
      
      // Extract phone number without country code if it exists
      const phoneNumber = company.phone?.startsWith("+251") 
        ? company.phone.slice(4) 
        : company.phone || "";

      const formData: Partial<CompanyProfileFormSchema> = {
        name: company.name || "",
        phone: phoneNumber,
        address: company.address || "",
        websiteUrl: company.websiteUrl || "",
        countryOfIncorporation: company.countryOfIncorporation || "",
        taxIdentificationNumber: company.taxIdentificationNumber || "",
        industryType: company.industryType || undefined,
        businessType: company.businessType || undefined,
        numberOfEmployees: numberOfEmployees as "MICRO" | "SMALL" | "MEDIUM" | "LARGE" | undefined,
        otherDescription: company.otherDescription || "",
      };

      // Store initial values for change detection
      setInitialValues(formData);
      reset(formData);
    }
  }, [isFetchingCompanyProfile, company, reset]);

  const onBack = () => {
    router.push(`/`);
  };

  // Add a simple direct handler for the button
  const handleEditClick = async () => {
    // Check if submission should be prevented
    if (isSubmitting || !hasChanges) {
      return;
    }
    
    // Get the current form values directly instead of using handleSubmit
    const data = formValues;
    setIsSubmitting(true);
    
    // Ensure businessType and industryType are valid objects with id property
    if (!data.businessType || typeof data.businessType !== 'object' || !data.businessType.id) {
      toast.error("Business Type is required");
      setIsSubmitting(false);
      return;
    }

    if (!data.industryType || typeof data.industryType !== 'object' || !data.industryType.id) {
      toast.error("Industry Type is required");
      setIsSubmitting(false);
      return;
    }

    try {
      await updateCompanyProfile.mutateAsync({
        id: companyId as string,
        data,
        initialValues,
        company
      });
      
      setHasChanges(false);
      setIsSubmitting(false);
      setInitialValues(data);
    } catch (error) {
      // Error is already handled by the mutation's onError callback
      setIsSubmitting(false);
    }
  };

  // Show loading while fetching initial data
  if (isFetchingCompanyProfile || isLoadingBusinessTypes) {
    return <Loading />;
  }

  return (
    <div className="lg:px-16 md:px-14 px-4 lg:mt-12 mt-6 flex flex-col gap-4">
      <div className="sm:pl-12">
        <div className="bg-[#fbfbfb] rounded-xl">
          <div className="lg:flex rounded-xl  lg:justify-center">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleEditClick();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                }
              }}
              className="flex flex-col lg:grid lg:grid-cols-2 xl:gap-x-16 lg:gap-y-8 gap-y-6 gap-x-4 lg:w-full py-10 lg:px-16 md:px-10 sm:px-8 px-3 items-start"
            >
              <div className="col-span-2 w-full">
                <p className="font-semibold md:text-xl text-base">
                  Company Profile
                </p>
                <p className="text-[#9C9791] text-xs">
                  Please enter all relevant attributes of your company
                </p>
              </div>
              <div className="space-y-2 w-full pt-1">
                <Label htmlFor="companyName">
                  <p className="md:text-[1rem] text-sm font-semibold pb-[2px]">
                    Company Name
                  </p>
                  <p className="text-[#9C9791] text-xs font-light">
                    Please enter the name of the company
                  </p>
                </Label>
                <Input
                  id="companyName"
                  placeholder=""
                  {...register("name")}
                  className="w-full text-sm md:text-base"
                  isError={!!errors.name}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2 w-full pt-1">
                <Label htmlFor="contactPhone">
                  <p className="md:text-[1rem] text-sm font-semibold pb-[2px]">
                    Contact Phone
                  </p>
                  <p className="text-[#9C9791] text-xs font-light">
                    Please enter the phone number
                  </p>
                </Label>
                <div className="flex gap-2">
                  <Input className="w-[100px]" value="+251" disabled />
                  <div className="w-full">
                    <Input
                      id="contactPhone"
                      placeholder="9XXXXXXXX or 7XXXXXXXX"
                      {...register("phone")}
                      className="flex-1 text-sm md:text-base"
                      maxLength={9}
                      isError={!!errors.phone}
                    />
                  </div>
                </div>
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone.message}</p>
                )}
              </div>

              <div className="space-y-2 w-full pt-1">
                <Label htmlFor="countryOfIncorporation">
                  <p className="md:text-[1rem] text-sm font-semibold pb-[2px]">
                    Country of Incorporation
                  </p>
                  <p className="text-[#9C9791] text-xs font-light">
                    Please select the country where the company is incorporated
                  </p>
                </Label>
                <Input
                  id="countryOfIncorporation"
                  placeholder=""
                  {...register("countryOfIncorporation")}
                  className="w-full text-sm md:text-base"
                  isError={!!errors.countryOfIncorporation}
                />
                {errors.countryOfIncorporation && (
                  <p className="text-sm text-red-500">
                    {errors.countryOfIncorporation.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 w-full pt-1">
                <Label htmlFor="taxIdentificationNumber">
                  <p className="md:text-[1rem] text-sm   font-semibold pb-[2px]">
                    Tax Identification Number
                  </p>
                  <p className="text-[#9C9791] text-xs font-light">
                    Please enter the TIN (10 digits)
                  </p>
                </Label>
                <Input
                  id="taxIdentificationNumber"
                  placeholder=""
                  {...register("taxIdentificationNumber")}
                  className="w-full text-sm md:text-base"
                  isError={!!errors.taxIdentificationNumber}
                  maxLength={10}
                  minLength={10}
                />
                {errors.taxIdentificationNumber && (
                  <p className="text-sm text-red-500">
                    {errors.taxIdentificationNumber.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 w-full pt-1">
                <Label htmlFor="companyAddress">
                  <p className="md:text-[1rem] text-sm font-semibold pb-[2px]">
                    Company Address
                  </p>
                  <p className="text-[#9C9791] text-xs font-light">
                    Please enter the company&apos;s address
                  </p>
                </Label>
                <Input
                  id="companyAddress"
                  placeholder=""
                  {...register("address")}
                  className="w-full text-sm md:text-base"
                  isError={!!errors.address}
                />
                {errors.address && (
                  <p className="text-sm text-red-500">
                    {errors.address.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 w-full pt-1">
                <Label htmlFor="companyWebsite">
                  <p className="md:text-[1rem] text-sm font-semibold pb-[2px]">
                    Company Website Link
                    <span className="text-brand text-sm font-light">
                      &nbsp;(optional)
                    </span>
                  </p>
                  <p className="text-[#9C9791] text-xs font-light">
                    Please enter the website URL
                  </p>
                </Label>
                <Input
                  id="companyWebsite"
                  placeholder=""
                  {...register("websiteUrl")}
                  className="w-full text-sm md:text-base"
                  isError={!!errors.websiteUrl}
                />
                {errors.websiteUrl && (
                  <p className="text-sm text-red-500">
                    {errors.websiteUrl.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 w-full pt-1">
                <Label htmlFor="industryType">
                  <p className="md:text-[1rem] text-sm font-semibold pb-[2px]">
                    Industry Type
                  </p>
                  <p className="text-[#9C9791] text-xs font-light">
                    Please select your industry type
                  </p>
                </Label>
                <Select
                  onValueChange={(value) => {
                    const selected = industryTypes.find(
                      (type) => type.id === value
                    );
                    if (selected) {
                      setValue("industryType", selected);
                    }
                  }}
                  value={watch("industryType")?.id}
                >
                  <SelectTrigger className="w-full h-12">
                    <SelectValue
                      placeholder="Select"
                      className="text-sm md:text-base"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {industryTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.industryType && (
                  <p className="text-sm text-red-500">
                    {errors.industryType.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 w-full pt-1">
                <Label htmlFor="businessType">
                  <p className="md:text-[1rem] text-sm font-semibold pb-[2px]">
                    Business Type
                  </p>
                  <p className="text-[#9C9791] text-xs font-light">
                    Please select your business type
                  </p>
                </Label>
                <Select
                  onValueChange={(value) => {
                    const selected = businessTypes.find(
                      (type) => type.id === value
                    );
                    if (selected) {
                      setValue("businessType", selected);
                    }
                  }}
                  value={watch("businessType")?.id}
                >
                  <SelectTrigger className="w-full h-12">
                    <SelectValue
                      placeholder="Select"
                      className="text-sm md:text-base"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {businessTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.businessType && (
                  <p className="text-sm text-red-500">
                    {errors.businessType.message}
                  </p>
                )}
              </div>

              <div className="space-y-2 w-full pt-1">
                <Label htmlFor="employeeCount">
                  <p className="md:text-[1rem] text-sm font-semibold pb-[2px]">
                    Number of Employees
                  </p>
                  <p className="text-[#9C9791] text-xs font-light">
                    Select the number of employees in your company
                  </p>
                </Label>
                <Select
                  onValueChange={(value) =>
                    setValue(
                      "numberOfEmployees",
                      value as "MICRO" | "SMALL" | "MEDIUM" | "LARGE"
                    )
                  }
                  value={watch("numberOfEmployees")}
                >
                  <SelectTrigger className="w-full h-12">
                    <SelectValue
                      placeholder="Select"
                      className="text-sm md:text-base"
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MICRO">Micro (1-9 employees)</SelectItem>
                    <SelectItem value="SMALL">Small (10-49 employees)</SelectItem>
                    <SelectItem value="MEDIUM">Medium (50-249 employees)</SelectItem>
                    <SelectItem value="LARGE">Large (250+ employees)</SelectItem>
                  </SelectContent>
                </Select>
                {errors.numberOfEmployees && (
                  <p className="text-sm text-red-500">
                    {errors.numberOfEmployees.message}
                  </p>
                )}
              </div>
              <div className="space-y-2 col-span-2 w-full pt-1">
                <Label htmlFor="otherDescription">
                  <p className="md:text-[1rem] text-sm  font-semibold pb-[2px]">
                    Other Description
                  </p>
                  <p className="text-[#9C9791] text-xs font-light">
                    Please enter any other description about your company
                  </p>
                </Label>
                <textarea
                  id="otherDescription"
                  placeholder="Enter description"
                  {...register("otherDescription")}
                  className="w-full min-h-[100px] p-2 border rounded-md text-sm md:text-base"
                />
                {errors.otherDescription && (
                  <p className="text-sm text-red-500">
                    {errors.otherDescription.message}
                  </p>
                )}
              </div>

              <div className="space-x-10 lg:mt-10 mt-2 col-span-2 w-full flex justify-center">
                <Button
                  variant="secondary"
                  size="default"
                  className={cn(
                    `w-40 h-10 px-4 py-3 rounded-sm font-medium border border-[#9C9791] lg:mr-20 md:mr-10`
                  )}
                  type="button"
                  onClick={onBack}
                >
                  Back
                </Button>
                <Button
                  variant="default"
                  size="default"
                  disabled={
                    isFetchingCompanyProfile ||
                    isSubmitting ||
                    !hasChanges
                  }
                  onClick={handleEditClick}
                  type="button"
                  className={cn(
                    `w-40 h-10 px-4 py-3 rounded-sm font-medium text-white disabled:opacity-50`
                  )}
                >
                  {isSubmitting ? "Editing..." : "Edit"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Company;