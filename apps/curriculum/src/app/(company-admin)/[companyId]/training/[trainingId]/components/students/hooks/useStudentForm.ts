import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { studentFormSchema, StudentFormValues } from "../../../students/add/components/formSchemas"
import { useStudentById } from "@/lib/hooks/useStudents"

export function useStudentForm() {
  const [isEditing, setIsEditing] = useState(false)
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null)
  const [step, setStep] = useState(1)
  const formDataLoadedRef = useRef(false)

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      gender: undefined,
      dateOfBirth: undefined,
      hasSmartphone: false,
      smartphoneOwner: "",
      email: "",
      contactPhone: "",
      countryId: "",
      regionId: "",
      zoneId: "",
      cityId: "",
      woreda: "",
      houseNumber: "",
      languageId: "",
      academicLevelId: "",
      fieldOfStudy: "",
      hasTrainingExperience: false,
      trainingExperienceDescription: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      disabilityIds: [],
      marginalizedGroupIds: [],
      hasDisability: null,
      belongsToMarginalizedGroup: null,
    },
    mode: "onChange"
  })

  const { data: studentData, isLoading: isLoadingStudent } = useStudentById(
    isEditing && currentStudentId ? currentStudentId : ''
  )

  // Memoize student form data preparation
  const studentFormData = useMemo(() => {
    if (!isEditing || !studentData?.trainee || !currentStudentId) {
      return null;
    }
    
    const student = studentData.trainee;
    
    // Format date to Date object
    let dateOfBirth: Date | undefined = undefined;
    try {
      if (student.dateOfBirth) {
        dateOfBirth = new Date(student.dateOfBirth);
      }
    } catch (error) {
      console.log("Invalid date:", error);
    }
    
    // Check if student has disabilities
    const hasDisability = student.disabilities && student.disabilities.length > 0;
    const disabilityIds = hasDisability 
      ? student.disabilities.map(d => d.id) 
      : [];
    
    // Check if student belongs to marginalized groups
    const belongsToMarginalizedGroup = student.marginalizedGroups && student.marginalizedGroups.length > 0;
    const marginalizedGroupIds = belongsToMarginalizedGroup
      ? student.marginalizedGroups.map(g => g.id)
      : [];
    
    return {
      firstName: student.firstName || "",
      middleName: student.middleName || "",
      lastName: student.lastName || "",
      email: student.email || "",
      contactPhone: student.contactPhone || "",
      dateOfBirth: dateOfBirth,
      gender: (() => {
        if (!student.gender) return undefined;
        const normalized = student.gender.trim().toUpperCase();
        return (normalized === "MALE" || normalized === "FEMALE") ? (normalized as "MALE" | "FEMALE") : undefined;
      })(),
      countryId: student.city?.zone?.region?.country?.id || student.zone?.region?.country?.id || undefined,
      regionId: student.city?.zone?.region?.id || student.zone?.region?.id || undefined,
      zoneId: student.city?.zone?.id || student.zone?.id || undefined,
      cityId: student.city?.id || undefined,
      woreda: student.woreda || "",
      houseNumber: student.houseNumber || "",
      languageId: student.language?.id ?? undefined,
      academicLevelId: student.academicLevel?.id || undefined,
      fieldOfStudy: student.fieldOfStudy || "",
      hasSmartphone: student.hasSmartphone || false,
      smartphoneOwner: "",
      hasTrainingExperience: student.hasTrainingExperience || false,
      trainingExperienceDescription: student.trainingExperienceDescription || "",
      emergencyContactName: student.emergencyContactName || "",
      emergencyContactPhone: student.emergencyContactPhone || "",
      emergencyContactRelationship: student.emergencyContactRelationship || "",
      hasDisability: hasDisability,
      disabilityIds: disabilityIds,
      belongsToMarginalizedGroup: belongsToMarginalizedGroup,
      marginalizedGroupIds: marginalizedGroupIds,
    }
  }, [studentData, isEditing, currentStudentId]);

  // Reset form data loaded ref when editing state changes
  useEffect(() => {
    if (!isEditing) {
      formDataLoadedRef.current = false;
    }
  }, [isEditing]);

  // Update form when student data is loaded
  useEffect(() => {
    if (studentFormData && isEditing && !formDataLoadedRef.current) {
      form.reset(studentFormData);
      formDataLoadedRef.current = true;
    }
  }, [form, studentFormData, isEditing]);

  const resetForm = useCallback(() => {
    form.reset({
      firstName: "",
      middleName: "",
      lastName: "",
      gender: undefined,
      dateOfBirth: undefined,
      hasSmartphone: false,
      smartphoneOwner: "",
      email: "",
      contactPhone: "",
      countryId: "",
      regionId: "",
      zoneId: "",
      cityId: "",
      woreda: "",
      houseNumber: "",
      languageId: "",
      academicLevelId: "",
      fieldOfStudy: "",
      hasTrainingExperience: false,
      trainingExperienceDescription: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelationship: "",
      disabilityIds: [],
      marginalizedGroupIds: [],
      hasDisability: null,
      belongsToMarginalizedGroup: null,
    });
  }, [form]);

  const startEdit = useCallback((studentId: string) => {
    formDataLoadedRef.current = false;
    setCurrentStudentId(studentId);
    setIsEditing(true);
    setStep(1);
  }, []);

  const startAdd = useCallback(() => {
    formDataLoadedRef.current = false;
    setIsEditing(false);
    setCurrentStudentId(null);
    setStep(1);
    resetForm();
  }, [resetForm]);

  const validateStep = useCallback(async () => {
    let isValid = false;
    
    switch (step) {
      case 1: {
        const fieldsToValidate: (keyof StudentFormValues)[] = [
          "firstName", 
          "lastName", 
          "dateOfBirth", 
          "gender", 
          "languageId",
          "hasSmartphone",
        ];
        
        if (form.getValues("hasSmartphone")) {
          fieldsToValidate.push("smartphoneOwner");
        }
        
        isValid = await form.trigger(fieldsToValidate);
        break;
      }
      case 2:
        isValid = await form.trigger([
          "email", 
          "contactPhone", 
          "countryId",
          "regionId",
          "zoneId",
          "cityId", 
          "woreda",
          "houseNumber"
        ]);
        break;
      case 3:
        isValid = await form.trigger([
          "academicLevelId",
          "fieldOfStudy",
          "hasTrainingExperience",
          ...(form.getValues("hasTrainingExperience") ? ["trainingExperienceDescription" as const] : [])
        ]);
        break;
      case 4:
        isValid = await form.trigger([
          "emergencyContactName",
          "emergencyContactPhone",
          "emergencyContactRelationship",
        ]);
        break;
      case 5:
        const fieldsToValidateStep5: (keyof StudentFormValues)[] = [
          "hasDisability", 
          "belongsToMarginalizedGroup"
        ];
        if (form.getValues("hasDisability") === true) {
           fieldsToValidateStep5.push("disabilityIds");
        }
        if (form.getValues("belongsToMarginalizedGroup") === true) {
           fieldsToValidateStep5.push("marginalizedGroupIds");
        }

        isValid = await form.trigger(fieldsToValidateStep5);
        break;
    }
    
    return isValid;
  }, [form, step]);

  return {
    form,
    step,
    setStep,
    isEditing,
    currentStudentId,
    isLoadingStudent,
    startEdit,
    startAdd,
    validateStep,
    resetForm,
  }
}

