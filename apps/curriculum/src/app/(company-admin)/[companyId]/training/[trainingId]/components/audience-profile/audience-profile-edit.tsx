/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useMemo } from "react"
import { OutlineSidebar } from "@/components/ui/outline-sidebar"
import { EditFormContainer } from "@/components/ui/edit-form-container"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useCreateAudienceProfile, useUpdateAudienceProfile } from "@/lib/hooks/useAudienceProfileMutations"
import { Prerequisites } from "./steps/prerequisites"

interface BaseItem {
  id: string
  name: string
  description: string
}

interface AudienceProfile {
  id: string
  trainingId: string
  learnerLevel: BaseItem
  language?: BaseItem
  educationLevel?: BaseItem
  specificCourseList?: string[]
  certifications?: string
  licenses?: string
  workExperience?: BaseItem
  specificPrerequisites?: string[]
}



interface AudienceProfileEditProps {
  trainingId: string
  initialData: AudienceProfile | null
  learnerLevels: BaseItem[]
  educationLevels: BaseItem[]
  languages: BaseItem[]
  workExperiences: BaseItem[]
  onSave: () => void
  onCancel: () => void
}

export function AudienceProfileEdit({ 
  trainingId, 
  initialData, 
  learnerLevels,
  educationLevels,
  languages,
  workExperiences,
  onSave, 
  onCancel 
}: AudienceProfileEditProps) {

  const [activeSection, setActiveSection] = useState("Learning Level")
  const [learnerLevelId, setLearnerLevelId] = useState("")

  const [isMobile, setIsMobile] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [completedSections, setCompletedSections] = useState<string[]>([])

  const createProfile = useCreateAudienceProfile()
  const updateProfile = useUpdateAudienceProfile(initialData?.id || "")

  useEffect(() => {
    if (initialData) {
      setLearnerLevelId(initialData.learnerLevel?.id || "")

      const completed: string[] = []
      
      if (initialData.learnerLevel?.id) {
        completed.push("Learning Level")
      }
      
      // Check if prerequisites are completed
      if (initialData.language?.id || initialData.educationLevel?.id || 
          initialData.specificCourseList?.length || initialData.certifications || 
          initialData.licenses || initialData.workExperience?.id || 
          initialData.specificPrerequisites?.length) {
        completed.push("Prerequisites")
      }
      
      setCompletedSections(completed)
    }

    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [initialData])

  const isCurrentSectionValid = useMemo(() => {
    switch (activeSection) {
      case "Learning Level":
        return !!learnerLevelId
      default:
        return false
    }
  }, [
    activeSection,
    learnerLevelId
  ])

  const outlineGroups = [
    {
      title: "Learner Information",
      items: [
        { label: "Learning Level", isCompleted: completedSections.includes("Learning Level") || !!learnerLevelId }
      ]
    },
    {
      title: "Prerequisites",
      items: [
        { 
          label: "Prerequisites", 
          isCompleted: completedSections.includes("Prerequisites")
        }
      ]
    }
  ]

  const renderMobileHeader = () => {
    if (!isMobile) return null
    
    if (showSidebar) {
      return (
        <div className="fixed top-0 left-0 right-0 bg-white z-[51] flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-medium">Audience Profile Outline</h2>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowSidebar(false)}
            className="hover:bg-transparent"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 mb-6">
        <Button 
          variant="ghost"
          className="text-brand flex items-center gap-2 hover:bg-transparent hover:text-brand p-0"
          onClick={() => setShowSidebar(true)}
        >
          <Menu className="h-5 w-5" />
          <span>Audience Profile Outline</span>
        </Button>
      </div>
    )
  }

  const handleSaveLearnerLevel = async () => {
    if (isCurrentSectionValid) {
      setCompletedSections(prev => [...prev, activeSection])
      setActiveSection("Prerequisites")
    }
  }

  const handleSavePrerequisites = async (data: any) => {
    // Mark section as completed
    setCompletedSections(prev => 
      prev.includes("Prerequisites") ? prev : [...prev, "Prerequisites"]
    )
    
    // Save all audience profile data with the correct structure (IDs, not objects)
    const profileData = {
      learnerLevelId,
      languageId: data.languageId,
      educationLevelId: data.educationLevelId,
      specificCourseList: data.specificCourseList,
      certifications: data.certifications,
      licenses: data.licenses,
      workExperienceId: data.workExperienceId,
      specificPrerequisites: data.specificPrerequisites
    }

    try {
      if (initialData?.id) {
        await updateProfile.mutateAsync(profileData)
        toast.success("Audience profile updated successfully")
      } else {
        await createProfile.mutateAsync(profileData)
        toast.success("Audience profile created successfully")
      }
      onSave()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const renderContent = () => {
    switch (activeSection) {
      case "Learning Level":
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-xl font-semibold ">Learner Level</label>
              <Select value={learnerLevelId} onValueChange={setLearnerLevelId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a learner level" />
                </SelectTrigger>
                <SelectContent>
                  {learnerLevels.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-4 pt-8">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button 
                onClick={handleSaveLearnerLevel} 
                className="bg-brand text-white"
                disabled={!isCurrentSectionValid}
              >
                Next
              </Button>
            </div>
          </div>
        );
      case "Prerequisites":
        return (
          <Prerequisites
            trainingId={trainingId}
            initialData={initialData ? {
              languageId: initialData.language?.id,
              educationLevelId: initialData.educationLevel?.id,
              specificCourseList: initialData.specificCourseList,
              certifications: initialData.certifications,
              licenses: initialData.licenses,
              workExperienceId: initialData.workExperience?.id,
              specificPrerequisites: initialData.specificPrerequisites
            } : null}
            educationLevels={educationLevels}
            languages={languages}
            workExperiences={workExperiences}
            onSave={handleSavePrerequisites}
            onCancel={() => setActiveSection("Learning Level")}
          />
        );
      default:
        return null
    }
  }

  return (
    <div className={cn(
      "px-[7%] py-10",
      isMobile ? "block" : "flex gap-8"
    )}>
      {renderMobileHeader()}
      
      {(!isMobile || showSidebar) && (
        <div className={cn(
          "",
          isMobile ? "fixed bg-white inset-0 z-50 pt-16 px-4 pb-4" : "w-[300px]"
        )}>
          <OutlineSidebar 
            title="Audience Profile Outline"
            groups={outlineGroups}
            activeItem={activeSection}
            onItemClick={(section) => {
              setActiveSection(section)
              if (isMobile) setShowSidebar(false)
            }}
          />
        </div>
      )}

      <EditFormContainer
        title=""
        description=""
      >
        {renderContent()}
      </EditFormContainer>
    </div>
  )
}
