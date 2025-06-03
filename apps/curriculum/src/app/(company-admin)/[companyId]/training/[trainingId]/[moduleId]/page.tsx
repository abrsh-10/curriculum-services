"use client"

import { useState, useEffect, lazy, Suspense } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { ModuleTabs } from "./components/module-tabs"
import Link from "next/link"
import { useTraining } from "@/lib/hooks/useTraining"
import { useModules } from "@/lib/hooks/useModule"
import { Loading } from "@/components/ui/loading"
import { toast } from "sonner"

// Dynamically import components
const ModuleInformation = lazy(() => import("./components/module-information").then(module => ({ default: module.ModuleInformation })))
const AssessmentMethod = lazy(() => import("./components/assesment-method").then(module => ({ default: module.AssessmentMethod })))

// Define module tab type locally
type ModuleTabType = 'information' | 'content' | 'assessment-method'

// Valid tabs constant for type safety
const VALID_TABS: Array<ModuleTabType> = ['information', 'content', 'assessment-method'];

export default function ModuleDetail() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const trainingId = params.trainingId as string
  const moduleId = params.moduleId as string
  const companyId = params.companyId as string
  
  // Get tab from URL query or default to 'information'
  const initialTab: ModuleTabType = VALID_TABS.includes(tabParam as ModuleTabType) ? (tabParam as ModuleTabType) : 'information'
  const [activeTab, setActiveTab] = useState<ModuleTabType>(initialTab)

  // Update the URL when tab changes
  const handleTabChange = (tab: ModuleTabType) => {
    setActiveTab(tab)
    
    // Create new URLSearchParams object from current params
    const newParams = new URLSearchParams(searchParams)
    
    // Set the tab parameter
    newParams.set('tab', tab)
    
    // Update the URL without reloading the page
    router.replace(`/${companyId}/training/${trainingId}/${moduleId}?${newParams.toString()}`, { scroll: false })
  }

  // Fetch training and module data for breadcrumb
  const { data: training, isLoading: trainingLoading, error: trainingError } = useTraining(trainingId)
  const { data: moduleDetails, isLoading: moduleLoading, error: moduleError } = useModules(moduleId)

  useEffect(() => {
    if (trainingError) {
      toast.error("Failed to load training", {
        description: "Please try again later"
      })
    }
    if (moduleError) {
      toast.error("Failed to load module", {
        description: "Please try again later"
      })
    }
  }, [trainingError, moduleError])

  if (trainingLoading || moduleLoading) {
    return <Loading />
  }

  const currentModule = moduleDetails?.module
  const parentModule = currentModule?.parentModule

  return (
    <div className="">
      {/* Breadcrumb */}
      <div className="px-[7%] pt-7 text-sm flex items-center flex-wrap">
        <Link 
          href={`/${companyId}/training/${trainingId}`} 
          className="text-gray-600 hover:text-brand transition-colors font-medium"
        >
          {training?.title || 'Training'}
        </Link>
        
        <span className="mx-2 text-gray-400 font-bold text-lg leading-none">•</span>
        
        {parentModule && (
          <>
            <Link 
              href={`/${companyId}/training/${trainingId}/${parentModule.id}`}
              className="text-gray-600 hover:text-brand transition-colors font-medium"
            >
              {parentModule.name}
            </Link>
            <span className="mx-2 text-gray-400 font-bold text-lg leading-none">•</span>
          </>
        )}
        
        <span className="font-semibold text-gray-800">
          {currentModule?.name || 'Module'}
        </span>
      </div>

      {/* Module Content */}
      <ModuleTabs activeTab={activeTab} onTabChange={handleTabChange} />

      <div>
        <Suspense fallback={<Loading />}>
          {activeTab === 'information' && <ModuleInformation moduleId={moduleId} />}
          
          {activeTab === 'assessment-method' && <AssessmentMethod moduleId={moduleId} />}
        </Suspense>
      </div>
    </div>
  )
}
