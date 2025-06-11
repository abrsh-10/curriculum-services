import { useState, useEffect, useCallback } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "@/lib/utils"

import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

import { Module } from "@/types/module"
import { useAddSession, useAddCohortSession, useUpdateSession, useSession } from "@/lib/hooks/useSession"
import { useModulesByTrainingId } from "@/lib/hooks/useModule"
import { useGetLessons } from "@/lib/hooks/useLesson"
import { useTrainingVenues } from "@/lib/hooks/useTrainingVenue"
import { sessionSchema, SessionFormValues, timeOptions, CustomCreateSessionData } from "./session-schema"
import { toast } from "sonner"

// Helper function to format Date to YYYY-MM-DD string
const formatDateForInput = (date: Date | null | undefined): string => {
  if (!date) return ""
  // Adjust for timezone offset before formatting
  const adjustedDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return adjustedDate.toISOString().split("T")[0]
}

// Helper function to convert date string to date object
const parseDate = (dateString: string): Date => {
  return new Date(dateString)
}

interface SessionFormProps {
  trainingId: string
  companyId: string
  cohortId?: string // Optional for cohort sessions
  sessionId?: string // Optional for editing
  onSuccess: () => void
  onCancel: () => void
}

// Extended Module type with parent-child relationship as returned by API
interface ModuleWithRelationship extends Module {
  parentModule?: {
    id: string;
    name: string;
    description: string;
  } | null;
}

export function SessionForm({ trainingId, companyId, cohortId, sessionId, onSuccess, onCancel }: SessionFormProps) {
  // Determine if we're editing
  const isEditing = !!sessionId
  
  // Fetch session data if editing
  const { data: existingSession, isLoading: isLoadingSession } = useSession(sessionId || '')
  
  // Fetch required data
  const { addSession, isLoading: isAddingSession } = useAddSession()
  const { addCohortSession, isLoading: isAddingCohortSession } = useAddCohortSession()
  const { updateSession, isLoading: isUpdatingSession } = useUpdateSession()
  const { data: modulesData, isLoading: isLoadingModules } = useModulesByTrainingId(trainingId, true)
  const { data: venuesData, isLoading: isLoadingVenues } = useTrainingVenues()
  
  // State for selected modules to filter lessons
  const [selectedModuleIds, setSelectedModuleIds] = useState<string[]>([])
  const [selectedSubModuleId, setSelectedSubModuleId] = useState<string | null>(null)
  
  // Track which module is currently active for UI display
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null)

  // Fetch lessons for the selected active module
  const moduleIdToFetch = selectedSubModuleId || activeModuleId
  const { data: lessonsByModule, isLoading: isLoadingLessons } = useGetLessons(moduleIdToFetch || '')
  
  // Import Lesson type from useLesson hook for proper typing
  interface Lesson {
    id: string
    name: string
    description: string
    objective: string
    duration: number
    durationType: "HOURS" | "DAYS" | "WEEKS" | "MONTHS"
    moduleId: string
  }

  // State to track all fetched lessons across modules
  const [allLessonsByModule, setAllLessonsByModule] = useState<Record<string, Lesson[]>>({})
  
  // Update lessons when a module is selected
  useEffect(() => {
    if (moduleIdToFetch) {
      // When lessons are loaded for a module, store them
      if (lessonsByModule && !isLoadingLessons) {
        setAllLessonsByModule(prev => ({
          ...prev,
          [moduleIdToFetch]: lessonsByModule
        }))
      }
    }
  }, [moduleIdToFetch, lessonsByModule, isLoadingLessons])
  
  // Form setup
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      name: "",
      lessonIds: [],
      deliveryMethod: "OFFLINE",
      startDate: new Date(),
      startTime: "9:00 AM",
      endDate: new Date(),
      endTime: "5:00 PM",
      numberOfStudents: 0,
      trainingVenueId: "",
      meetsRequirement: true,
      requirementRemark: "",
      trainerCompensationType: "PER_HOUR",
      trainerCompensationAmount: 0,
      numberOfAssistantTrainer: 0,
      assistantTrainerCompensationAmount: 0,
      isFirst: false,
      isLast: false,
    },
  })

  // Memoize the formatTime function to prevent unnecessary re-renders
  const formatTime = useCallback((date: Date) => {
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const ampm = hours >= 12 ? 'PM' : 'AM'
    const displayHours = hours % 12 || 12
    const displayMinutes = minutes.toString().padStart(2, '0')
    return `${displayHours}:${displayMinutes} ${ampm}`
  }, [])

  // Populate form with existing data when editing
  useEffect(() => {
    if (isEditing && existingSession && !isLoadingSession) {
      // Extract time from datetime strings
      const startDateTime = new Date(existingSession.startDate)
      const endDateTime = new Date(existingSession.endDate)

      form.reset({
        name: existingSession.name,
        lessonIds: existingSession.lessons.map(lesson => lesson.id),
        deliveryMethod: existingSession.deliveryMethod,
        startDate: startDateTime,
        startTime: formatTime(startDateTime),
        endDate: endDateTime,
        endTime: formatTime(endDateTime),
        numberOfStudents: existingSession.numberOfStudents,
        trainingVenueId: existingSession.trainingVenue?.id || "",
        meetsRequirement: existingSession.meetsRequirement,
        requirementRemark: existingSession.requirementRemark || "",
        trainerCompensationType: existingSession.trainerCompensationType,
        trainerCompensationAmount: existingSession.trainerCompensationAmount,
        numberOfAssistantTrainer: existingSession.numberOfAssistantTrainers,
        assistantTrainerCompensationType: existingSession.assistantTrainerCompensationType,
        assistantTrainerCompensationAmount: existingSession.assistantTrainerCompensationAmount,
        trainingLink: existingSession.trainingLink || "",
        isFirst: existingSession.first || false,
        isLast: existingSession.last || false,
      })
    }
  }, [isEditing, existingSession, isLoadingSession, formatTime])

                // Auto-detect module/submodule based on selected lessons when editing
  useEffect(() => {
    if (isEditing && existingSession && modulesData?.modules && existingSession.lessons.length > 0) {
      // For edit mode, if we can't auto-detect the module from lessons,
      // we'll select the first main module as a fallback so users can see lessons
      const allModules = modulesData.modules as ModuleWithRelationship[]
      const mainModules = allModules.filter(moduleItem => !moduleItem.parentModule)
      
      if (mainModules.length > 0) {
        // Set the first main module as selected to enable lesson viewing
        setSelectedModuleIds([mainModules[0].id])
        setActiveModuleId(mainModules[0].id)
      }
    }
  }, [isEditing, existingSession, modulesData])
  
  // Get modules and submodules
  const modules = (modulesData?.modules || []) as ModuleWithRelationship[]
  const mainModules = modules.filter(m => !m.parentModule)
  
  // Get submodules for selected module
  const subModules = modules.filter(m => m.parentModule !== null && m.parentModule !== undefined)
  
  // Handler for form submission
  const onSubmit = (values: SessionFormValues) => {
    // Convert dates and times to ISO format
    const startDateTime = new Date(values.startDate)
    const startTimeParts = values.startTime.match(/(\d+):(\d+)\s?(AM|PM)/)
    if (startTimeParts) {
      let hours = parseInt(startTimeParts[1])
      const minutes = parseInt(startTimeParts[2])
      const period = startTimeParts[3]
      
      if (period === "PM" && hours < 12) hours += 12
      if (period === "AM" && hours === 12) hours = 0
      
      startDateTime.setHours(hours, minutes)
    }
    
    const endDateTime = new Date(values.endDate)
    const endTimeParts = values.endTime.match(/(\d+):(\d+)\s?(AM|PM)/)
    if (endTimeParts) {
      let hours = parseInt(endTimeParts[1])
      const minutes = parseInt(endTimeParts[2])
      const period = endTimeParts[3]
      
      if (period === "PM" && hours < 12) hours += 12
      if (period === "AM" && hours === 12) hours = 0
      
      endDateTime.setHours(hours, minutes)
    }
    
    // Create session data that matches CreateSessionData type
    const sessionData: CustomCreateSessionData = {
      name: values.name,
      lessonIds: values.lessonIds,
      deliveryMethod: values.deliveryMethod,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
      startTime: values.startTime,
      endTime: values.endTime,
      numberOfStudents: values.numberOfStudents,
      trainingVenueId: values.trainingVenueId || "", // Provide default empty string
      meetsRequirement: values.meetsRequirement,
      requirementRemark: values.meetsRequirement ? "" : (values.requirementRemark || ""),
      trainerCompensationType: values.trainerCompensationType,
      trainerCompensationAmount: values.trainerCompensationAmount,
      numberOfAssistantTrainer: values.numberOfAssistantTrainer,
      assistantTrainerCompensationType: values.numberOfAssistantTrainer > 0 
        ? (values.assistantTrainerCompensationType || "PER_HOUR") 
        : "PER_HOUR",
      assistantTrainerCompensationAmount: values.numberOfAssistantTrainer > 0 
        ? (values.assistantTrainerCompensationAmount || 0) 
        : 0,
      isFirst: values.isFirst === true ? true : false,
      isLast: values.isLast === true ? true : false,
    }
    
    // Add training link only for online or self-paced delivery
    if ((values.deliveryMethod === "ONLINE" || values.deliveryMethod === "SELF_PACED") && values.trainingLink) {
      sessionData.trainingLink = values.trainingLink
    }
    
    if (isEditing && sessionId) {
      // Update existing session
      updateSession({ sessionId, sessionData }, {
        onSuccess: () => {
          toast.success('Session updated successfully')
          onSuccess()
        },
        onError: (error) => {
          console.error(error)
        }
      })
    } else if (cohortId) {
      // Add session to cohort
      const cohortSessionData = {
        ...sessionData,
        cohortId
      }
      addCohortSession({ cohortId, sessionData: cohortSessionData }, {
        onSuccess: () => {
          toast.success('Session added to cohort successfully')
          onSuccess()
        },
        onError: (error) => {
          console.error(error)
        }
      })
    } else {
      // Add session to training
      addSession({ trainingId, sessionData }, {
        onSuccess: () => {
          toast.success('Session created successfully')
          onSuccess()
        },
        onError: (error) => {
          console.error(error)
        }
      })
    }
  }
  
  // Watch form values to enable/disable certain fields
  const meetsRequirement = form.watch("meetsRequirement")
  const deliveryMethod = form.watch("deliveryMethod")
  const numberOfAssistantTrainer = form.watch("numberOfAssistantTrainer")
  
  const isLoading = isAddingSession || isAddingCohortSession || isUpdatingSession || isLoadingSession

  // Show loading if we're fetching session data for editing
  if (isEditing && isLoadingSession) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading session data...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="relative">
      <ScrollArea className="h-[65vh] md:h-[65vh] pr-4">
        <div className="px-4 py-2 pb-24">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Session Name */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter session name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Session Type Tags */}
              <div className="space-y-4">
                <Label>Session Type (Optional)</Label>
                <div className="flex gap-6">
                  <FormField
                    control={form.control}
                    name="isFirst"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={Boolean(field.value)}
                            onCheckedChange={(checked) => {
                              field.onChange(checked === true)
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            First Session
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Mark as the first session in the sequence
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isLast"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={Boolean(field.value)}
                            onCheckedChange={(checked) => {
                              field.onChange(checked === true)
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Last Session
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Mark as the final session in the sequence
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Module Selection */}
              <div className="space-y-2">
                <Label>Select Modules</Label>
                {isLoadingModules ? (
                  <div className="py-2 px-3 border rounded-md text-sm text-gray-500">Loading modules...</div>
                ) : mainModules.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-md bg-gray-50">
                    <p className="text-sm text-gray-600 mb-1 text-center">
                      No modules available for this training.
                    </p>
                    <p className="text-xs text-gray-500 text-center">
                      You need to create modules and lessons before creating a session.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border rounded-md p-3">
                      <p className="text-sm font-medium mb-2">Select one or more modules to include lessons from:</p>
                      <div className="space-y-2">
                        {mainModules.map((module) => (
                          <div key={module.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`module-${module.id}`}
                              checked={selectedModuleIds.includes(module.id)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  // Add module to selected modules
                                  setSelectedModuleIds(prev => [...prev, module.id]);
                                  setActiveModuleId(module.id);
                                  // Reset submodule selection
                                  setSelectedSubModuleId(null);
                                } else {
                                  // Remove module from selected modules
                                  setSelectedModuleIds(prev => prev.filter(id => id !== module.id));
                                  // Also remove any selected lessons from this module
                                  const currentLessons = form.getValues("lessonIds");
                                  const moduleLessons = allLessonsByModule[module.id] || [];
                                  const lessonIdsToRemove = moduleLessons.map(lesson => lesson.id);
                                  form.setValue(
                                    "lessonIds", 
                                    currentLessons.filter(id => !lessonIdsToRemove.includes(id))
                                  );
                                  // Update active module if needed
                                  if (activeModuleId === module.id) {
                                    setActiveModuleId(selectedModuleIds.filter(id => id !== module.id)[0] || null);
                                  }
                                }
                              }}
                            />
                            <label
                              htmlFor={`module-${module.id}`}
                              className="text-sm font-medium leading-none cursor-pointer"
                              onClick={() => {
                                if (selectedModuleIds.includes(module.id)) {
                                  setActiveModuleId(module.id);
                                  setSelectedSubModuleId(null);
                                }
                              }}
                            >
                              {module.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Display selected modules */}
                    {selectedModuleIds.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {selectedModuleIds.map((id) => {
                          const foundModule = mainModules.find(m => m.id === id);
                          return (
                            <Badge 
                              key={id} 
                              variant={activeModuleId === id ? "pending" : "secondary"}
                              className="px-3 py-1.5 text-sm flex items-center cursor-pointer"
                              onClick={() => {
                                setActiveModuleId(id);
                                setSelectedSubModuleId(null);
                              }}
                            >
                              {foundModule?.name || id}
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Submodule Selection (Optional) */}
              {activeModuleId && subModules.filter(m => m.parentModule?.id === activeModuleId).length > 0 && (
                <div className="space-y-2">
                  <Label>Select Submodule (Optional)</Label>
                  <Select 
                    value={selectedSubModuleId || ""}
                    onValueChange={(value) => {
                      setSelectedSubModuleId(value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a submodule" />
                    </SelectTrigger>
                    <SelectContent>
                      {subModules
                        .filter(m => m.parentModule?.id === activeModuleId)
                        .map((subModule) => (
                          <SelectItem key={subModule.id} value={subModule.id}>
                            {subModule.name}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Lesson Selection */}
              <FormField
                control={form.control}
                name="lessonIds"
                render={({ field }) => (
                  <FormItem className="relative">
                    <FormLabel>Select Lessons</FormLabel>
                    
                    {/* Show existing lessons in edit mode */}
                    {isEditing && existingSession && existingSession.lessons.length > 0 && (
                      <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <p className="text-sm font-medium text-blue-800 mb-2">Current Session Lessons:</p>
                        <div className="flex flex-wrap gap-2">
                          {existingSession.lessons.map((lesson) => (
                            <Badge key={lesson.id} variant="secondary" className="px-2 py-1">
                              {lesson.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="border rounded-md p-3">
                      {selectedModuleIds.length === 0 ? (
                        <div className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-md bg-gray-50">
                          <p className="text-sm text-gray-600 text-center">
                            Please select one or more modules first to view available lessons
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {/* Show all available lessons from selected modules in a single list */}
                          {isLoadingLessons && moduleIdToFetch ? (
                            <div className="py-3 text-sm text-gray-500 text-center">
                              Loading lessons...
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {/* Current module's lessons */}
                              {moduleIdToFetch && lessonsByModule && lessonsByModule.length > 0 && (
                                lessonsByModule.map((lesson) => (
                                  <div key={lesson.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={lesson.id}
                                      checked={field.value.includes(lesson.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          field.onChange([...field.value, lesson.id])
                                        } else {
                                          field.onChange(field.value.filter((id) => id !== lesson.id))
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={lesson.id}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                      {lesson.name}
                                    </label>
                                  </div>
                                ))
                              )}

                              {/* Lessons from all other selected modules */}
                              {Object.entries(allLessonsByModule)
                                .filter(([id]) => id !== moduleIdToFetch && selectedModuleIds.includes(id))
                                .flatMap(([moduleId, lessons]) => 
                                  lessons.map((lesson) => (
                                    <div key={lesson.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={lesson.id}
                                        checked={field.value.includes(lesson.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            field.onChange([...field.value, lesson.id])
                                          } else {
                                            field.onChange(field.value.filter((id) => id !== lesson.id))
                                          }
                                        }}
                                      />
                                      <label
                                        htmlFor={lesson.id}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                      >
                                        {lesson.name}
                                      </label>
                                    </div>
                                  ))
                                )
                              }

                              {/* Show message when no lessons are available */}
                              {(!lessonsByModule || lessonsByModule.length === 0) && 
                               Object.entries(allLessonsByModule).filter(([id]) => selectedModuleIds.includes(id)).length === 0 && (
                                <div className="flex flex-col items-center justify-center p-4 border border-dashed border-gray-300 rounded-md bg-gray-50">
                                  <p className="text-sm text-gray-600 text-center">
                                    No lessons available for the selected modules
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {field.value?.length > 0 && (
                      <div className="mt-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium text-gray-700">
                            Selected Lessons ({field.value.length})
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {field.value.map((id) => {
                            // Try to find lesson in all available sources
                            let displayLesson = null;
                            
                            // Check current active module's lessons
                            if (lessonsByModule) {
                              displayLesson = lessonsByModule.find(l => l.id === id);
                            }
                            
                            // If not found, check all other modules' lessons
                            if (!displayLesson) {
                              for (const [moduleId, lessons] of Object.entries(allLessonsByModule)) {
                                const lesson = lessons.find(l => l.id === id);
                                if (lesson) {
                                  displayLesson = lesson;
                                  break;
                                }
                              }
                            }
                            
                            // If still not found and we're editing, check existing session
                            if (!displayLesson && isEditing && existingSession) {
                              displayLesson = existingSession.lessons.find(l => l.id === id) || null;
                            }
                            
                            return (
                              <Badge 
                                key={id} 
                                variant="pending"
                                className="px-3 py-1.5 text-sm"
                              >
                                {displayLesson?.name || id}
                              </Badge>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Delivery Method */}
              <FormField
                control={form.control}
                name="deliveryMethod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Method</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select delivery method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="OFFLINE">Offline</SelectItem>
                          <SelectItem value="ONLINE">Online</SelectItem>
                          <SelectItem value="SELF_PACED">Self-paced</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Start Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={formatDateForInput(field.value)}
                          onChange={(e) => {
                            const newDate = parseDate(e.target.value)
                            field.onChange(newDate)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* End Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={formatDateForInput(field.value)}
                          onChange={(e) => {
                            const newDate = parseDate(e.target.value)
                            field.onChange(newDate)
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Select 
                          value={field.value} 
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select time" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={time} value={time}>
                                {time}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Number of Students */}
              <FormField
                control={form.control}
                name="numberOfStudents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number of Students</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={0}
                        {...field} 
                        onChange={e => {
                          const value = e.target.value === "" ? 0 : Number(e.target.value);
                          field.onChange(isNaN(value) ? 0 : value);
                        }}
                        placeholder="Enter number of students" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Training Venue (for offline delivery) */}
              <FormField
                control={form.control}
                name="trainingVenueId"
                render={({ field }) => (
                  <FormItem className={cn(
                    deliveryMethod !== "OFFLINE" && "hidden"
                  )}>
                    <FormLabel>Training Venue</FormLabel>
                    <FormControl>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a venue" />
                        </SelectTrigger>
                        <SelectContent>
                          {isLoadingVenues ? (
                            <div className="py-2 px-3 text-sm text-gray-500">Loading venues...</div>
                          ) : venuesData?.venues && venuesData.venues.length > 0 ? (
                            venuesData.venues.map((venue) => (
                              <SelectItem key={venue.id} value={venue.id}>
                                {venue.name} - {venue.location}
                              </SelectItem>
                            ))
                          ) : (
                            <div className="py-2 px-3 text-sm text-gray-500">No venues available</div>
                          )}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Training Link (for online/self-paced delivery) */}
              <FormField
                control={form.control}
                name="trainingLink"
                render={({ field }) => (
                  <FormItem className={cn(
                    (deliveryMethod !== "ONLINE" && deliveryMethod !== "SELF_PACED") && "hidden"
                  )}>
                    <FormLabel>Training Link</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={field.value || ''} 
                        placeholder="Enter meeting link (Zoom, Teams, etc.)" 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Venue Requirements */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name="meetsRequirement"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={Boolean(field.value)}
                            onCheckedChange={(checked) => {
                              field.onChange(checked === true)
                            }}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Meets venue requirements
                          </FormLabel>
                          <p className="text-xs text-muted-foreground">
                            Check if the venue meets all training requirements
                          </p>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                {!meetsRequirement && (
                  <FormField
                    control={form.control}
                    name="requirementRemark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Requirement Remarks</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            value={field.value || ''} 
                            placeholder="Describe what requirements are not met..."
                            className="min-h-[80px]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              {/* Trainer Compensation */}
              <div className="space-y-4">
                <Label className="text-base font-medium">Trainer Compensation</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="trainerCompensationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Compensation Type</FormLabel>
                        <FormControl>
                          <Select 
                            value={field.value} 
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="PER_HOUR">Per Hour</SelectItem>
                              <SelectItem value="PER_TRAINEES">Per Trainee</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="trainerCompensationAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0}
                            {...field} 
                            onChange={e => {
                              const value = e.target.value === "" ? 0 : Number(e.target.value);
                              field.onChange(isNaN(value) ? 0 : value);
                            }}
                            placeholder="Enter amount" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              {/* Assistant Trainer */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="numberOfAssistantTrainer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Assistant Trainers</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={0}
                          {...field} 
                          onChange={e => {
                            const value = e.target.value === "" ? 0 : Number(e.target.value);
                            field.onChange(isNaN(value) ? 0 : value);
                          }}
                          placeholder="Enter number of assistant trainers" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {numberOfAssistantTrainer > 0 && (
                  <div className="space-y-4">
                    <Label className="text-base font-medium">Assistant Trainer Compensation</Label>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="assistantTrainerCompensationType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Compensation Type</FormLabel>
                            <FormControl>
                              <Select 
                                value={field.value || "PER_HOUR"} 
                                onValueChange={field.onChange}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="PER_HOUR">Per Hour</SelectItem>
                                  <SelectItem value="PER_TRAINEES">Per Trainee</SelectItem>
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="assistantTrainerCompensationAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={0}
                                {...field} 
                                onChange={e => {
                                  const value = e.target.value === "" ? 0 : Number(e.target.value);
                                  field.onChange(isNaN(value) ? 0 : value);
                                }}
                                placeholder="Enter amount" 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>
            </form>
          </Form>
        </div>
      </ScrollArea>
      
      {/* Fixed footer with buttons */}
      <div className="absolute bottom-0 left-0 right-0 py-4 px-6 bg-white border-t rounded-b-lg flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          Back
        </Button>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={isLoading}
          className="bg-brand text-white"
        >
          {isLoading 
            ? "Processing..." 
            : isEditing 
              ? "Update Session" 
              : cohortId 
                ? "Add to Cohort" 
                : "Create Session"
          }
        </Button>
      </div>
    </div>
  )
} 