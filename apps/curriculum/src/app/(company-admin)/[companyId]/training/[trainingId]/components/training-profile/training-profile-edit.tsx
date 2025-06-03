/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState, useEffect, useMemo } from "react"
import { OutlineSidebar } from "@/components/ui/outline-sidebar"
import { EditFormContainer } from "@/components/ui/edit-form-container"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, Menu } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { useCreateTrainingProfile, useUpdateTrainingProfile } from "@/lib/hooks/useTrainingProfileMutations"
import { TrainingProfile } from "@/lib/hooks/useTrainingProfile"
import { useBaseData } from "@/lib/hooks/useBaseData"
import { Checkbox } from "@/components/ui/checkbox"
import { Objective } from "./components/objective"
import { useObjective } from "@/lib/hooks/useObjective"

// Define interfaces for the base data items
interface BaseItem {
  id: string
  name: string
  description: string
  technologicalRequirementType?: 'LEARNER' | 'INSTRUCTOR'
}

interface TrainingProfileEditProps {
  trainingId: string
  initialData: TrainingProfile | null
  onSave: () => void
  onCancel: () => void
}

export function TrainingProfileEdit({ trainingId, initialData, onSave, onCancel }: TrainingProfileEditProps): JSX.Element {
  // Regular state variables
  const [keywords, setKeywords] = useState<string[]>([])
  const [scope, setScope] = useState("")
  const [professionalBackground, setProfessionalBackground] = useState("")
  const [selectedDeliveryTools, setSelectedDeliveryTools] = useState<string[]>([])
  const [selectedLearnerTechRequirements, setSelectedLearnerTechRequirements] = useState<string[]>([])
  const [selectedInstructorTechRequirements, setSelectedInstructorTechRequirements] = useState<string[]>([])
  const [selectedLearnerStylePreferences, setSelectedLearnerStylePreferences] = useState<string[]>([])
  const [hasPriorKnowledge, setHasPriorKnowledge] = useState<"Yes" | "No" | "">("")
  const [priorKnowledge, setPriorKnowledge] = useState<string[]>([])
  const [attendanceRequirementPercentage, setAttendanceRequirementPercentage] = useState<number>(100)
  const [hasSetAttendanceRequirement, setHasSetAttendanceRequirement] = useState<boolean>(false)
  const [isMobile, setIsMobile] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [selectedAlignmentStandards, setSelectedAlignmentStandards] = useState<string[]>([])

  // Fetch base data for the new fields
  const { data: deliveryTools, isLoading: isLoadingDeliveryTools } = useBaseData('delivery-tool')
  const { data: technologicalRequirements, isLoading: isLoadingTechRequirements } = useBaseData('technological-requirement')
  const { data: learnerStylePreferences, isLoading: isLoadingLearnerStylePreferences } = useBaseData('learner-style-preference')
  const { data: alignmentStandards, isLoading: isLoadingAlignmentStandards } = useBaseData('alignment-standard')

  const createProfile = useCreateTrainingProfile()
  const updateProfile = useUpdateTrainingProfile()

  const { data: objectiveData } = useObjective(trainingId)

  // Filter technological requirements by type
  const learnerTechRequirements = useMemo(() => 
    technologicalRequirements?.filter((req: BaseItem) => req.technologicalRequirementType === 'LEARNER') || [], 
    [technologicalRequirements]
  )
  
  const instructorTechRequirements = useMemo(() => 
    technologicalRequirements?.filter((req: BaseItem) => req.technologicalRequirementType === 'INSTRUCTOR') || [], 
    [technologicalRequirements]
  )

  const isCreating = !initialData || (
    initialData.keywords.length === 0 &&
    !initialData.scope &&
    !initialData.professionalBackground &&
    !initialData.alignmentStandardIds
  )

  // Add helper function to extract IDs from object arrays
  const extractIds = (
    items: Array<{id: string, name?: string, description?: string}> | string[] | string | null | undefined
  ): string[] => {
    if (!items) return [];
    
    // Handle string case
    if (typeof items === 'string') {
      return [items];
    }
    
    // If it's not an array, return empty array
    if (!Array.isArray(items)) {
      return [];
    }
    
    // Empty array case
    if (items.length === 0) {
      return [];
    }
    
    // If it's already an array of strings (IDs), return as is
    if (typeof items[0] === 'string') {
      return items as string[];
    }
    
    // If it's an array of objects with id property, extract the IDs
    return items.map((item: any) => item.id);
  };

  const outlineGroups = useMemo(() => [
    {
      title: "Course Definition",
      items: [
        { label: "Keywords", isCompleted: keywords.some(keyword => keyword.trim() !== "") },
        { label: "Scope", isCompleted: scope.trim().length > 0 },
        { label: "Attendance Requirement", isCompleted: hasSetAttendanceRequirement },
        { label: "Professional Background", isCompleted: professionalBackground.trim().length > 0 },
        { label: "Alignment With Standard", isCompleted: selectedAlignmentStandards.length > 0 }
      ]
    },
    {
      title: "Implementation",
      items: [
        { label: "Delivery Tools", isCompleted: selectedDeliveryTools.length > 0 },
        { label: "Technological Requirements", isCompleted: selectedLearnerTechRequirements.length > 0 || selectedInstructorTechRequirements.length > 0 }
      ]
    },
    {
      title: "Learner Information",
      items: [
        { label: "Prior Knowledge", isCompleted: hasPriorKnowledge === "Yes" ? priorKnowledge.some(item => item.trim() !== "") : hasPriorKnowledge === "No" },
        { label: "Learning Style Preferences", isCompleted: selectedLearnerStylePreferences.length > 0 }
      ]
    },
    {
      title: "Objectives",
      items: [
        { 
          label: "Training Objectives", 
          isCompleted: !!objectiveData?.generalObjective
        }
      ]
    }
  ], [keywords, scope, hasSetAttendanceRequirement, professionalBackground, selectedAlignmentStandards, selectedDeliveryTools, selectedLearnerTechRequirements, selectedInstructorTechRequirements, hasPriorKnowledge, priorKnowledge, selectedLearnerStylePreferences, objectiveData])

  // Initialize activeSection after outlineGroups is defined
  const [activeSection, setActiveSection] = useState("Keywords")

  useEffect(() => {
    // Initialize form with existing data, handling null values
    if (initialData && !isCreating) {
      setKeywords(initialData.keywords && initialData.keywords.length > 0 ? initialData.keywords : [""])
      setScope(initialData.scope || "")
      setProfessionalBackground(initialData.professionalBackground || "")
      setAttendanceRequirementPercentage(initialData.attendanceRequirementPercentage ?? 100)
      setHasSetAttendanceRequirement(initialData.attendanceRequirementPercentage !== null && initialData.attendanceRequirementPercentage !== undefined)
      
      // Extract IDs from object arrays for the checkbox fields
      const alignmentIds = initialData.alignmentStandardIds || extractIds(initialData.alignmentsWithStandard)
      const deliveryToolIds = initialData.deliveryToolIds || extractIds(initialData.deliveryTools)
      const learnerTechIds = initialData.technologicalRequirementIds 
        ? initialData.technologicalRequirementIds.filter(id => 
            technologicalRequirements?.some((req: BaseItem) => req.id === id && req.technologicalRequirementType === 'LEARNER')
          )
        : extractIds(initialData.learnerTechnologicalRequirements)
      const instructorTechIds = initialData.technologicalRequirementIds 
        ? initialData.technologicalRequirementIds.filter(id => 
            technologicalRequirements?.some((req: BaseItem) => req.id === id && req.technologicalRequirementType === 'INSTRUCTOR')
          )
        : extractIds(initialData.instructorTechnologicalRequirements)
      const learnerStyleIds = initialData.learnerStylePreferenceIds || extractIds(initialData.learnerStylePreferences)
      
      // Set the state variables with the extracted IDs
      setSelectedAlignmentStandards(alignmentIds)
      setSelectedDeliveryTools(deliveryToolIds)
      setSelectedLearnerTechRequirements(learnerTechIds)
      setSelectedInstructorTechRequirements(instructorTechIds)
      setSelectedLearnerStylePreferences(learnerStyleIds)
      
      // Set prior knowledge state
      const hasPriorKnowledgeValue = initialData.priorKnowledgeList && initialData.priorKnowledgeList.length > 0 ? "Yes" : ""
      setHasPriorKnowledge(hasPriorKnowledgeValue)
      setPriorKnowledge(initialData.priorKnowledgeList && initialData.priorKnowledgeList.length > 0 ? initialData.priorKnowledgeList : [])
    } else {
      // For new creation, start with one empty keyword input
      setKeywords([""])
      // Initialize prior knowledge with empty array
      setPriorKnowledge([])
      setHasPriorKnowledge("")
    }

    // Handle responsive behavior
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [initialData, isCreating, technologicalRequirements])

  // Initialize prior knowledge if "Yes" is selected but no inputs exist
  useEffect(() => {
    if (hasPriorKnowledge === "Yes" && priorKnowledge.length === 0) {
      setPriorKnowledge([""])
    }
  }, [hasPriorKnowledge, priorKnowledge.length])

  const addKeyword = () => {
    setKeywords([...keywords, ""])
  }

  const updateKeyword = (index: number, value: string) => {
    const newKeywords = [...keywords]
    newKeywords[index] = value
    setKeywords(newKeywords)
  }

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index))
  }

  const addPriorKnowledge = () => {
    setPriorKnowledge([...priorKnowledge, ""])
  }

  const updatePriorKnowledge = (index: number, value: string) => {
    const newList = [...priorKnowledge]
    newList[index] = value
    setPriorKnowledge(newList)
  }

  const removePriorKnowledge = (index: number) => {
    setPriorKnowledge(priorKnowledge.filter((_, i) => i !== index))
  }

  const handleDeliveryToolChange = (toolId: string, checked: boolean) => {
    if (checked) {
      setSelectedDeliveryTools(prev => [...prev, toolId])
    } else {
      setSelectedDeliveryTools(prev => prev.filter(id => id !== toolId))
    }
  }

  const handleLearnerTechRequirementChange = (reqId: string, checked: boolean) => {
    if (checked) {
      setSelectedLearnerTechRequirements(prev => [...prev, reqId])
    } else {
      setSelectedLearnerTechRequirements(prev => prev.filter(id => id !== reqId))
    }
  }

  const handleInstructorTechRequirementChange = (reqId: string, checked: boolean) => {
    if (checked) {
      setSelectedInstructorTechRequirements(prev => [...prev, reqId])
    } else {
      setSelectedInstructorTechRequirements(prev => prev.filter(id => id !== reqId))
    }
  }

  const handleLearnerStylePreferenceChange = (styleId: string, checked: boolean) => {
    if (checked) {
      setSelectedLearnerStylePreferences(prev => [...prev, styleId])
    } else {
      setSelectedLearnerStylePreferences(prev => prev.filter(id => id !== styleId))
    }
  }

  const handleAlignmentStandardChange = (standardId: string, checked: boolean) => {
    if (checked) {
      setSelectedAlignmentStandards(prev => [...prev, standardId])
    } else {
      setSelectedAlignmentStandards(prev => prev.filter(id => id !== standardId))
    }
  }

  const renderMobileHeader = () => {
    if (!isMobile) return null
    
    if (showSidebar) {
      return (
        <div className="fixed top-0 left-0 right-0 bg-white z-[51] flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-medium">Training Profile</h2>
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
          <span>Training Profile Outline</span>
        </Button>
      </div>
    )
  }

  const renderContent = () => {
    switch (activeSection) {
      case "Keywords":
        return (
          <div className="space-y-1 w-full">
            <h3 className="text-lg font-medium">Keywords</h3>
            <p className="text-[12.5px] text-[#99948E] pb-4">Enter keywords that describe the core topics or focus areas of this training.</p>
            
            {keywords.map((keyword, index) => (
              <div key={index} className="relative mb-4">
                  <Input 
                    value={keyword}
                    onChange={(e) => updateKeyword(index, e.target.value)}
                    placeholder="Enter keyword"
                  className="w-full pr-9"
                  />
                      <div className="absolute right-10 top-1/2 -translate-y-1/2 h-full w-[1px] bg-gray-200" />
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => removeKeyword(index)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-red-50 hover:bg-red-100 p-0"
                  >
                  <img src="/delete.svg" alt="delete" className="w-4 h-4" />
                  </Button>
                </div>
            ))}

              <Button 
                onClick={addKeyword} 
                variant="link" 
                className="text-brand"
              >
              + Add Keyword
              </Button>
          </div>
        )
      case "Scope":
        return (
          <div className="space-y-1">
            <h3 className="text-lg font-medium">Scope</h3>
            <p className="text-[12.5px] text-[#99948E] pb-4">Define the extent and boundaries of this training. Include what will be covered and what falls outside the scope.</p>
          <Textarea
            value={scope}
            onChange={(e) => setScope(e.target.value)}
            placeholder="Enter scope details"
            className="min-h-[200px] w-full"
          />
          </div>
        )
      case "Attendance Requirement":
        return (
          <div className="space-y-1">
            <h3 className="text-lg font-medium">Attendance Requirement</h3>
            <p className="text-[12.5px] text-[#99948E] pb-4">Set the minimum attendance percentage required for learners to complete this training successfully.</p>
            <div className="space-y-2">
              <label htmlFor="attendance-percentage" className="text-sm font-medium text-gray-700">
                Minimum Attendance Percentage (%)
              </label>
              <Input
                id="attendance-percentage"
                type="number"
                min="0"
                max="100"
                value={attendanceRequirementPercentage}
                onChange={(e) => {
                  setAttendanceRequirementPercentage(Number(e.target.value))
                  setHasSetAttendanceRequirement(true)
                }}
                placeholder="Enter percentage (0-100)"
                className="w-full max-w-xs"
              />
              <p className="text-xs text-gray-500">
                Enter a value between 0 and 100. For example, 80 means learners must attend at least 80% of sessions.
              </p>
            </div>
          </div>
        )
      case "Professional Background":
        return (
          <div className="space-y-1 ">
            <h3 className="text-lg font-medium">Professional Background</h3>
          <p className="text-[12.5px] text-[#99948E] pb-4">Enter the professional background for the target audience of this training.</p>
          <Textarea
              value={professionalBackground}
              onChange={(e) => setProfessionalBackground(e.target.value)}
              placeholder="Enter professional background"
            className="min-h-[200px] w-full"
          />
          </div>
        )
      case "Alignment With Standard":
        return (
          <div className="space-y-1 w-full">
            <h3 className="text-lg font-medium">Alignment With Standard</h3>
            <p className="text-[12.5px] text-[#99948E] pb-4">Select the standards this training aligns with.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {isLoadingAlignmentStandards ? (
                <p>Loading alignment standards...</p>
              ) : (
                (alignmentStandards || []).map((standard: BaseItem) => (
                  <div key={standard.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`standard-${standard.id}`}
                      checked={selectedAlignmentStandards.includes(standard.id)}
                      onCheckedChange={(checked) =>
                        handleAlignmentStandardChange(standard.id, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`standard-${standard.id}`}
                      className="text-sm md:text-base text-gray-500 font-normal"
                    >
                      {standard.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      case "Delivery Tools":
        return (
          <div className="space-y-1 w-full">
            <h3 className="text-lg font-medium">Delivery Tools</h3>
          <p className="text-[12.5px] text-[#99948E] pb-4">Select the tools or platforms that will be used to deliver this training to learners.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {isLoadingDeliveryTools ? (
                <p>Loading delivery tools...</p>
              ) : (
                (deliveryTools || []).map((tool: BaseItem) => (
                  <div key={tool.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`delivery-${tool.id}`}
                      checked={selectedDeliveryTools.includes(tool.id)}
                      onCheckedChange={(checked) =>
                        handleDeliveryToolChange(tool.id, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`delivery-${tool.id}`}
                      className="text-sm md:text-base text-gray-500 font-normal"
                    >
                      {tool.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      case "Technological Requirements":
        return (
          <div className="space-y-8 w-full">
            {/* For Learners Section */}
            <div className="space-y-1 ">
              <h3 className="text-lg font-medium">Technological Requirements</h3>
            <p className="text-[12.5px] text-[#99948E] pb-4">Select the technology requirements needed for both learners and instructors to participate in this training.</p>
              <h2 className="text-base font-semibold mt-6">For Learners</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {isLoadingTechRequirements ? (
                  <p>Loading technological requirements...</p>
                ) : (
                  learnerTechRequirements.map((req: BaseItem) => (
                    <div key={req.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`learner-${req.id}`}
                        checked={selectedLearnerTechRequirements.includes(req.id)}
                        onCheckedChange={(checked) =>
                          handleLearnerTechRequirementChange(req.id, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`learner-${req.id}`}
                        className="text-sm md:text-base text-gray-500 font-normal"
                      >
                        {req.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* For Instructors Section */}
            <div className="space-y-1 ">
              <h2 className="text-base font-semibold">For Instructors</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {isLoadingTechRequirements ? (
                  <p>Loading technological requirements...</p>
                ) : (
                  instructorTechRequirements.map((req: BaseItem) => (
                    <div key={req.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`instructor-${req.id}`}
                        checked={selectedInstructorTechRequirements.includes(req.id)}
                        onCheckedChange={(checked) =>
                          handleInstructorTechRequirementChange(req.id, checked as boolean)
                        }
                      />
                      <label
                        htmlFor={`instructor-${req.id}`}
                        className="text-sm md:text-base text-gray-500 font-normal"
                      >
                        {req.name}
                      </label>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      case "Prior Knowledge":
        return (
          <div className="space-y-1 w-full">
            <h3 className="text-lg font-medium">Prior Knowledge</h3>
            <p className="text-[12.5px] text-[#99948E] pb-2">Indicate whether learners need specific knowledge or skills before taking this training.</p>
            <div className="flex gap-6 pb-4">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="yes"
                  checked={hasPriorKnowledge === "Yes"}
                  onChange={() => setHasPriorKnowledge("Yes")}
                  className="w-4 h-4 border-2 border-gray-300 rounded-full focus:ring-brand text-brand"
                />
                <label htmlFor="yes" className="text-gray-700">Yes</label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  id="no"
                  checked={hasPriorKnowledge === "No"}
                  onChange={() => setHasPriorKnowledge("No")}
                  className="w-4 h-4 border-2 border-gray-300 rounded-full focus:ring-brand text-brand"
                />
                <label htmlFor="no" className="text-gray-700">No</label>
              </div>
            </div>

            {hasPriorKnowledge === "Yes" && (
              <div className="space-y-1">
                <div className="space-y-2">
                  <h4 className="text-base font-medium text-gray-700">
                    Required Prior Knowledge
                  </h4>
                  <p className="text-[12.5px] text-[#99948E] pb-2">
                    Enter knowledge or skills that learners are expected to have before taking this training.
                  </p>
                </div>
                {priorKnowledge.map((knowledge, index) => (
                  <div key={index} className="relative mb-4">
                    <Input
                      value={knowledge}
                      onChange={(e) => updatePriorKnowledge(index, e.target.value)}
                      placeholder="Enter prior knowledge or skill"
                      className="w-full pr-9"
                    />
                    <div className="absolute right-10 top-1/2 -translate-y-1/2 h-full w-[1px] bg-gray-200" />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removePriorKnowledge(index)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full bg-red-50 hover:bg-red-100 p-0"
                    >
                      <img src="/delete.svg" alt="delete" className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  onClick={addPriorKnowledge}
                  variant="link"
                  className="text-brand"
                >
                  + Add more
                </Button>
              </div>
            )}
          </div>
        )
      case "Learning Style Preferences":
        return (
          <div className="space-y-1 w-full">
            <h3 className="text-lg font-medium">Learning Style Preferences</h3>
          <p className="text-[12.5px] text-[#99948E] pb-4">Select the learning style preferences that are suitable for this training. These help match learners with appropriate training methods.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {isLoadingLearnerStylePreferences ? (
                <p>Loading learning style preferences...</p>
              ) : (
                (learnerStylePreferences || []).map((style: BaseItem) => (
                  <div key={style.id} className="flex items-center space-x-3">
                    <Checkbox
                      id={`style-${style.id}`}
                      checked={selectedLearnerStylePreferences.includes(style.id)}
                      onCheckedChange={(checked) =>
                        handleLearnerStylePreferenceChange(style.id, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`style-${style.id}`}
                      className="text-sm md:text-base text-gray-500 font-normal"
                    >
                      {style.name}
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      case "Training Objectives":
        return (
          <Objective
            trainingId={trainingId}
            initialData={objectiveData}
            onSave={async () => {
              setActiveSection("Keywords") // Navigate to the first section after saving
            }}
            onCancel={() => setActiveSection("Learning Style Preferences")}
          />
        )
      default:
        return null
    }
  }

  const handleSaveAndContinue = async () => {
    // Find next section to navigate to
    const allItems = outlineGroups.flatMap(group => group.items)
    const currentIndex = allItems.findIndex(item => item.label === activeSection)
    const nextSection = currentIndex < allItems.length - 1 ? allItems[currentIndex + 1].label : null
    
    // If next section is Training Objectives, save training profile first
    if (nextSection === "Training Objectives") {
      // Combine both learner and instructor tech requirements
      const combinedTechRequirements = [
        ...selectedLearnerTechRequirements,
        ...selectedInstructorTechRequirements
      ]

      // Create the complete profile data with all fields using the expected property names
      const data: TrainingProfile = {
        trainingId,
        keywords: keywords.filter(k => k.trim() !== ''),
        scope: scope || null,
        attendanceRequirementPercentage: attendanceRequirementPercentage,
        professionalBackground: professionalBackground || null,
        alignmentStandardIds: selectedAlignmentStandards.length > 0 ? selectedAlignmentStandards : null,
        deliveryToolIds: selectedDeliveryTools.length > 0 ? selectedDeliveryTools : null,
        technologicalRequirementIds: combinedTechRequirements.length > 0 ? combinedTechRequirements : null,
        priorKnowledgeList: hasPriorKnowledge === "Yes" ? priorKnowledge.filter(k => k.trim() !== "") : [],
        learnerStylePreferenceIds: selectedLearnerStylePreferences.length > 0 ? selectedLearnerStylePreferences : null
      }

      try {
        if (!isCreating) {
          await updateProfile.mutateAsync(data)
          toast.success("Training profile updated successfully")
        } else {
          await createProfile.mutateAsync(data)
          toast.success("Training profile created successfully")
        }
        setActiveSection("Training Objectives")
      } catch (error: any) {
        toast.error(error.message)
      }
      return
    }

    // For other sections, just navigate
    if (nextSection) {
      setActiveSection(nextSection)
      return
    }

    // If we're at the last section (not Objectives), save and close
    try {
      // Combine both learner and instructor tech requirements
      const combinedTechRequirements = [
        ...selectedLearnerTechRequirements,
        ...selectedInstructorTechRequirements
      ]

      const data: TrainingProfile = {
        trainingId,
        keywords: keywords.filter(k => k.trim() !== ''),
        scope: scope || null,
        attendanceRequirementPercentage: attendanceRequirementPercentage,
        professionalBackground: professionalBackground || null,
        alignmentStandardIds: selectedAlignmentStandards.length > 0 ? selectedAlignmentStandards : null,
        deliveryToolIds: selectedDeliveryTools.length > 0 ? selectedDeliveryTools : null,
        technologicalRequirementIds: combinedTechRequirements.length > 0 ? combinedTechRequirements : null,
        priorKnowledgeList: hasPriorKnowledge === "Yes" ? priorKnowledge.filter(k => k.trim() !== "") : [],
        learnerStylePreferenceIds: selectedLearnerStylePreferences.length > 0 ? selectedLearnerStylePreferences : null
      }

      if (!isCreating) {
        await updateProfile.mutateAsync(data)
        toast.success("Training profile updated successfully")
      } else {
        await createProfile.mutateAsync(data)
        toast.success("Training profile created successfully")
      }
      onSave()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  return (
    <div className="px-[7%] py-10">
      <div className={cn(
        isMobile ? "block" : "flex gap-8"
      )}>
        {renderMobileHeader()}
        
        {(!isMobile || showSidebar) && (
          <div className={cn(
            "",
            isMobile ? "fixed bg-white inset-0 z-50 pt-16 px-4 pb-4" : "w-[300px]"
          )}>
            <OutlineSidebar 
              title="Training Profile Outline"
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

          {/* Only show parent buttons if not in Training Objectives section */}
          {activeSection !== "Training Objectives" && (
            <div className="flex justify-end gap-4 pt-8">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleSaveAndContinue} className="bg-brand text-white">
                {!isCreating ? 'Save Changes' : 'Save and Continue'}
              </Button>
            </div>
          )}
        </EditFormContainer>
      </div>
    </div>
  )
}