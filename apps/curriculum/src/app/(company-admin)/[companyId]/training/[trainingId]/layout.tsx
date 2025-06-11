"use client"

import { useParams, useRouter, usePathname } from "next/navigation"
import { ChevronLeft, UserRoundCog } from "lucide-react"
import { useTraining } from "@/lib/hooks/useTraining"
import { useUserRole } from "@/lib/hooks/useUserRole"

export default function TrainingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const { data: training } = useTraining(params.trainingId as string)
  const { isCompanyAdmin, isProjectManager } = useUserRole()
  const companyId = params.companyId as string
  const trainingId = params.trainingId as string

  const handleSettingsClick = () => {
    router.push(`/${companyId}/training/${trainingId}/users`)
  }

  const handleBack = () => {
    if (params.companyId) {
      router.push(`/${params.companyId}/training`)
    }
  }

  const isUsersPage = pathname.endsWith('/users')
 

  // Special routes that hide the default layout
  const isSpecialRoute = () => {
    let routePattern = pathname.replace(params.companyId as string, "[companyId]");
    
    if (params.trainingId) {
      routePattern = routePattern.replace(params.trainingId as string, "[trainingId]");
    }
    
    if (params.moduleId) {
      routePattern = routePattern.replace(params.moduleId as string, '[moduleId]');
    }

    if (params.formId) {
      routePattern = routePattern.replace(params.formId as string, '[formId]');
    }

    if (params.cohortId) {
      routePattern = routePattern.replace(params.cohortId as string, '[cohortId]');
    }
    
    const specialRoutes = [
      '/[companyId]/training/[trainingId]/evaluation/create',
      '/[companyId]/training/[trainingId]/evaluation/builder',
      '/[companyId]/training/[trainingId]/evaluation/[formId]',
      '/[companyId]/training/[trainingId]/evaluation/builder/[evaluationId]/question/[questionId]',
      '/[companyId]/training/[trainingId]/sessions/add',
      // '/[companyId]/training/[trainingId]/cohorts/[cohortId]'

    ];
    
    return specialRoutes.some(route => routePattern === route);
  };

  const hideDefaultLayout = isSpecialRoute();

  if (hideDefaultLayout) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen ">
      {/* Topbar */}
      <div className="bg-white md:px-8 px-4 py-6 flex items-center justify-between border-b-[0.5px] border-[#CED4DA]">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBack}
            className="text-brand hover:text-brand-dark font-semibold text-lg flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4 md:w-6 md:h-6" />
            <span className="text-xs md:text-lg">Back</span>
          </button>
          <h1 className="text-xs font-semibold md:text-base">
          {isUsersPage ? 'Users' : training?.title || 'Training'}

          </h1>
        </div>
        {(isCompanyAdmin || isProjectManager) && (
          <button 
            onClick={handleSettingsClick}
            className="p-3 hover:bg-brand-opacity rounded-full"
            title="Training Users"
            aria-label="Training Users"
          >
            <UserRoundCog className="w-7 h-7" />
          </button>
        )}
      </div>

      {children}
    </div>
  )
} 