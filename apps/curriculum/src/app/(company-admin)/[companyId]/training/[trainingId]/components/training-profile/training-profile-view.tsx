"use client"

import { ChevronRight, ChevronDown } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { TrainingProfile } from "@/lib/hooks/useTrainingProfile"
import { useBaseData } from "@/lib/hooks/useBaseData"
import { useMemo } from "react"
import { useObjective } from "@/lib/hooks/useObjective"
import { useUserRole } from "@/lib/hooks/useUserRole"
// Define interface for base data items
interface BaseItem {
  id: string
  name: string
  description: string
  technologicalRequirementType?: 'LEARNER' | 'INSTRUCTOR'
}

interface SpecificObjective {
  id: string
  definition: string
  outcomes: Array<{
    id: string
    definition: string
  }>
}


interface TrainingProfileViewProps {
  trainingProfile: TrainingProfile
  onEdit: () => void
}

export function TrainingProfileView({ trainingProfile, onEdit }: TrainingProfileViewProps) {
  const { canEdit } = useUserRole()

  // Fetch base data for displaying names instead of IDs
  const { data: deliveryTools } = useBaseData('delivery-tool')
  const { data: technologicalRequirements } = useBaseData('technological-requirement')
  const { data: learnerStylePreferences } = useBaseData('learner-style-preference')
  const { data: alignmentStandards } = useBaseData('alignment-standard')
  const { data: objectiveData } = useObjective(trainingProfile.trainingId)

  // Create maps for easy lookup
  const deliveryToolMap = useMemo(() => {
    const map = new Map<string, string>()
    if (deliveryTools) {
      deliveryTools.forEach((tool: BaseItem) => {
        map.set(tool.id, tool.name)
      })
    }
    return map
  }, [deliveryTools])

  const techRequirementsMap = useMemo(() => {
    const map = new Map<string, string>()
    if (technologicalRequirements) {
      technologicalRequirements.forEach((req: BaseItem) => {
        map.set(req.id, req.name)
      })
    }
    return map
  }, [technologicalRequirements])

  const learnerStylesMap = useMemo(() => {
    const map = new Map<string, string>()
    if (learnerStylePreferences) {
      learnerStylePreferences.forEach((style: BaseItem) => {
        map.set(style.id, style.name)
      })
    }
    return map
  }, [learnerStylePreferences])

  const alignmentStandardsMap = useMemo(() => {
    const map = new Map<string, string>()
    if (alignmentStandards) {
      alignmentStandards.forEach((standard: BaseItem) => {
        map.set(standard.id, standard.name)
      })
    }
    return map
  }, [alignmentStandards])

  // Helper function to render arrays as a list or handle null values
  const renderArrayOrString = (value: string[] | string | null) => {
    if (!value) return 'No data available';
    
    if (Array.isArray(value)) {
      if (value.length === 0) return 'No data available';
      
      return (
        <ul className="list-disc pl-5">
          {value.map((item, index) => (
            <li key={index} className="mb-1">{item}</li>
          ))}
        </ul>
      );
    }
    
    return value;
  };

  // Add helper function to extract object data
  const extractObjectData = (
    data: Array<{id: string, name: string, description: string}> | string[] | string | null | undefined
  ): Array<{id: string, name: string, description: string} | string> => {
    if (!data || data.length === 0) return [];
    
    // Handle if it's a string
    if (typeof data === 'string') {
      return [data];
    }
    
    // Check if the data is an array of objects with id/name properties
    if (Array.isArray(data) && data.length > 0 && typeof data[0] === 'object' && data[0] !== null && 'id' in data[0]) {
      return data;
    }
    
    // If it's an array of strings, return as is
    if (Array.isArray(data)) {
      return data;
    }
    
    return [];
  };

  // Update the renderIdsWithNames function to handle both string IDs and objects
  const renderIdsWithNames = (
    items: Array<{id: string, name: string, description: string} | string> | null | undefined, 
    nameMap: Map<string, string>
  ) => {
    if (!items || items.length === 0) {
      return <p className="text-gray-500 italic">None selected</p>;
    }

    return (
      <ul className="list-disc ml-5 space-y-1">
        {items.map((item) => {
          // Check if item is an object with id/name properties
          if (typeof item === 'object' && item !== null && 'name' in item) {
            return <li key={item.id}>{item.name}</li>;
          }
          
          // If it's a string ID, use the lookup map
          const name = nameMap.get(item as string) || item;
          return <li key={String(item)}>{name}</li>;
        })}
      </ul>
    );
  };

  return (
    <div className="px-[7%] py-10 mb-10">
      <h1 className="text-md md:text-xl text-black mb-4 font-semibold">Training Profile</h1>

      <h2 className="text-md md:text-lg text-gray-500 font-normal mb-4">
        The Training Profile section is designed to provide a comprehensive overview of a training program.
      </h2>

      <div className="flex flex-col">
        <Accordion type="multiple" defaultValue={['keywords']} className="space-y-4">
          {/* Keywords Section */}
          <AccordionItem value="keywords" className="border-[0.5px] border-[#CED4DA] rounded-md">
            <AccordionTrigger className="bg-white data-[state=open]:bg-[#f7fbff] rounded-lg p-6 flex items-center justify-between hover:no-underline group">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-md md:text-xl">Keywords</span>
              </div>
              <div className="text-gray-400 flex gap-2">
                {canEdit && (
                  <img 
                    src="/edit.svg" 
                    alt="" 
                    className="w-5 h-5 cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                    }}
                  />
                )}
                <ChevronRight className="h-5 w-5 transition-transform group-data-[state=open]:hidden text-black" />
                <ChevronDown className="h-5 w-5 transition-transform hidden group-data-[state=open]:block text-black" />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-white p-6">
                <div className="text-gray-600 text-sm md:text-lg">
                  {trainingProfile.keywords && trainingProfile.keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {trainingProfile.keywords.map((keyword, idx) => (
                        <div key={idx} className="bg-gray-100 px-3 py-1 rounded text-gray-700">
                          {keyword}
                        </div>
                      ))}
                    </div>
                  ) : (
                    'No keywords available'
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="scope" className="border-[0.5px] border-[#CED4DA] rounded-md">
            <AccordionTrigger className="bg-white data-[state=open]:bg-[#f7fbff] rounded-lg p-6 flex items-center justify-between hover:no-underline group">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-md md:text-xl">Scope</span>
              </div>
              <div className="text-gray-400 flex gap-2">
                {canEdit && (
                  <img 
                    src="/edit.svg" 
                    alt="" 
                    className="w-5 h-5 cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                    }}
                  />
                )}
                <ChevronRight className="h-5 w-5 transition-transform group-data-[state=open]:hidden text-black" />
                <ChevronDown className="h-5 w-5 transition-transform hidden group-data-[state=open]:block text-black" />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-white p-6">
                <p className="text-gray-600 text-sm md:text-lg">{trainingProfile.scope || 'No scope available'}</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Attendance Requirement Section */}
          <AccordionItem value="attendanceRequirement" className="border-[0.5px] border-[#CED4DA] rounded-md">
            <AccordionTrigger className="bg-white data-[state=open]:bg-[#f7fbff] rounded-lg p-6 flex items-center justify-between hover:no-underline group">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-md md:text-xl">Attendance Requirement</span>
              </div>
              <div className="text-gray-400 flex gap-2">
                {canEdit && (
                  <img 
                    src="/edit.svg" 
                    alt="" 
                    className="w-5 h-5 cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                    }}
                  />
                )}
                <ChevronRight className="h-5 w-5 transition-transform group-data-[state=open]:hidden text-black" />
                <ChevronDown className="h-5 w-5 transition-transform hidden group-data-[state=open]:block text-black" />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-white p-6">
                <p className="text-gray-600 text-sm md:text-lg">
                  {trainingProfile.attendanceRequirementPercentage !== null && trainingProfile.attendanceRequirementPercentage !== undefined
                    ? `${trainingProfile.attendanceRequirementPercentage}% minimum attendance required`
                    : 'No attendance requirement specified'
                  }
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Professional Background Section (was Rationale) */}
          <AccordionItem value="professionalBackground" className="border-[0.5px] border-[#CED4DA] rounded-md">
            <AccordionTrigger className="bg-white data-[state=open]:bg-[#f7fbff] rounded-lg p-6 flex items-center justify-between hover:no-underline group">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-md md:text-xl">Professional Background</span>
              </div>
              <div className="text-gray-400 flex gap-2">
                {canEdit && (
                  <img 
                    src="/edit.svg" 
                    alt="" 
                    className="w-5 h-5 cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                    }}
                  />
                )}
                <ChevronRight className="h-5 w-5 transition-transform group-data-[state=open]:hidden text-black" />
                <ChevronDown className="h-5 w-5 transition-transform hidden group-data-[state=open]:block text-black" />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-white p-6">
                <p className="text-gray-600 text-sm md:text-lg">{trainingProfile.professionalBackground || 'No professional background available'}</p>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Alignment with Standard Section */}
          <AccordionItem value="alignment" className="border-[0.5px] border-[#CED4DA] rounded-md">
            <AccordionTrigger className="bg-white data-[state=open]:bg-[#f7fbff] rounded-lg p-6 flex items-center justify-between hover:no-underline group">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-md md:text-xl">Alignment with Standard</span>
              </div>
              <div className="text-gray-400 flex gap-2">
                {canEdit && (
                  <img 
                    src="/edit.svg" 
                    alt="" 
                    className="w-5 h-5 cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                    }}
                  />
                )}
                <ChevronRight className="h-5 w-5 transition-transform group-data-[state=open]:hidden text-black" />
                <ChevronDown className="h-5 w-5 transition-transform hidden group-data-[state=open]:block text-black" />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-white p-6">
                <div className="text-gray-600 text-sm md:text-lg">
                  {renderIdsWithNames(extractObjectData(trainingProfile.alignmentsWithStandard), alignmentStandardsMap)}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Prior Knowledge Section */}
          <AccordionItem value="priorKnowledge" className="border-[0.5px] border-[#CED4DA] rounded-md">
            <AccordionTrigger className="bg-white data-[state=open]:bg-[#f7fbff] rounded-lg p-6 flex items-center justify-between hover:no-underline group">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-md md:text-xl">Prior Knowledge</span>
              </div>
              <div className="text-gray-400 flex gap-2">
                {canEdit && (
                  <img 
                    src="/edit.svg" 
                    alt="" 
                    className="w-5 h-5 cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                    }}
                  />
                )}
                <ChevronRight className="h-5 w-5 transition-transform group-data-[state=open]:hidden text-black" />
                <ChevronDown className="h-5 w-5 transition-transform hidden group-data-[state=open]:block text-black" />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-white p-6">
                <div className="text-gray-600 text-sm md:text-lg">
                  {trainingProfile.priorKnowledgeList && trainingProfile.priorKnowledgeList.length > 0 ? (
                    <ul className="list-disc pl-5">
                      {trainingProfile.priorKnowledgeList.map((item, index) => (
                        <li key={index} className="mb-1">{item}</li>
                      ))}
                    </ul>
                  ) : (
                    'No prior knowledge required'
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Learning Style Preferences Section */}
          <AccordionItem value="learning-styles" className="border-[0.5px] border-[#CED4DA] rounded-md">
            <AccordionTrigger className="bg-white data-[state=open]:bg-[#f7fbff] rounded-lg p-6 flex items-center justify-between hover:no-underline group">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-md md:text-xl">Learning Style Preferences</span>
              </div>
              <div className="text-gray-400 flex gap-2">
                {canEdit && (
                  <img 
                    src="/edit.svg" 
                    alt="" 
                    className="w-5 h-5 cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                    }}
                  />
                )}
                <ChevronRight className="h-5 w-5 transition-transform group-data-[state=open]:hidden text-black" />
                <ChevronDown className="h-5 w-5 transition-transform hidden group-data-[state=open]:block text-black" />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-white p-6">
                <div className="text-gray-600 text-sm md:text-lg">
                  {renderIdsWithNames(extractObjectData(trainingProfile.learnerStylePreferences), learnerStylesMap)}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Delivery Tools Section */}
          <AccordionItem value="delivery-tools" className="border-[0.5px] border-[#CED4DA] rounded-md">
            <AccordionTrigger className="bg-white data-[state=open]:bg-[#f7fbff] rounded-lg p-6 flex items-center justify-between hover:no-underline group">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-md md:text-xl">Delivery Tools</span>
              </div>
              <div className="text-gray-400 flex gap-2">
                {canEdit && (
                  <img 
                    src="/edit.svg" 
                    alt="" 
                    className="w-5 h-5 cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                    }}
                  />
                )}
                <ChevronRight className="h-5 w-5 transition-transform group-data-[state=open]:hidden text-black" />
                <ChevronDown className="h-5 w-5 transition-transform hidden group-data-[state=open]:block text-black" />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-white p-6">
                <div className="text-gray-600 text-sm md:text-lg">
                  {renderIdsWithNames(extractObjectData(trainingProfile.deliveryTools), deliveryToolMap)}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Technological Requirements Section */}
          <AccordionItem value="tech-requirements" className="border-[0.5px] border-[#CED4DA] rounded-md">
            <AccordionTrigger className="bg-white data-[state=open]:bg-[#f7fbff] rounded-lg p-6 flex items-center justify-between hover:no-underline group">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-md md:text-xl">Technological Requirements</span>
              </div>
              <div className="text-gray-400 flex gap-2">
                {canEdit && (
                  <img 
                    src="/edit.svg" 
                    alt="" 
                    className="w-5 h-5 cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                    }}
                  />
                )}
                <ChevronRight className="h-5 w-5 transition-transform group-data-[state=open]:hidden text-black" />
                <ChevronDown className="h-5 w-5 transition-transform hidden group-data-[state=open]:block text-black" />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-white p-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-2">For Learners</h3>
                    <div className="text-gray-600 text-sm md:text-lg">
                      {renderIdsWithNames(extractObjectData(trainingProfile.learnerTechnologicalRequirements), techRequirementsMap)}
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium mb-2">For Instructors</h3>
                    <div className="text-gray-600 text-sm md:text-lg">
                      {renderIdsWithNames(extractObjectData(trainingProfile.instructorTechnologicalRequirements), techRequirementsMap)}
                    </div>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Objectives Section */}
          <AccordionItem value="objectives" className="border-[0.5px] border-[#CED4DA] rounded-md">
            <AccordionTrigger className="bg-white data-[state=open]:bg-[#f7fbff] rounded-lg p-6 flex items-center justify-between hover:no-underline group">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-md md:text-xl">Training Objectives</span>
              </div>
              <div className="text-gray-400 flex gap-2">
                {canEdit && (
                  <img 
                    src="/edit.svg" 
                    alt="" 
                    className="w-5 h-5 cursor-pointer" 
                    onClick={(e) => {
                      e.stopPropagation()
                      onEdit()
                    }}
                  />
                )}
                <ChevronRight className="h-5 w-5 transition-transform group-data-[state=open]:hidden text-black" />
                <ChevronDown className="h-5 w-5 transition-transform hidden group-data-[state=open]:block text-black" />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-white p-6 space-y-8">
                {/* General Objective */}
                <div>
                  <h3 className="font-medium mb-4">General Objective</h3>
                  <p className="text-gray-600 text-sm md:text-lg">
                    {objectiveData?.generalObjective?.definition || 'No general objective available'}
                  </p>
                </div>

                {/* Specific Objectives */}
                {objectiveData?.specificObjectives && objectiveData.specificObjectives.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-4">Specific Objectives</h3>
                    <div className="space-y-6">
                      {objectiveData.specificObjectives.map((specific: SpecificObjective) => (
                        <div key={specific.id} className="ml-4">
                          <p className="text-gray-600 text-sm md:text-lg mb-2">{specific.definition}</p>
                          {specific.outcomes.length > 0 && (
                            <div className="ml-4">
                              <h4 className="font-medium mb-2 text-sm">Outcomes</h4>
                              <ul className="list-disc pl-4">
                                {specific.outcomes.map((outcome: { id: string; definition: string }) => (
                                  <li key={outcome.id} className="text-gray-600 text-sm md:text-lg">
                                    {outcome.definition}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

        </Accordion>
      </div>
    </div>
  )
} 