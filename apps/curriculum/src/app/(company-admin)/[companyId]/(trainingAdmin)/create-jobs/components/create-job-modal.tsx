"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
// import { format } from "date-fns" // No longer needed for submission

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAddJob } from "@/lib/hooks/useJobs"
import { useTrainings } from "@/lib/hooks/useTrainings"
import { useCohorts } from "@/lib/hooks/useCohorts"
import { useCohortSessions } from "@/lib/hooks/useSession"
import { Loader2, Calendar, Clock, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"

// Update Zod Schema for date and time
const createJobSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  trainingId: z.string({ required_error: "Training must be selected" }), 
  cohortId: z.string({ required_error: "Cohort must be selected" }),
  // Separate date and time fields
  deadlineDate: z.string({ required_error: "Application deadline date is required" })
                 .refine(val => val && !isNaN(Date.parse(val)), {
                   message: "Valid date is required",
                 }),
  deadlineTime: z.string({ required_error: "Application deadline time is required" }),
  sessionIds: z.array(z.string()).min(1, "At least one session must be selected"),
})

type CreateJobFormValues = z.infer<typeof createJobSchema>

interface CreateJobModalProps {
  isOpen: boolean
  onClose: () => void
}

// Session interface for type safety
interface Session {
  id: string;
  name: string;
}

// Generate time options in 30-minute intervals with AM/PM format
const generateTimeOptions = () => {
  const options = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 === 0 ? 12 : hour % 12;
      const displayMinute = minute === 0 ? '00' : minute;
      const label = `${displayHour}:${displayMinute} ${period}`;
      
      // Value stored as 24-hour format for API
      const hourStr = hour.toString().padStart(2, '0');
      const minuteStr = minute.toString().padStart(2, '0');
      const value = `${hourStr}:${minuteStr}`;
      
      options.push({ label, value });
    }
  }
  return options;
};

const TIME_OPTIONS = generateTimeOptions();

export function CreateJobModal({ isOpen, onClose }: CreateJobModalProps) {
  const { addJob, isLoading: isSubmitting, isSuccess: isSubmitSuccess } = useAddJob()

  const [selectedTrainingId, setSelectedTrainingId] = useState<string | undefined>(undefined)
  const [selectedCohortId, setSelectedCohortId] = useState<string | undefined>(undefined)

  // Fetch Trainings
  const { data: trainingsData, isLoading: trainingsLoading, error: trainingsError } = useTrainings({
    isArchived: false // Fetch only active trainings
  });

  // Fetch Cohorts based on selected Training
  const { data: cohortsData, isLoading: cohortsLoading, error: cohortsError } = useCohorts({
    trainingId: selectedTrainingId || "", // Pass selected training ID
  });

  // Fetch Sessions based on selected Cohort
  const { data: sessionsData, isLoading: sessionsLoading, error: sessionsError } = useCohortSessions({
    cohortId: selectedCohortId || "", // Pass selected cohort ID
  });

  // Safe access to cohorts and sessions data
  const safeCohorts = cohortsData?.cohorts?.length ? cohortsData.cohorts : [];
  const safeSessions = sessionsData?.sessions?.length ? sessionsData.sessions : [];

  const form = useForm<CreateJobFormValues>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      title: "",
      description: "",
      trainingId: "",
      cohortId: "",
      deadlineDate: "", 
      deadlineTime: "09:00", // Default time to 9:00 AM
      sessionIds: [],
    },
  })

  // Get current value of sessionIds from form
  const sessionIds = form.watch("sessionIds");

  // Map Trainings to Select options
  const trainingOptions = trainingsData?.trainings?.map(t => ({ value: t.id, label: t.title })) || [];

  // Map Cohorts to Select options
  const cohortOptions = safeCohorts.map(c => ({ value: c.id, label: c.name }));

  // Handle session selection toggle
  const handleSelectSession = (sessionId: string) => {
    const currentSessionIds = form.getValues("sessionIds");
    let newSessionIds: string[];
    
    if (currentSessionIds.includes(sessionId)) {
      // Remove the session if already selected
      newSessionIds = currentSessionIds.filter(id => id !== sessionId);
    } else {
      // Add the session if not selected
      newSessionIds = [...currentSessionIds, sessionId];
    }
    
    form.setValue('sessionIds', newSessionIds, { shouldValidate: true });
  };

  // Remove session from selection
  const handleRemoveSession = (sessionId: string) => {
    const currentSessionIds = form.getValues("sessionIds");
    const newSessionIds = currentSessionIds.filter(id => id !== sessionId);
    form.setValue('sessionIds', newSessionIds, { shouldValidate: true });
  };

  const onSubmit = (data: CreateJobFormValues) => {
    // Combine date and time for the API
    const combinedDeadline = `${data.deadlineDate}T${data.deadlineTime}:00`;
    
    // Ensure the payload structure matches what useAddJob expects
    const payload = {
      title: data.title,
      description: data.description,
      deadlineDate: combinedDeadline, // Combined date and time
      sessionIds: data.sessionIds,
    };
    
    addJob(payload);
  }

  // Reset form and close modal on successful submission
  useEffect(() => {
    if (isSubmitSuccess) {
      form.reset();
      setSelectedTrainingId(undefined); 
      setSelectedCohortId(undefined);
      onClose(); 
    }
  }, [isSubmitSuccess, onClose]);

  // Reset cohort and session selection when training changes
  useEffect(() => {
    if (selectedTrainingId) {
      setSelectedCohortId(undefined);
      form.setValue("cohortId", "", { shouldValidate: true });
      form.setValue("sessionIds", [], { shouldValidate: true });
    }
  }, [selectedTrainingId]);

  // Reset session selection when cohort changes
  useEffect(() => {
    if (selectedCohortId) {
      form.setValue("sessionIds", [], { shouldValidate: true });
    }
  }, [selectedCohortId]);

  // Prevent closing modal by clicking outside or pressing Esc
  const handleInteractOutside = (event: Event) => {
    event.preventDefault();
  };

  const handleTrainingChange = (trainingId: string) => {
    setSelectedTrainingId(trainingId);
    form.setValue("trainingId", trainingId, { shouldValidate: true });
  }

  const handleCohortChange = (cohortId: string) => {
    setSelectedCohortId(cohortId);
    form.setValue("cohortId", cohortId, { shouldValidate: true });
  }
  
  // Helper to get current date string in YYYY-MM-DD format
  const getMinDate = () => {
    const now = new Date();
    return now.toISOString().split('T')[0];
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto"
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={handleInteractOutside}
      >
        <DialogHeader>
          <DialogTitle>New Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Job Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              placeholder="e.g., Lead Frontend Trainer"
              {...form.register("title")}
              disabled={isSubmitting}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the role, responsibilities, and required skills..."
              {...form.register("description")}
              rows={4}
              disabled={isSubmitting}
            />
            {form.formState.errors.description && (
              <p className="text-sm text-red-600">{form.formState.errors.description.message}</p>
            )}
          </div>

          {/* Select Training */}
          <div className="space-y-2">
            <Label htmlFor="trainingId">Select Training</Label>
            <Select 
              onValueChange={handleTrainingChange}
              value={selectedTrainingId}
              disabled={trainingsLoading || isSubmitting}
            >
              <SelectTrigger id="trainingId">
                <SelectValue placeholder={trainingsLoading ? "Loading trainings..." : "Select a training"} />
              </SelectTrigger>
              <SelectContent>
                {trainingsError ? (
                  <SelectItem value="error" disabled>Error loading trainings</SelectItem>
                ) : trainingOptions.length === 0 && !trainingsLoading ? (
                   <SelectItem value="no-trainings" disabled>No active trainings found</SelectItem>
                ) : (
                  trainingOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.trainingId && (
              <p className="text-sm text-red-600">{form.formState.errors.trainingId.message}</p>
            )}
          </div>

          {/* Select Cohort */}
          <div className="space-y-2">
            <Label htmlFor="cohortId">Select Cohort</Label>
            <Select 
              onValueChange={handleCohortChange}
              value={selectedCohortId}
              disabled={!selectedTrainingId || cohortsLoading || isSubmitting}
            >
              <SelectTrigger id="cohortId">
                <SelectValue placeholder={
                  !selectedTrainingId 
                    ? "Select a training first" 
                    : cohortsLoading 
                      ? "Loading cohorts..." 
                      : "Select a cohort"
                } />
              </SelectTrigger>
              <SelectContent>
                {cohortsError ? (
                  <SelectItem value="error" disabled>Error loading cohorts</SelectItem>
                ) : cohortOptions.length === 0 && !cohortsLoading && selectedTrainingId ? (
                   <SelectItem value="no-cohorts" disabled>No cohorts found for this training</SelectItem>
                ) : (
                  cohortOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {form.formState.errors.cohortId && (
              <p className="text-sm text-red-600">{form.formState.errors.cohortId.message}</p>
            )}
          </div>

          {/* Select Sessions */}
          <div className="space-y-2">
            <Label htmlFor="sessions">Select Sessions</Label>
            
            {/* Selected Sessions Display */}
            {sessionIds && sessionIds.length > 0 && (
              <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-gray-50 min-h-[2.5rem]">
                {sessionIds.map((id) => {
                  const session = safeSessions.find((s: Session) => s.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="flex items-center gap-1">
                      {session?.name || 'Unknown Session'}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveSession(id)}
                      />
                    </Badge>
                  );
                })}
              </div>
            )}

            <Select 
              onValueChange={handleSelectSession}
              value="" // Always empty to allow multiple selections
              disabled={!selectedCohortId || sessionsLoading || isSubmitting}
            >
              <SelectTrigger id="sessions">
                <SelectValue placeholder={
                  !selectedCohortId 
                    ? "Select a cohort first" 
                    : sessionsLoading 
                      ? "Loading sessions..." 
                      : sessionIds.length > 0
                        ? `${sessionIds.length} session${sessionIds.length === 1 ? '' : 's'} selected`
                        : "Select sessions..."
                } />
              </SelectTrigger>
              <SelectContent>
                {sessionsError ? (
                  <SelectItem value="error" disabled>Error loading sessions</SelectItem>
                ) : safeSessions.length === 0 && !sessionsLoading && selectedCohortId ? (
                   <SelectItem value="no-sessions" disabled>No sessions found for this cohort</SelectItem>
                ) : (
                  safeSessions.map((session: Session) => (
                    <SelectItem 
                      key={session.id} 
                      value={session.id}
                      className={cn(
                        "flex items-center",
                        sessionIds.includes(session.id) && "bg-blue-50"
                      )}
                    >
                      <div className="flex items-center w-full">
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            sessionIds.includes(session.id) ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {session.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            {form.formState.errors.sessionIds && (
              <p className="text-sm text-red-600">{form.formState.errors.sessionIds.message}</p>
            )}
          </div>

          {/* Application Deadline - Date and Time side by side */}
          <div className="space-y-2">
            <Label htmlFor="deadlineDate">Application Deadline</Label>
            <div className="flex items-center gap-2">
              {/* Date Picker */}
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Calendar className="h-4 w-4 text-gray-500" />
                </div>
                <Input
                  id="deadlineDate"
                  type="date"
                  {...form.register("deadlineDate")}
                  className="pl-10"
                  disabled={isSubmitting}
                  min={getMinDate()}
                />
              </div>
              
              {/* "at" text */}
              <span className="text-gray-500">at</span>
              
              {/* Time Picker - Replace Input with Select */}
              <div className="relative w-[191px]">
                <Select
                  onValueChange={(value) => form.setValue("deadlineTime", value, { shouldValidate: true })}
                  value={form.watch("deadlineTime")}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="deadlineTime" className="w-full">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 text-gray-500 mr-2" />
                      <SelectValue placeholder="Select time" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Error messages */}
            {(form.formState.errors.deadlineDate || form.formState.errors.deadlineTime) && (
              <p className="text-sm text-red-600">
                {form.formState.errors.deadlineDate?.message || form.formState.errors.deadlineTime?.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => { form.reset(); setSelectedTrainingId(undefined); setSelectedCohortId(undefined); onClose(); }} disabled={isSubmitting}>
                Back
              </Button>
            </DialogClose>
            <Button type="submit" className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isSubmitting ? "Creating..." : "Create Job"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 