"use client"

import { useState, lazy, Suspense } from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Loading } from "@/components/ui/loading"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { formatDateToDisplay, formatTimeToDisplay } from "@/lib/utils"
import { useSession } from "@/lib/hooks/useSession"
import React from "react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useUserRole } from "@/lib/hooks/useUserRole"

// Lazy load the TrainerDetailsTab component since it's not always visible
const TrainerDetailsTab = lazy(() => 
  import("./components/TrainerDetailsTab").then(module => ({ default: module.TrainerDetailsTab }))
)

// Fallback loading component for lazy-loaded tabs
const TabLoadingFallback = () => (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
)

export default function SessionDetailPage() {
  const router = useRouter()
  const params = useParams()
  const companyId = params.companyId as string
  const trainingId = params.trainingId as string
  const cohortId = params.cohortId as string
  const sessionId = params.sessionId as string
  const [activeTab, setActiveTab] = useState("session-details")
  const { isProjectManager, isTrainingAdmin, isTrainerAdmin, isTrainer } = useUserRole()

  const { data: session, isLoading, error } = useSession(sessionId)

  const handleBack = () => {
    // Navigate back to the cohort detail page (sessions tab)
    router.push(`/${companyId}/training/${trainingId}/cohorts/${cohortId}`)
  }

  if (isLoading) {
    return <Loading />
  }

  if (error || !session) {
    return (
      <div className="px-[7%] py-10">
        <div className="flex items-center gap-2 mb-8">
          <Button 
            onClick={handleBack}
            variant="ghost" 
            className="p-0 hover:bg-transparent"
          >
            <ChevronLeft className="h-5 w-5 text-blue-500" />
          </Button>
          <h1 className="text-xl font-semibold">Session Details</h1>
        </div>

        <div className="text-center py-20 bg-[#fbfbfb] rounded-lg border border-[#EAECF0]">
          <h3 className="text-lg font-medium mb-2">Error Loading Session</h3>
          <p className="text-gray-500 text-sm">
            There was a problem loading the session details. Please try again later.
          </p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-[#ECF4FF] text-[#0B75FF]"
      case "IN_PROGRESS":
        return "bg-[#ECFDF3] text-[#037847]"
      case "COMPLETED":
        return "bg-[#EEEEF9] text-[#5925DC]"
      case "CANCELED":
        return "bg-[#FEF3F2] text-[#D92D20]"
      case "POSTPONED":
        return "bg-[#FFF6ED] text-[#F79009]"
      default:
        return "bg-[#ECF4FF] text-[#0B75FF]"
    }
  }

  const getStatusDotColor = (status: string | undefined) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-[#0B75FF]"
      case "IN_PROGRESS":
        return "bg-[#037847]"
      case "COMPLETED":
        return "bg-[#5925DC]"
      case "CANCELED":
        return "bg-[#D92D20]"
      case "POSTPONED":
        return "bg-[#F79009]"
      default:
        return "bg-[#0B75FF]"
    }
  }

  const formatStatus = (status: string | undefined): string => {
    if (!status) return ""
    return status.charAt(0) + status.slice(1).toLowerCase().replace("_", " ")
  }

  // Helper component for detail items
  const DetailItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="space-y-1">
      <h3 className="text-sm font-medium mb-2 text-[#292827]">{label}</h3>
      <div className="bg-white border border-[#E4E4E4] p-3 rounded-md min-h-[48px] flex items-center">
        <p className="text-sm text-[#565555]">{value}</p>
      </div>
    </div>
  )

  return (
    <div className="px-[7%] py-10">
      <div className="flex items-center gap-2 mb-8">
        <Button 
          onClick={handleBack}
          variant="ghost" 
          className="p-0 hover:bg-transparent"
        >
          <ChevronLeft className="h-5 w-5 text-blue-500" />
        </Button>
        <h1 className="text-xl font-semibold">Session Details</h1>
      </div>

      <div className="bg-[#FBFBFB] p-5 mb-8 rounded-lg border border-[#EAECF0]">
        <div className="flex flex-wrap justify-between items-center gap-x-10 gap-y-4">
          <div className="flex flex-col gap-1 min-w-[150px]">
            <h3 className="text-[#525252] font-bold text-sm">{session.name || 'Session Name N/A'}</h3>
            {/* Show cohort information if available */}
            {session.cohort && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-[#667085]">Cohort:</span>
                <span className="text-xs font-medium text-[#0B75FF]">{session.cohort.name}</span>
              </div>
            )}
            {/* Show session type badges */}
            <div className="flex gap-1 mt-1">
              {session.first === true && (
                <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                  First Session
                </span>
              )}
              {session.last === true && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-0.5 rounded-full">
                  Last Session
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#525252] font-bold text-xs">Date</span>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-[#565555]" />
              <span className="text-[#555252] font-light text-sm">
                {formatDateToDisplay(session.startDate)}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#525252] font-bold text-xs">Time</span>
            <span className="text-[#555252] font-light text-sm">
              {formatTimeToDisplay(session.startDate)} - {formatTimeToDisplay(session.endDate)}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#525252] font-bold text-xs">Delivery Method</span>
            <span
              className={`text-sm font-semibold ${
                session.deliveryMethod === "ONLINE"
                  ? "text-[#037847]"
                  : session.deliveryMethod === "OFFLINE"
                  ? "text-[#667085]"
                  : "text-[#F79009]"
              }`}
            >
              {session.deliveryMethod === "ONLINE"
                ? "Online"
                : session.deliveryMethod === "OFFLINE"
                ? "Offline"
                : "Self-paced"}
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[#525252] font-bold text-xs">Status</span>
            <div 
              className={`flex items-center gap-1.5 py-0.5 px-2 rounded-2xl w-fit ${getStatusColor(session.status)}`}
            >
              <div className={`h-1.5 w-1.5 rounded-full ${getStatusDotColor(session.status)}`}></div>
              <span className="text-xs font-medium">
                {formatStatus(session.status)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="session-details" className="w-full mb-8" onValueChange={setActiveTab}>
        <TabsList className="bg-transparent px-0 mb-6">
          <TabsTrigger 
            value="session-details"
          >
            Session Details
          </TabsTrigger>
          {!isTrainer && (
            <TabsTrigger 
              value="trainer-details"
            >
              Trainer Details
            </TabsTrigger>
          )}
          {!isTrainer && (
            <TabsTrigger 
              value="assistant-trainer-details"
            >
              Assistant Trainer Details
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="session-details" className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
            {/* Cohort Information */}
            {session.cohort && (
              <div className="col-span-1 md:col-span-2 lg:col-span-3">
                <h3 className="text-sm font-medium mb-2 text-[#292827]">Cohort Information</h3>
                <div className="bg-white border border-[#E4E4E4] p-3 rounded-md min-h-[48px]">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#292827]">Name:</span>
                      <span className="text-sm text-[#565555]">{session.cohort.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-[#292827]">Training:</span>
                      <span className="text-sm text-[#565555]">{session.cohort.trainingTitle}</span>
                    </div>
                    {session.cohort.description && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-[#292827]">Description:</span>
                        <span className="text-sm text-[#565555]">{session.cohort.description}</span>
                      </div>
                    )}
                    {session.cohort.tags && session.cohort.tags.length > 0 && (
                      <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-[#292827]">Tags:</span>
                        <div className="flex flex-wrap gap-1">
                          {session.cohort.tags.map((tag, index) => (
                            <span 
                              key={index} 
                              className="bg-[rgba(11,117,255,0.1)] text-black px-2 py-1 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Session Type Information */}
            {(session.first || session.last) && (
              <DetailItem 
                label="Session Type"
                value={
                  <div className="flex gap-2">
                    {session.first && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                        First Session
                      </span>
                    )}
                    {session.last && (
                      <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">
                        Last Session
                      </span>
                    )}
                  </div>
                }
              />
            )}

            <div className="col-span-1 md:col-span-2 lg:col-span-3">
              <h3 className="text-sm font-medium mb-2 text-[#292827]">Select Module / Lessons</h3>
              <div className="bg-white border border-[#E4E4E4] p-3 rounded-md min-h-[48px]">
                <div className="flex flex-wrap gap-2">
                  {session.lessons && session.lessons.length > 0 ? (
                    session.lessons.map((lesson) => (
                      <span 
                        key={lesson.id} 
                        className="bg-[rgba(11,117,255,0.1)] text-black px-2 py-1 rounded-full text-xs font-light"
                      >
                        {lesson.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500 italic">No lessons assigned</span>
                  )}
                </div>
              </div>
            </div>

            <DetailItem 
              label="Delivery Method" 
              value={session.deliveryMethod === "OFFLINE" ? "Offline" : "Online"}
            />

            <DetailItem 
              label="Number of Students"
              value={session.numberOfStudents ?? 'Not specified'}
            />

            <DetailItem 
              label="Training Venue"
              value={session.trainingVenue ? 
                `${session.trainingVenue.name}, ${session.trainingVenue.location}${session.trainingVenue.city ? `, ${session.trainingVenue.city.name}` : ''}` : 
                'No venue specified'}
            />

            <div className="space-y-1">
              <h3 className="text-sm font-medium mb-2 text-[#292827]">Starts On</h3>
              <div className="flex gap-4 items-center">
                <div className="bg-white border border-[#E4E4E4] p-3 rounded-md flex-1 min-h-[48px] flex items-center">
                  <p className="text-sm text-[#565555]">
                    {formatDateToDisplay(session.startDate)}
                  </p>
                </div>
                <p className="text-sm font-medium text-[#292827]">at</p>
                <div className="bg-white border border-[#E4E4E4] p-3 rounded-md w-32 min-h-[48px] flex items-center">
                  <p className="text-sm text-[#565555]">
                    {formatTimeToDisplay(session.startDate)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-medium mb-2 text-[#292827]">Ends On</h3>
              <div className="flex gap-4 items-center">
                <div className="bg-white border border-[#E4E4E4] p-3 rounded-md flex-1 min-h-[48px] flex items-center">
                  <p className="text-sm text-[#565555]">
                    {formatDateToDisplay(session.endDate)}
                  </p>
                </div>
                <p className="text-sm font-medium text-[#292827]">at</p>
                <div className="bg-white border border-[#E4E4E4] p-3 rounded-md w-32 min-h-[48px] flex items-center">
                  <p className="text-sm text-[#565555]">
                    {formatTimeToDisplay(session.endDate)}
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2 text-[#292827]">
                  The Training Venue meets the technological and tools requirement?
                </h3>
                {session.meetsRequirement === undefined ? (
                  <p className="text-sm text-gray-500 italic pt-2">Not specified</p>
                ) : (
                  <RadioGroup 
                    defaultValue={session.meetsRequirement ? "yes" : "no"}
                    className="flex items-center space-x-6 pt-2"
                    disabled
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="yes" id="req-yes" />
                      <Label htmlFor="req-yes" className="text-sm text-[#565555] font-normal cursor-default">
                        Yes
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="req-no" />
                      <Label htmlFor="req-no" className="text-sm text-[#565555] font-normal cursor-default">
                        No
                      </Label>
                    </div>
                  </RadioGroup>
                )}
              </div>
              {session.meetsRequirement === false && session.requirementRemark && (
                <DetailItem 
                  label="Requirement Remark"
                  value={session.requirementRemark}
                />
              )}
            </div>

            <DetailItem 
              label="Trainer Compensation Type"
              value={session.trainerCompensationType ? 
                session.trainerCompensationType.split('_').map(word => 
                  word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
                ).join(' ') : 
                'Not specified'}
            />

            <DetailItem 
              label="Amount"
              value={session.trainerCompensationAmount !== undefined ? `${session.trainerCompensationAmount} ETB` : 'Not specified'}
            />
          </div>
        </TabsContent>

        <TabsContent value="trainer-details">
          <Suspense fallback={<TabLoadingFallback />}>
            <TrainerDetailsTab sessionId={sessionId} trainerType="MAIN" />
          </Suspense>
        </TabsContent>

        <TabsContent value="assistant-trainer-details">
          <Suspense fallback={<TabLoadingFallback />}>
            <TrainerDetailsTab sessionId={sessionId} trainerType="ASSISTANT" />
          </Suspense>
        </TabsContent>
      </Tabs>
    </div>
  )
} 