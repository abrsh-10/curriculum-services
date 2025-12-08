"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { ChevronRight, ChevronDown, MoreVertical, Ban, Edit, Trash2 } from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Module } from "@/types/module"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { ModuleAddModal } from "./moduleAddModal"
import { LessonAddModal } from "./lessonAddModal"
import { useCreateModule, useModules, useUpdateModule, useDeleteModule } from "@/lib/hooks/useModule"
import { useGetLessons, useDeleteLesson, Lesson as APILesson, InstructionalMethod, TechnologyIntegration } from "@/lib/hooks/useLesson"
import { useQueryClient } from "@tanstack/react-query"

// Type for the form data
interface LessonFormData {
  id?: string
  name: string
  description: string
  objective: string
  duration: number
  durationType: "HOURS" | "DAYS" | "WEEKS" | "MONTHS"
  moduleId: string
  instructionalMethodIds: string[]
  technologyIntegrationIds: string[]
}

interface ModuleViewProps {
  modules: Module[]
  onAddClick: () => void
  onEditClick: (module: Module) => void
  canEdit?: boolean
  isLoading?: boolean
  error?: Error
}

export function ModuleView({ 
  modules, 
  onAddClick, 
  onEditClick,
  error,
  canEdit,
}: ModuleViewProps) {
  const router = useRouter()
  const params = useParams()
  const [showSubModuleModal, setShowSubModuleModal] = useState(false)
  const [showLessonModal, setShowLessonModal] = useState(false)
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [selectedLesson, setSelectedLesson] = useState<LessonFormData | null>(null)
  const [expandedModules, setExpandedModules] = useState<string[]>([])
  const [expandedSubModules, setExpandedSubModules] = useState<string[]>([])
  const { mutateAsync: createModule, isPending: isCreating } = useCreateModule()
  const { mutateAsync: updateModule, isPending: isUpdating } = useUpdateModule()
  const queryClient = useQueryClient()
  const [isEditingSubModule, setIsEditingSubModule] = useState(false)
  const [moduleToDelete, setModuleToDelete] = useState<Module | null>(null);
  const [lessonToDelete, setLessonToDelete] = useState<{ lesson: LessonFormData; moduleId: string } | null>(null);
  const { mutateAsync: deleteModule, isPending: isDeleting } = useDeleteModule();
  const { mutateAsync: deleteLesson, isPending: isDeletingLesson } = useDeleteLesson();
  
  // permission check
  const effectiveCanEdit = canEdit

  // Fetch module details when accordion is opened
  const { data: moduleDetails, isLoading: isModuleDetailsLoading } = useModules(
    expandedModules.length > 0 ? expandedModules[0] : params.moduleId as string
  )

  // Initialize with the current module ID if it exists
  useEffect(() => {
    if (params.moduleId) {
      setExpandedModules([params.moduleId as string]);
    }
  }, [params.moduleId]);

  // Fetch lessons for the expanded module
  const { data: mainModuleLessons, isLoading: isMainModuleLessonsLoading } = useGetLessons(
    expandedModules.length > 0 ? expandedModules[0] : ""
  )

  // Fetch lessons for expanded sub-modules - now using an object to store multiple sub-module lessons
  const expandedSubModuleId = expandedSubModules[0]
  const { data: subModuleLessons, isLoading: isSubModuleLessonsLoading } = useGetLessons(expandedSubModuleId || "")

  // Track previous state of modals
  const prevShowSubModuleModalRef = useRef(showSubModuleModal);
  const prevShowLessonModalRef = useRef(showLessonModal);
  
  // Effect to refresh data when modals close
  useEffect(() => {
    // Check if either modal was just closed
    const subModuleModalJustClosed = prevShowSubModuleModalRef.current && !showSubModuleModal;
    const lessonModalJustClosed = prevShowLessonModalRef.current && !showLessonModal;
    
    // Update refs for next render
    prevShowSubModuleModalRef.current = showSubModuleModal;
    prevShowLessonModalRef.current = showLessonModal;
    
    // If either modal just closed, refresh the data
    if (subModuleModalJustClosed || lessonModalJustClosed) {
      const activeModuleId = params.moduleId as string || '';
      
      if (activeModuleId) {
        // Refresh the module details
        queryClient.invalidateQueries({ queryKey: ["module-details", activeModuleId] });
      }
      
      // Also refresh any expanded modules/submodules
      if (expandedModules.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["module-details", expandedModules[0]] });
        queryClient.invalidateQueries({ queryKey: ["lessons", expandedModules[0]] });
      }
      
      if (expandedSubModules.length > 0) {
        queryClient.invalidateQueries({ queryKey: ["lessons", expandedSubModules[0]] });
      }
    }
  }, [showSubModuleModal, showLessonModal, params.moduleId, expandedModules, expandedSubModules, queryClient]);

  const handleAccordionChange = (value: string) => {
    
    // If value is empty (accordion closing) or different from current expanded module
    // then update the state and reset sub-module expansion
    setExpandedModules(value ? [value] : []);
    
    // Reset sub-module expansion when accordion changes
    if (!value || (expandedModules.length > 0 && expandedModules[0] !== value)) {
      setExpandedSubModules([]);
    }
  }

  const handleSubModuleExpand = useCallback((subModuleId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setExpandedSubModules(prev => 
      prev.includes(subModuleId) ? prev.filter(id => id !== subModuleId) : [subModuleId]
    )
  }, [])

  const handleAssessmentClick = useCallback((moduleId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    router.push(`/${params.companyId}/training/${params.trainingId}/${moduleId}?tab=assessment-method`)
  }, [router, params.companyId, params.trainingId])

  const handleSubModuleClick = useCallback((module: Module, e: React.MouseEvent, isEdit = false) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedModule(module)
    setIsEditingSubModule(isEdit)
    setShowSubModuleModal(true)
  }, [])

  const handleLessonClick = useCallback((module: Module, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedModule(module)
    setShowLessonModal(true)
  }, [])

  const handleEditLesson = useCallback((lesson: LessonFormData, module: Module, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedLesson(lesson)
    setSelectedModule(module)
    setShowLessonModal(true)
  }, [])

  const handleCreateSubModule = async (data: { 
    name: string; 
    description: string; 
    trainingTagId: string;
  }) => {
    if (!selectedModule) return

    try {
      if (isEditingSubModule) {
        // Update existing sub-module
        await updateModule({
          moduleId: selectedModule.id,
          data: {
            name: data.name,
            description: data.description,
            trainingTagId: data.trainingTagId,
          },
          trainingId: params.trainingId as string,
        })
      } else {
        // Create new sub-module
        await createModule({
          name: data.name,
          description: data.description,
          trainingTagId: data.trainingTagId,
          trainingId: params.trainingId as string,
          moduleId: selectedModule.id
        })
      }
      
      setShowSubModuleModal(false)
      setSelectedModule(null)
      setIsEditingSubModule(false)
    } catch (error) {
      console.error("Failed to manage sub-module:", error)
    }
  }

  const handleDeleteModule = async (module: Module) => {
    try {
      await deleteModule({
        moduleId: module.id,
        trainingId: params.trainingId as string,
      });
      setModuleToDelete(null);
    } catch (error) {
      console.error("Failed to delete module:", error);
    }
  };

  const handleDeleteLesson = async () => {
    if (!lessonToDelete) return;
    
    try {
      await deleteLesson({
        lessonId: lessonToDelete.lesson.id!,
        moduleId: lessonToDelete.moduleId,
      });
      setLessonToDelete(null);
    } catch (error) {
      console.error("Failed to delete lesson:", error);
    }
  };

  const renderHeader = useCallback((title: string, module: Module) => (
    <div className="bg-white data-[state=open]:bg-[#f7fbff] rounded-lg m-6 flex items-center justify-between hover:no-underline group">
      <div 
        className="flex items-center gap-3 flex-1 cursor-pointer" 
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          router.push(`/${params.companyId}/training/${params.trainingId}/${module.id}?tab=information`);
        }}
      >
        <span className="font-semibold text-md md:text-xl">
           {title}
        </span>
      </div>
      <div className="text-gray-400 flex items-center gap-2">
        {effectiveCanEdit && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <div 
                role="button"
                tabIndex={0}
                className="hover:bg-gray-100 h-8 w-8 p-0 rounded-md flex items-center justify-center cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreVertical className="h-4 w-4 " />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditClick(module)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-600"
                onClick={() => {
                  // Delay to allow dropdown to close before opening dialog
                  setTimeout(() => setModuleToDelete(module), 0)
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <AccordionTrigger 
          className="p-1 hover:bg-gray-100 rounded-md data-[state=open]:rotate-180 transition-transform"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <ChevronDown className="h-5 w-5 text-black" />
        </AccordionTrigger>
      </div>
    </div>
  ), [onEditClick, router, params.companyId, params.trainingId, effectiveCanEdit]);

  const renderLessons = useCallback((moduleId: string, isSubModule: boolean = false) => {
    const moduleLessons = isSubModule ? subModuleLessons : mainModuleLessons
    const isLoading = isSubModule ? isSubModuleLessonsLoading : isMainModuleLessonsLoading
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center p-4 bg-gray-50/50 rounded-md">
          <div className="animate-pulse flex space-x-2">
            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
            <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
          </div>
        </div>
      )
    }
    
    if (!moduleLessons || moduleLessons.length === 0) {
      return (
        <div className="flex items-center gap-2 p-4 bg-gray-50/50 rounded-md text-gray-500">
          <Ban className="h-4 w-4" />
          <span>No {isSubModule ? 'sub-module' : 'module'} lessons added yet</span>
        </div>
      )
    }

    return moduleLessons.map((lesson: APILesson) => {
      // Transform API lesson to form data format
      const transformedLesson: LessonFormData = {
        id: lesson.id,
        name: lesson.name,
        description: lesson.description,
        objective: lesson.objective,
        duration: lesson.duration,
        durationType: lesson.durationType,
        moduleId: lesson.moduleId,
        instructionalMethodIds: lesson.instructionalMethods.map((method: InstructionalMethod) => method.id),
        technologyIntegrationIds: lesson.technologyIntegrations.map((tech: TechnologyIntegration) => tech.id)
      }

      return (
        <div
          key={lesson.id}
          className="flex items-center justify-between p-4 bg-gray-50 rounded-md hover:bg-gray-100"
        >
          <div 
            className="flex flex-col flex-1 cursor-pointer"
            onClick={(e) => handleEditLesson(transformedLesson, { id: moduleId } as Module, e)}
          >
            <span className="font-medium">{lesson.name}</span>
            <span className="text-sm text-gray-500">{lesson.objective}</span>
          </div>
          {effectiveCanEdit && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditLesson(transformedLesson, { id: moduleId } as Module, e);
                }}
                className="h-8 w-8 p-0 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setLessonToDelete({ lesson: transformedLesson, moduleId });
                }}
                className="h-8 w-8 p-0 text-gray-600 hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )
    })
  }, [mainModuleLessons, subModuleLessons, isMainModuleLessonsLoading, isSubModuleLessonsLoading, effectiveCanEdit, handleEditLesson])

  const renderSubModules = useCallback((module: Module) => {
    if (isModuleDetailsLoading) {
      return (
        <div className="ml-8 pl-4 mb-4">
          <div className="flex items-center gap-2 p-4 bg-gray-50/50 rounded-md text-gray-500">
            <span>Loading sub-modules...</span>
          </div>
        </div>
      );
    }
    
    // If no module details, don't render
    if (!moduleDetails) {
      return null;
    }
    
    // No need to check module ID here since we're using the current moduleId
    
    // If no child modules, show a message
    if (!moduleDetails.module.childModules || moduleDetails.module.childModules.length === 0) {
      return (
        <div className="ml-8 pl-4 mb-4">
          <div className="flex items-center gap-2 p-4 bg-gray-50/50 rounded-md text-gray-500">
            <Ban className="h-4 w-4" />
            <span>No sub-modules added yet</span>
          </div>
        </div>
      );
    }
    
    return moduleDetails.module.childModules.map((subModule) => {
      const isExpanded = expandedSubModules.includes(subModule.id)

      return (
        <div key={subModule.id} className="ml-8 border-l-2 border-gray-200 pl-4 mb-4">
          <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100">
            <div className="flex items-center gap-2 flex-1" 
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                router.push(`/${params.companyId}/training/${params.trainingId}/${subModule.id}?tab=information`)
              }}>
              <span className="font-medium">
              {subModule.name}
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Only show Add Lesson button if user has edit permission */}
              {effectiveCanEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLessonClick(subModule, e)
                  }}
                  className="text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                >
                  Add Lesson
                </Button>
              )}
              {effectiveCanEdit && (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <div 
                      role="button"
                      tabIndex={0}
                      className="hover:bg-gray-100 h-8 w-8 p-0 rounded-md flex items-center justify-center cursor-pointer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="h-4 w-4" />
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={(e) => {
                      e.stopPropagation()
                      handleSubModuleClick(subModule, e, true)
                    }}>
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => {
                        // Delay to allow dropdown to close before opening dialog
                        setTimeout(() => setModuleToDelete(subModule), 0)
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <div
                role="button"
                className="p-1 hover:bg-gray-100 rounded-md transition-transform"
                onClick={(e) => handleSubModuleExpand(subModule.id, e)}
              >
                <ChevronRight className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </div>
            </div>
          </div>
          {isExpanded && (
            <div className="mt-2 space-y-2 pl-4">
              <h3 className="font-medium text-gray-700 mb-2">Lessons for Sub-Module</h3>
              {renderLessons(subModule.id, true)}
            </div>
          )}
        </div>
      )
    })
  }, [moduleDetails, expandedSubModules, handleSubModuleClick, handleLessonClick, handleSubModuleExpand, renderLessons, effectiveCanEdit, router, params, isModuleDetailsLoading])

  if (error) {
    return <div className="text-red-500">Error loading modules: {error.message}</div>
  }

  return (
    <div className="px-[7%] py-10 mb-10">
      <h1 className="text-md md:text-xl text-black mb-4 font-semibold">
        Modules
      </h1>
      <h2 className="text-md md:text-lg text-gray-500 font-normal mb-4">
        A concise summary of the course modules, outlining their content and
        structure
      </h2>

      <div className="space-y-4">
        <Accordion
          type="single"
          collapsible={true}
          defaultValue=""
          className="space-y-4"
          onValueChange={handleAccordionChange}
          value={expandedModules[0] || ""}
        >
          {modules.map((module) => (
            <AccordionItem
              key={module.id}
              value={module.id}
              className="border-[0.5px] border-[#CED4DA] rounded-md"
              data-module-id={module.id}
            >
              {renderHeader(module.name, module)}
              <AccordionContent>
                <div className="p-6 space-y-4">
                  {expandedModules.includes(module.id) && effectiveCanEdit && (
                    <div className="p-4 bg-gray-50">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <div
                          onClick={(e) => handleAssessmentClick(module.id, e)}
                          className="inline-flex font-semibold items-center gap-2 text-brand hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md cursor-pointer"
                        >
                          <Image
                            src="/modulePlus.svg"
                            alt="Add Assessment"
                            width={16}
                            height={20}
                          />
                          <span>Assessment Methods</span>
                        </div>

                        <div
                          onClick={(e) => handleLessonClick(module, e)}
                          className="inline-flex font-semibold items-center gap-2 text-brand hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md cursor-pointer"
                        >
                          <Image
                            src="/modulePlus.svg"
                            alt="Add Lesson"
                            width={16}
                            height={20}
                          />
                          <span>Add Lesson</span>
                        </div>

                        <div
                          onClick={(e) => handleSubModuleClick(module, e)}
                          className="inline-flex font-semibold items-center gap-2 text-brand hover:text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-md cursor-pointer"
                        >
                          <Image
                            src="/modulePlus.svg"
                            alt="Add Sub Module"
                            width={16}
                            height={20}
                          />
                          <span>Sub Module</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Display main module lessons */}
                  {expandedModules.includes(module.id) && (
                    <div className="mt-4 mb-6 mx-6 space-y-2">
                      <h3 className="font-medium text-gray-700 mb-2">Lessons for Module</h3>
                      <div className="space-y-2">
                        {isMainModuleLessonsLoading ? (
                          <div className="flex items-center justify-center p-4 bg-gray-50/50 rounded-md">
                            <div className="animate-pulse flex space-x-2">
                              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                              <div className="h-2 w-2 bg-gray-400 rounded-full"></div>
                            </div>
                          </div>
                        ) : mainModuleLessons && mainModuleLessons.length > 0 ? (
                          renderLessons(module.id, false)
                        ) : (
                          <div className="flex items-center gap-2 p-4 bg-gray-50/50 rounded-md text-gray-500">
                            <Ban className="h-4 w-4" />
                            <span>No module lessons added yet</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Sub-modules section */}
                  {renderSubModules(module)}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {effectiveCanEdit && (
        <Button
          variant="ghost"
          className="w-full border-2 border-dashed rounded-lg py-8 text-blue-500 hover:text-blue-600 bg-[#fbfbfb] hover:bg-blue-50/50 mt-4 justify-start pl-6"
          onClick={onAddClick}
        >
          <Image
            src="/modulePlus.svg"
            alt="Add Module"
            width={16}
            height={20}
          />
          <span className="font-semibold">Module</span>
        </Button>
      )}

      <ModuleAddModal 
        isOpen={showSubModuleModal}
        onClose={() => {
          setShowSubModuleModal(false)
          setSelectedModule(null)
          setIsEditingSubModule(false)
        }}
        onSubmit={handleCreateSubModule}
        isLoading={isCreating || isUpdating}
        mode="submodule"
        editData={isEditingSubModule ? {
          id: selectedModule?.id || "",
          name: selectedModule?.name || "",
          description: selectedModule?.description || "",
          trainingTag: selectedModule?.trainingTag || null
        } : null}
      />

      {selectedModule && (
        <LessonAddModal
          isOpen={showLessonModal}
          onClose={() => {
            setShowLessonModal(false)
            setSelectedModule(null)
            setSelectedLesson(null)
          }}
          moduleId={selectedModule?.id || ""}
          initialData={selectedLesson as LessonFormData}
          isEdit={!!selectedLesson}
          readOnly={!canEdit}
        />
      )}

      <AlertDialog open={!!moduleToDelete} onOpenChange={() => setModuleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this module?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the module
              and all its associated data including lessons and assessments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => moduleToDelete && handleDeleteModule(moduleToDelete)}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!lessonToDelete} onOpenChange={() => setLessonToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this lesson?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the lesson &ldquo;{lessonToDelete?.lesson.name}&rdquo; and all its associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={handleDeleteLesson}
              disabled={isDeletingLesson}
            >
              {isDeletingLesson ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}