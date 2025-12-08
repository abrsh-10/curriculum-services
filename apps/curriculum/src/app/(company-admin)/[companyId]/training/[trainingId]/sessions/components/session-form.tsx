import { useState, useEffect, useCallback, useMemo } from "react"
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
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

import { Module } from "@/types/module"
import { useAddSession, useAddCohortSession, useUpdateSession, useSession } from "@/lib/hooks/useSession"
import { useModulesByTrainingId } from "@/lib/hooks/useModule"
import { useGetLessons } from "@/lib/hooks/useLesson"
import { useTrainingVenues } from "@/lib/hooks/useTrainingVenue"
import { sessionSchema, SessionFormValues, CustomCreateSessionData } from "./session-schema"
import { toast } from "sonner"
import { SessionCompensationSection } from "./session-compensation-section"
import { Loading } from "@/components/ui/loading"
import { TimePicker } from "./time-picker"

// Helper function to format Date to YYYY-MM-DD string in Ethiopia timezone (EAT/UTC+3)
const formatDateForInput = (date: Date | null | undefined): string => {
  if (!date) return ""
  
  // Convert UTC to Ethiopia time by adding 3 hours
  const eatDate = new Date(date.getTime() + (3 * 60 * 60 * 1000))
  const year = eatDate.getUTCFullYear()
  const month = (eatDate.getUTCMonth() + 1).toString().padStart(2, '0')
  const day = eatDate.getUTCDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Helper function to format Date to HH:MM string in Ethiopia timezone (EAT/UTC+3)
const formatTimeForInput = (date: Date | null | undefined): string => {
  if (!date) return ""
  
  // Convert UTC to Ethiopia time by adding 3 hours
  const eatDate = new Date(date.getTime() + (3 * 60 * 60 * 1000))
  const hours = eatDate.getUTCHours().toString().padStart(2, '0')
  const minutes = eatDate.getUTCMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

// Helper function to convert date string to date object
// Ensures the date string is treated as UTC by appending 'Z' if not present
const parseDate = (dateString: string): Date => {
  // If the date string doesn't end with 'Z' and doesn't have timezone info, treat it as UTC
  const normalizedDateString = dateString.endsWith('Z') || dateString.includes('+') || dateString.includes('T') && dateString.split('T')[1]?.includes('-')
    ? dateString 
    : `${dateString}Z`
  return new Date(normalizedDateString)
}

// Helper function to combine date and time into a single Date object
// Input time is in Ethiopia timezone (EAT/UTC+3), need to convert to UTC for storage
const combineDateAndTime = (date: Date, timeString: string): Date => {
  const [hours, minutes] = timeString.split(':').map(Number)
  
  // Get date components from the input date
  const year = date.getFullYear()
  const month = date.getMonth()
  const day = date.getDate()
  
  // Create date in Ethiopia timezone first
  const eatDate = new Date(Date.UTC(year, month, day, hours, minutes, 0, 0))
  
  // Convert Ethiopia time (UTC+3) to UTC by subtracting 3 hours
  // For example: 9 AM EAT → 6 AM UTC
  const utcDate = new Date(eatDate.getTime() - (3 * 60 * 60 * 1000))
  return utcDate
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

export function SessionForm({ trainingId, cohortId, sessionId, onSuccess, onCancel }: SessionFormProps) {
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

  // Load lessons for all selected modules when editing
  useEffect(() => {
    if (isEditing && selectedModuleIds.length > 0) {
      // Set the first selected module as active to trigger lesson loading
      if (!activeModuleId && selectedModuleIds.length > 0) {
        setActiveModuleId(selectedModuleIds[0])
      }
    }
  }, [isEditing, selectedModuleIds, activeModuleId])
  
  // Form setup
  const form = useForm<SessionFormValues>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      name: "",
      lessonIds: [],
      deliveryMethod: "OFFLINE",
      startDate: new Date(),
      startTime: "09:00",
      endDate: new Date(),
      endTime: "17:00",
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

  // Memoize form data calculation to prevent unnecessary re-renders
  const formDataForEdit = useMemo(() => {
    if (!isEditing || !existingSession) return null
    
    const startDateTime = new Date(existingSession.startDate)
    const endDateTime = new Date(existingSession.endDate)

    const formData = {
      name: existingSession.name,
      lessonIds: existingSession.lessons.map(lesson => lesson.id),
      deliveryMethod: existingSession.deliveryMethod,
      startDate: startDateTime,
      startTime: formatTimeForInput(startDateTime),
      endDate: endDateTime,
      endTime: formatTimeForInput(endDateTime),
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
    }
    
    return formData
  }, [isEditing, existingSession])

  // Watch form values to enable/disable certain fields
  const deliveryMethod = form.watch("deliveryMethod")
  
  const isLoading = isAddingSession || isAddingCohortSession || isUpdatingSession || isLoadingSession

  // Populate form with existing data when editing - using a ref to track if we've already populated
  const [hasPopulatedForm, setHasPopulatedForm] = useState(false)
  
  useEffect(() => {
    if (isEditing && formDataForEdit && !hasPopulatedForm && modulesData?.modules) {
      // Reset form with all values
      form.reset(formDataForEdit)
      
      // Explicitly set delivery method to ensure it's recognized
      if (formDataForEdit.deliveryMethod) {
        form.setValue("deliveryMethod", formDataForEdit.deliveryMethod);
      }
      
      setHasPopulatedForm(true)
    }
  }, [isEditing, formDataForEdit, hasPopulatedForm, modulesData?.modules, form])
  
  // Auto-detect selected modules based on the lessons of the session when editing
  useEffect(() => {
    if (isEditing && existingSession && modulesData?.modules && !isLoadingModules && selectedModuleIds.length === 0) {
      const allModules = modulesData.modules as ModuleWithRelationship[]
      const autoSelectedMainIds = new Set<string>();

      // Check if lessons have moduleId, if so use them
      const hasModuleIds = existingSession.lessons.some(lesson => 'moduleId' in lesson && lesson.moduleId)
      
      if (hasModuleIds) {
        // Use moduleId approach
        (existingSession.lessons as Array<{ moduleId?: string }>).forEach((lesson: { moduleId?: string }) => {
          const moduleId = lesson.moduleId
          if (!moduleId) return
          const lessonModule = allModules.find((m) => m.id === moduleId)
          if (lessonModule) {
            if (lessonModule.parentModule?.id) {
              autoSelectedMainIds.add(lessonModule.parentModule.id)
            } else {
              autoSelectedMainIds.add(lessonModule.id)
            }
          }
        })
      } else {
        // Fallback: select all main modules so user can see all available lessons
        // This allows the form to work even when moduleId is not provided
        const mainModules = allModules.filter(m => !m.parentModule)
        mainModules.forEach(module => {
          autoSelectedMainIds.add(module.id)
        })
      }

      if (autoSelectedMainIds.size > 0) {
        const mainIds = Array.from(autoSelectedMainIds) as string[]
        setSelectedModuleIds(mainIds)
        setActiveModuleId(mainIds[0])
      }
    }
  }, [isEditing, existingSession, modulesData, isLoadingModules, selectedModuleIds.length])
  
  // Get modules and submodules
  const modules = (modulesData?.modules || []) as ModuleWithRelationship[]
  const mainModules = modules.filter(m => !m.parentModule)
  
  // Get submodules for selected module
  const subModules = modules.filter(m => m.parentModule !== null && m.parentModule !== undefined)
  
  // Handler for form submission
  const onSubmit = (values: SessionFormValues) => {
    // Combine date and time for start and end
    const startDateTime = combineDateAndTime(values.startDate, values.startTime)
    const endDateTime = combineDateAndTime(values.endDate, values.endTime)
    
    // Create session data that matches CreateSessionData type
    const sessionData: CustomCreateSessionData = {
      name: values.name,
      lessonIds: values.lessonIds,
      deliveryMethod: values.deliveryMethod,
      startDate: startDateTime.toISOString(),
      endDate: endDateTime.toISOString(),
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
          console.log(error)
        }
      })
    }
  }
  
  // Show loading if we're fetching session data for editing
  if (isEditing && (isLoadingSession || isLoadingModules)) {
    return (
      <div className="relative">
      <ScrollArea className="h-[65vh] md:h-[65vh] pr-4">
        <div className="px-4 py-2">
            <Loading/>
        </div>
        </ScrollArea>
      </div>
    )
  }

  // Show error if session data failed to load in edit mode
  if (isEditing && !existingSession && !isLoadingSession) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-red-500">Failed to load session data</p>
          <Button onClick={onCancel} variant="outline" className="mt-4">
            Close
          </Button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="relative">
      <ScrollArea className="h-[65vh] md:h-[65vh] pr-4">
        <div className="px-4 py-2 pb-24">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" key={`session-form-${sessionId || 'new'}`}>
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
                                lessonsByModule.map((lesson) => {
                                  const currentModule = modules.find(m => m.id === moduleIdToFetch)
                                  return (
                                    <div key={lesson.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={lesson.id}
                                        checked={(field.value ?? []).includes(lesson.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            field.onChange([...(field.value ?? []), lesson.id])
                                          } else {
                                            field.onChange((field.value ?? []).filter((id) => id !== lesson.id))
                                          }
                                        }}
                                      />
                                      <label
                                        htmlFor={lesson.id}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                      >
                                        {lesson.name}
                                      </label>
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {currentModule?.name || 'Unknown Module'}
                                      </span>
                                    </div>
                                  )
                                })
                              )}

                              {/* Lessons from all other selected modules */}
                              {Object.entries(allLessonsByModule)
                                .filter(([id]) => id !== moduleIdToFetch && selectedModuleIds.includes(id))
                                .flatMap(([moduleId, lessons]) => {
                                  const moduleForLessons = modules.find(m => m.id === moduleId)
                                  return lessons.map((lesson) => (
                                    <div key={lesson.id} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={lesson.id}
                                        checked={(field.value ?? []).includes(lesson.id)}
                                        onCheckedChange={(checked) => {
                                          if (checked) {
                                            field.onChange([...(field.value ?? []), lesson.id])
                                          } else {
                                            field.onChange((field.value ?? []).filter((id) => id !== lesson.id))
                                          }
                                        }}
                                      />
                                      <label
                                        htmlFor={lesson.id}
                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                      >
                                        {lesson.name}
                                      </label>
                                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                        {moduleForLessons?.name || 'Unknown Module'}
                                      </span>
                                    </div>
                                  ))
                                }
                              )}

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
                        onValueChange={(value) => {
                          // Only set if it's one of our valid options
                          if (value === "OFFLINE" || value === "ONLINE" || value === "SELF_PACED") {
                            field.onChange(value);
                          }
                        }}
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
              
              {/* Start Date/Time and End Date/Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start Date and Time */}
                <div className="space-y-4">
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
                          <TimePicker
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            placeholder="Select start time"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* End Date and Time */}
                <div className="space-y-4">
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
                          <TimePicker
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            placeholder="Select end time"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
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
                    <Select 
                      value={field.value}
                      onValueChange={(value) => {
                        if (value) {
                          field.onChange(value)
                        }
                      }}
                      disabled={isLoadingVenues}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a venue">
                          {field.value && venuesData?.venues ? (
                            <span className="truncate block">
                              {venuesData.venues.find(v => v.id === field.value)?.name || 'Select a venue'}
                            </span>
                          ) : (
                            'Select a venue'
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="max-w-[500px]">
                        {isLoadingVenues ? (
                          <div className="py-2 px-3 text-sm text-gray-500">Loading venues...</div>
                        ) : venuesData?.venues && venuesData.venues.length > 0 ? (
                          venuesData.venues.map((venue) => (
                            <SelectItem key={venue.id} value={venue.id}>
                              <div className="flex flex-col max-w-full">
                                <span className="font-medium truncate">{venue.name}</span>
                                <span className="text-xs text-gray-500 truncate">{venue.location}</span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <div className="py-2 px-3 text-sm text-gray-500">No venues available</div>
                        )}
                      </SelectContent>
                    </Select>
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
              
              {/* Requirements & Compensation */}
              <SessionCompensationSection />
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