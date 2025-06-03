/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { X } from "lucide-react"

interface BaseItem {
  id: string
  name: string
  description: string
}

interface PrerequisiteData {
  languageId?: string
  educationLevelId?: string
  specificCourseList?: string[]
  certifications?: string
  licenses?: string
  workExperienceId?: string
  specificPrerequisites?: string[]
}

interface PrerequisitesProps {
  trainingId: string
  initialData?: PrerequisiteData | null
  educationLevels: BaseItem[]
  languages: BaseItem[]
  workExperiences: BaseItem[]
  onSave: (data: PrerequisiteData) => Promise<void>
  onCancel: () => void
}

export function Prerequisites({ 
  trainingId, 
  initialData, 
  educationLevels, 
  languages, 
  workExperiences, 
  onSave, 
  onCancel 
}: PrerequisitesProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 states
  const [languageId, setLanguageId] = useState(initialData?.languageId || "");
  const [educationLevelId, setEducationLevelId] = useState(
    initialData?.educationLevelId || ""
  );
  const [specificCourseList, setSpecificCourseList] = useState<string[]>(
    initialData?.specificCourseList?.length
      ? initialData.specificCourseList
      : [""]
  );

  // Step 2 states
  const [certifications, setCertifications] = useState(
    initialData?.certifications || ""
  );
  const [licenses, setLicenses] = useState(initialData?.licenses || "");
  const [workExperienceId, setWorkExperienceId] = useState(
    initialData?.workExperienceId || ""
  );

  // Step 3 states
  const [specificPrerequisites, setSpecificPrerequisites] = useState<string[]>(
    initialData?.specificPrerequisites?.length
      ? initialData.specificPrerequisites
      : []
  );
  const [hasPrerequisites, setHasPrerequisites] = useState<"yes" | "no" | null>(
    initialData?.specificPrerequisites?.length ? "yes" : "no"
  );

  useEffect(() => {
    if (hasPrerequisites === "yes" && specificPrerequisites.length === 0) {
      setSpecificPrerequisites([""]);
    }
  }, [hasPrerequisites, specificPrerequisites.length]);

  // Validation logic
  const isStep1Valid = useMemo(() => {
    return (
      languageId ||
      educationLevelId ||
      specificCourseList.some((course) => course.trim() !== "")
    );
  }, [languageId, educationLevelId, specificCourseList]);

  const isStep2Valid = useMemo(() => {
    return certifications || licenses || workExperienceId;
  }, [certifications, licenses, workExperienceId]);

  const isStep3Valid = useMemo(() => {
    if (hasPrerequisites === "yes") {
      return specificPrerequisites.some((prereq) => prereq.trim() !== "");
    }
    return true;
  }, [hasPrerequisites, specificPrerequisites]);

  // Get current step validation
  const isCurrentStepValid = useMemo(() => {
    switch (currentStep) {
      case 1:
        return isStep1Valid;
      case 2:
        return isStep2Valid;
      case 3:
        return isStep3Valid;
      default:
        return false;
    }
  }, [currentStep, isStep1Valid, isStep2Valid, isStep3Valid]);

  // Handle next step
  const handleNext = async () => {
    if (currentStep < 3) {
      setCurrentStep((prev) => prev + 1);
    } else {
      await handleSaveAndContinue();
    }
  };

  // Handle back
  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      onCancel();
    }
  };

  const handleSaveAndContinue = async () => {
    try {
      setIsSubmitting(true);
      await onSave({
        languageId: languageId || undefined,
        educationLevelId: educationLevelId || undefined,
        specificCourseList: specificCourseList.filter(
          (course) => course.trim() !== ""
        ),
        certifications: certifications || undefined,
        licenses: licenses || undefined,
        workExperienceId: workExperienceId || undefined,
        specificPrerequisites:
          hasPrerequisites === "yes"
            ? specificPrerequisites.filter((prereq) => prereq.trim() !== "")
            : [],
      });
    } catch (error) {
      console.error("Error saving prerequisites:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper functions for managing form arrays
  const addSpecificCourse = () => {
    setSpecificCourseList([...specificCourseList, ""]);
  };

  const updateSpecificCourse = (index: number, value: string) => {
    const newCourses = [...specificCourseList];
    newCourses[index] = value;
    setSpecificCourseList(newCourses);
  };

  const removeSpecificCourse = (index: number) => {
    setSpecificCourseList(specificCourseList.filter((_, i) => i !== index));
  };

  const addSpecificPrerequisite = () => {
    setSpecificPrerequisites([...specificPrerequisites, ""]);
  };

  const updateSpecificPrerequisite = (index: number, value: string) => {
    const newPrerequisites = [...specificPrerequisites];
    newPrerequisites[index] = value;
    setSpecificPrerequisites(newPrerequisites);
  };

  const removeSpecificPrerequisite = (index: number) => {
    setSpecificPrerequisites(
      specificPrerequisites.filter((_, i) => i !== index)
    );
  };

  // Rendering the steps content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold">
              Entry Requirements/Prerequisites (Step 1 of 3)
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">
                  1. Language Proficiency
                </label>
                <span className="text-xs text-blue-500">(Optional)</span>
              </div>
              <p className="text-sm text-gray-500">
                What language is the course to be taught in?
              </p>
              <Select value={languageId} onValueChange={setLanguageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id}>
                      {lang.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-medium">2. Academics</label>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    Minimum Education Level
                  </p>
                  <Select
                    value={educationLevelId}
                    onValueChange={setEducationLevelId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      {educationLevels.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Specific Courses</p>
                  {specificCourseList.map((course, index) => (
                    <div key={index} className="relative">
                      <Input
                        value={course}
                        onChange={(e) =>
                          updateSpecificCourse(index, e.target.value)
                        }
                        placeholder="Enter course name"
                        className="pr-10"
                      />
                      {specificCourseList.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSpecificCourse(index)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-red-50 hover:bg-red-100 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    onClick={addSpecificCourse}
                    variant="link"
                    className="text-brand"
                  >
                    + Add more courses
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold">
              Entry Requirements/Prerequisites (Step 2 of 3)
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">
                  3. Training Programs
                </label>
                <span className="text-xs text-blue-500">(Optional)</span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Certifications</p>
                  <Input
                    value={certifications}
                    onChange={(e) => setCertifications(e.target.value)}
                    placeholder="Enter certification requirements"
                  />
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Licenses</p>
                  <Input
                    value={licenses}
                    onChange={(e) => setLicenses(e.target.value)}
                    placeholder="Enter license requirements"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">
                  4. Work Experience
                </label>
                <span className="text-xs text-blue-500">(Optional)</span>
              </div>
              <Select
                value={workExperienceId}
                onValueChange={setWorkExperienceId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select work experience" />
                </SelectTrigger>
                <SelectContent>
                  {workExperiences.map((experience) => (
                    <SelectItem key={experience.id} value={experience.id}>
                      {experience.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-8">
            <h2 className="text-xl font-semibold">
              Entry Requirements/Prerequisites (Step 3 of 3)
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">
                  5. Additional Prerequisites
                </label>
                <span className="text-xs text-blue-500">(Optional)</span>
              </div>
              <p className="text-sm text-gray-500">
                Are there any additional specific prerequisites?
              </p>
              <div className="flex space-x-4">
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="prereq-yes"
                    checked={hasPrerequisites === "yes"}
                    onChange={() => setHasPrerequisites("yes")}
                  />
                  <label htmlFor="prereq-yes">Yes</label>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    id="prereq-no"
                    checked={hasPrerequisites === "no"}
                    onChange={() => setHasPrerequisites("no")}
                  />
                  <label htmlFor="prereq-no">No</label>
                </div>
              </div>

              {hasPrerequisites === "yes" && (
                <div className="space-y-2 mt-4">
                  {specificPrerequisites.map((prereq, index) => (
                    <div key={index} className="relative">
                      <Input
                        value={prereq}
                        onChange={(e) =>
                          updateSpecificPrerequisite(index, e.target.value)
                        }
                        placeholder="Enter specific prerequisite"
                        className="pr-10"
                      />
                      {specificPrerequisites.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSpecificPrerequisite(index)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-red-50 hover:bg-red-100 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    onClick={addSpecificPrerequisite}
                    variant="link"
                    className="text-brand"
                  >
                    + Add more prerequisites
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {renderStepContent()}

      <div className="flex justify-between gap-4 pt-8">
        <Button
          variant="outline"
          onClick={currentStep === 1 ? onCancel : handleBack}
          disabled={isSubmitting}
        >
          {currentStep === 1 ? "Cancel" : "Back"}
        </Button>
        <Button
          onClick={handleNext}
          className="bg-brand text-white"
          disabled={!isCurrentStepValid || isSubmitting}
        >
          {isSubmitting ? "Saving..." : currentStep === 3 ? "Save" : "Next"}
        </Button>
      </div>
    </>
  );
} 