"use client";

import { ChevronRight, ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useState } from "react";
import { OverviewEdit } from "./overview/overview-edit";
import { Training } from "@/types/training";
import { useUpdateTraining } from "@/lib/hooks/useUpdateTraining";
import { useUserRole } from "@/lib/hooks/useUserRole";

type SectionName = "basic" | "location" | "training-details" | "target" | "purpose"

export function Overview({ training }: { training: Training }) {
  const [isEditing, setIsEditing] = useState(false)
  const [initialStep, setInitialStep] = useState(1)
  const { isCompanyAdmin } = useUserRole()
  const { mutate: updateTraining, isPending } = useUpdateTraining()

  const handleEdit = (section: SectionName) => {
    // Prevent multiple edits
    if (isPending) return
    
    // Map section to step number
    const stepMap: Record<SectionName, number> = {
      basic: 1,         // Title, rationale, training tags
      location: 2,      // Countries, regions, zones, cities
      "training-details": 3, // Duration, delivery method, training type
      target: 4,        // Target audience details
      purpose: 5        // Training purposes
    }
    setInitialStep(stepMap[section])
    setIsEditing(true)
  }

  if (isEditing) {
    return (
      <OverviewEdit 
        training={training}
        initialStep={initialStep}
        onSave={(data) => {
          updateTraining(
            { id: training.id, data },
            {
              onSuccess: () => setIsEditing(false),
              onError: () => setIsEditing(false) // Also reset editing state on error
            }
          )
        }}
        onCancel={() => setIsEditing(false)}
      />
    )
  }

  return (
    <div className="px-[7%] py-10 mb-10">
      <h1 className="text-md md:text-xl text-black mb-4 font-semibold">Overview</h1>

      <h2 className="text-md md:text-lg text-gray-500 font-normal mb-4">
        A concise summary of the course, outlining its purpose, scope, and key
        features
      </h2>

      <div className="space-y-4">
        <Accordion type="single" collapsible className="space-y-4">
          {/* Basic Information Section - Title, Rationale, Training Tags */}
          <AccordionItem value="basic" className="border-[0.5px] border-[#CED4DA] rounded-md">
            <AccordionTrigger className="bg-white data-[state=open]:bg-[#f7fbff] rounded-lg p-6 flex items-center justify-between hover:no-underline group">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-md md:text-xl">Basic Information</span>
              </div>
              <div className="text-gray-400 flex gap-2">
                {isCompanyAdmin && (
                  <img 
                    src="/edit.svg" 
                    alt="" 
                    className={`w-5 h-5 cursor-pointer ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!isPending) handleEdit("basic")
                    }}
                  />
                )}
                <ChevronRight className="h-5 w-5 transition-transform group-data-[state=open]:hidden text-black" />
                <ChevronDown className="h-5 w-5 transition-transform hidden group-data-[state=open]:block text-black" />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-white p-6 space-y-4">
                {/* Title */}
                <div>
                  <h3 className="text-gray-700 font-medium mb-1">Title:</h3>
                  <p className="text-gray-600 md:text-lg text-sm">{training.title}</p>
                </div>
                
                {/* Rationale */}
                <div>
                  <h3 className="text-gray-700 font-medium mb-1">Rationale:</h3>
                  <p className="text-gray-600 text-sm md:text-lg">
                    {training.rationale || "N/A"}
                  </p>
                </div>
                
                {/* Training Tags */}
                <div>
                  <h3 className="text-gray-700 font-medium mb-1">Training Tags:</h3>
                  {training.trainingTags && training.trainingTags.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {training.trainingTags.map(tag => (
                        <span key={tag.id} className="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full">
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm md:text-lg">N/A</p>
                  )}
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Location Section */}
          <AccordionItem value="location" className="border-[0.5px] border-[#CED4DA] rounded-md">
            <AccordionTrigger className="bg-white data-[state=open]:bg-[#f7fbff] rounded-lg p-6 flex items-center justify-between hover:no-underline group">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-md md:text-xl">Location</span>
              </div>
              <div className="text-gray-400 flex gap-2">
                {isCompanyAdmin && (
                  <img 
                    src="/edit.svg" 
                    alt="" 
                    className={`w-5 h-5 cursor-pointer ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!isPending) handleEdit("location")
                    }}
                  />
                )}
                <ChevronRight className="h-5 w-5 transition-transform group-data-[state=open]:hidden text-black" />
                <ChevronDown className="h-5 w-5 transition-transform hidden group-data-[state=open]:block text-black" />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-white p-6 space-y-4">
                {/* Countries */}
                {training.zones && training.zones.length > 0 && (
                  <div>
                    <h3 className="text-gray-700 font-medium mb-1">Countries:</h3>
                    <p className="text-gray-600 text-sm md:text-lg">
                      {[...new Set(training.zones.map(z => z.region.country.name))].join(", ")}
                    </p>
                  </div>
                )}
                
                {/* Regions */}
                {training.zones && training.zones.length > 0 && (
                  <div>
                    <h3 className="text-gray-700 font-medium mb-1">Regions:</h3>
                    <p className="text-gray-600 text-sm md:text-lg">
                      {[...new Set(training.zones.map(z => z.region.name))].join(", ")}
                    </p>
                  </div>
                )}
                
                {/* Zones */}
                {training.zones && training.zones.length > 0 && (
                  <div>
                    <h3 className="text-gray-700 font-medium mb-1">Zones:</h3>
                    <p className="text-gray-600 text-sm md:text-lg">
                      {training.zones.map(z => z.name).join(", ")}
                    </p>
                  </div>
                )}
                
                {/* Cities */}
                {training.cities && training.cities.length > 0 && (
                  <div>
                    <h3 className="text-gray-700 font-medium mb-1">Cities:</h3>
                    <p className="text-gray-600 text-sm md:text-lg">
                      {training.cities.map(city => city.name).join(", ")}
                    </p>
                  </div>
                )}
                
                {/* Fallback message */}
                {(!training.zones || training.zones.length === 0) && 
                 (!training.cities || training.cities.length === 0) && (
                  <p className="text-gray-600 text-sm md:text-lg">N/A</p>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Training Details Section - Duration, Delivery Method, Training Type */}
          <AccordionItem value="training-details" className="border-[0.5px] border-[#CED4DA] rounded-md">
            <AccordionTrigger className="bg-white data-[state=open]:bg-[#f7fbff] rounded-lg p-6 flex items-center justify-between hover:no-underline group">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-md md:text-xl">Training Details</span>
              </div>
              <div className="text-gray-400 flex gap-2">
                {isCompanyAdmin && (
                  <img 
                    src="/edit.svg" 
                    alt="" 
                    className={`w-5 h-5 cursor-pointer ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!isPending) handleEdit("training-details")
                    }}
                  />
                )}
                <ChevronRight className="h-5 w-5 transition-transform group-data-[state=open]:hidden text-black" />
                <ChevronDown className="h-5 w-5 transition-transform hidden group-data-[state=open]:block text-black" />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-white p-6 space-y-4">
                {/* Duration */}
                <div>
                  <h3 className="text-gray-700 font-medium mb-1">Duration:</h3>
                  <p className="text-gray-600 text-sm md:text-lg">{`${
                    training.duration
                  } ${training.durationType.toLowerCase()}`}</p>
                </div>
                
                {/* Delivery Method */}
                <div>
                  <h3 className="text-gray-700 font-medium mb-1">Delivery Method:</h3>
                  <p className="text-gray-600 text-sm md:text-lg">
                    {training.deliveryMethod ? 
                      training.deliveryMethod === 'ONLINE' ? 'Online' :
                      training.deliveryMethod === 'BLENDED' ? 'Blended' : 
                      'Virtual' : 'N/A'}
                  </p>
                </div>
                
                {/* Training Type */}
                <div>
                  <h3 className="text-gray-700 font-medium mb-1">Training Type:</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600 text-sm md:text-lg font-medium">
                      {training.trainingType?.name || "N/A"}
                    </p>
                    {training.trainingType?.description && (
                      <p className="text-gray-500 text-sm md:text-base">
                        {training.trainingType.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Target Audience Section */}
          <AccordionItem value="target" className="border-[0.5px] border-[#CED4DA] rounded-md">
            <AccordionTrigger className="bg-white data-[state=open]:bg-[#f7fbff] rounded-lg p-6 flex items-center justify-between hover:no-underline group">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-md md:text-xl">Target Audience</span>
              </div>
              <div className="text-gray-400 flex gap-2">
                {isCompanyAdmin && (
                  <img 
                    src="/edit.svg" 
                    alt="" 
                    className={`w-5 h-5 cursor-pointer ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!isPending) handleEdit("target")
                    }}
                  />
                )}
                <ChevronRight className="h-5 w-5 transition-transform group-data-[state=open]:hidden text-black" />
                <ChevronDown className="h-5 w-5 transition-transform hidden group-data-[state=open]:block text-black" />
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="bg-white p-6 space-y-4">
                {/* Total Participants */}
                <div>
                  <h3 className="text-gray-700 font-medium mb-1">Total Participants:</h3>
                  <p className="text-gray-600 text-sm md:text-lg">
                    {training.totalParticipants || 'N/A'}
                  </p>
                </div>
                
                {/* Gender */}
                <div>
                  <h3 className="text-gray-700 font-medium mb-1">Gender Distribution:</h3>
                  <p className="text-gray-600 text-sm md:text-lg">
                    {training.genderPercentages.map(g => `${g.gender.charAt(0)}${g.gender.slice(1).toLowerCase()} (${g.percentage}%)`).join(", ")}
                  </p>
                </div>

                {/* Age Groups */}
                {training.ageGroups?.length > 0 && (
                  <div>
                    <h3 className="text-gray-700 font-medium mb-1">Age Groups:</h3>
                    <p className="text-gray-600 text-sm md:text-lg">
                      {training.ageGroups.map(age => age.name).join(", ")}
                    </p>
                  </div>
                )}

                {/* Economic Backgrounds */}
                {training.economicBackgrounds?.length > 0 && (
                  <div>
                    <h3 className="text-gray-700 font-medium mb-1">Economic Backgrounds:</h3>
                    <p className="text-gray-600 text-sm md:text-lg">
                      {training.economicBackgrounds.map(eb => eb.name).join(", ")}
                    </p>
                  </div>
                )}

                {/* Academic Qualifications */}
                {training.academicQualifications?.length > 0 && (
                  <div>
                    <h3 className="text-gray-700 font-medium mb-1">Academic Qualifications:</h3>
                    <p className="text-gray-600 text-sm md:text-lg">
                      {training.academicQualifications.map(aq => aq.name).join(", ")}
                    </p>
                  </div>
                )}

                {/* Disability Information */}
                {training.disabilityPercentages && training.disabilityPercentages.length > 0 && (
                  <div>
                    <h3 className="text-gray-700 font-medium mb-1">Disability Distribution:</h3>
                    <p className="text-gray-600 text-sm md:text-lg">
                      {training.disabilityPercentages?.map(d => 
                        `${d.disability.name} (${d.percentage}%)`).join(", ")}
                    </p>
                  </div>
                )}

                {/* Marginalized Groups */}
                {training.marginalizedGroupPercentages && training.marginalizedGroupPercentages.length > 0 && (
                  <div>
                    <h3 className="text-gray-700 font-medium mb-1">Marginalized Groups:</h3>
                    <p className="text-gray-600 text-sm md:text-lg">
                      {training.marginalizedGroupPercentages?.map(mg => 
                        `${mg.marginalizedGroup.name} (${mg.percentage}%)`).join(", ")}
                    </p>
                  </div>
                )}
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Purpose Section */}
          <AccordionItem value="purpose" className="border-[0.5px] border-[#CED4DA] rounded-md">
            <AccordionTrigger className="bg-white data-[state=open]:bg-[#f7fbff] rounded-lg p-6 flex items-center justify-between hover:no-underline group">
              <div className="flex items-center gap-3">
                <span className="font-semibold text-md md:text-xl">
                  Purpose of the training
                </span>
              </div>
              <div className="text-gray-400 flex gap-2">
                {isCompanyAdmin && (
                  <img 
                    src="/edit.svg" 
                    alt="" 
                    className={`w-5 h-5 cursor-pointer ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!isPending) handleEdit("purpose")
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
                  {training.trainingPurposes.length > 0 
                    ? training.trainingPurposes.map(purpose => purpose.name).join(", ")
                    : "N/A"}
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  );
}
