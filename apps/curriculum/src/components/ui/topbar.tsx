'use client'

import { useParams, usePathname, useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from "./button"
import { decodeJWT } from "@/lib/utils"
import { useVerificationStatus } from "@/lib/hooks/useVerificationStatus"
import { toast } from "sonner"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useUserProfile } from "@/lib/hooks/useUserProfile"
import { clearAuthData } from "@/lib/utils/auth"
import { useEffect, useState } from 'react'
import { EditProfileModal } from "@/components/modals/edit-profile-modal"
import { useProfilePicture } from "@/lib/hooks/useProfilePicture"
import { useUserRole } from "@/lib/hooks/useUserRole"
import { getCookie } from "@curriculum-services/auth"
import { useSyncTraining } from "@/lib/hooks/useSyncTraining"

export default function Topbar() {
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  
  const [mounted, setMounted] = useState(false)
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const { isIcogAdmin, isCompanyAdmin, role, isProjectManager } = useUserRole()
    
  const decoded = typeof window !== 'undefined' ? decodeJWT(getCookie('token') || null) : null

  const isCompanyAdminRole = mounted && isCompanyAdmin

  // Hooks before any conditional returns
  const { data: user } = useUserProfile({
    enabled: isCompanyAdminRole
  })
  const { data: verificationData } = useVerificationStatus({
    enabled: isCompanyAdminRole
  })

  const profilePicture = useProfilePicture()
  const { syncTraining, isLoading: isSyncing } = useSyncTraining()

  // Check if current route needs a back button (any route deeper than training)
  const showBackButton = pathname.includes('/training/') && params.companyId
  
  // Get trainingId from URL params if we're on a training page
  const trainingId = params.trainingId as string | undefined
  const isOnTrainingPage = !!trainingId && pathname.includes('/training/')

  const handleBackClick = () => {
    if (params.companyId) {
      router.push(`/${params.companyId}/training`)
      return
    }
    router.back()
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  // Convert pathname to title
  const getPageTitle = (path: string) => {
    if (isIcogAdmin) {
      // For ICOG admin, use first segment after /
      const segment = path.split('/')[1] || ''
      return segment.charAt(0).toUpperCase() + segment.slice(1)
    } else {
      // For other roles, use last segment
      const segment = path.split('/').pop() || ''
      return segment.charAt(0).toUpperCase() + segment.slice(1)
    }
  }

  const handleCreateTraining = () => {
    if (isCompanyAdminRole) {
      if (verificationData?.verificationStatus !== 'ACCEPTED') {
        toast.error("Account not verified", {
          description: "Your account is pending verification"
        })
        return
      }
      
      router.push(`/${params.companyId}/training/create-training`)
    }
  }

  const handleLogout = () => {
    clearAuthData()
  }

  // Add this helper function to transform role names
  const getDisplayRole = (role: string) => {
    // First try to get from user object
    if (role === 'ROLE_COMPANY_ADMIN') return 'Company Admin';
    if (role === 'ROLE_SUB_CURRICULUM_ADMIN') return 'Sub Curriculum Admin';
    if (role === 'ROLE_CURRICULUM_ADMIN') return 'Curriculum Admin';
    if (role === 'ROLE_CONTENT_DEVELOPER') return 'Content Developer';
    if (role === 'ROLE_ICOG_ADMIN') return 'iCog Admin';

    // Fallback to formatting the role string
    return role.toLowerCase()
      .replace('role_', '')
      .replace('_', ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="border-b-[0.3px] border-[#CED4DA]">
      <div className="lg:px-16 md:px-14 px-4 flex items-center justify-between py-6  bg-white">
        <div className="flex items-center justify-between w-full">
          {/* Page Title */}
          <h1 className=" md:text-lg text-sm pl-12 font-medium">
            {showBackButton ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleBackClick}
                  className="flex items-center justify-center p-1 rounded-full hover:bg-gray-100"
                  aria-label="Back to trainings"
                >
                  <Image
                    src="/arrow-left.svg"
                    alt="Back"
                    width={20}
                    height={20}
                    className="w-5 h-5"
                    onError={(e) => {
                      // Fallback if image doesn't exist
                      e.currentTarget.src =
                        'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"></path><path d="M19 12H5"></path></svg>';
                    }}
                  />
                </button>
                {getPageTitle(pathname)}
              </div>
            ) : (
              getPageTitle(pathname)
            )}
          </h1>

          <div className="flex items-center md:gap-6 gap-3">
            {/* Create Training Button */}
            {isCompanyAdmin && (
              <Button
                onClick={handleCreateTraining}
                className="bg-[#0B75FF] hover:bg-[#0052CC] text-white lg:px-6 lg:py-5 px-3 py-1 rounded-3xl md:text-sm text-xs"
              >
                Create Training
              </Button>
            )}

            {(isCompanyAdmin || isProjectManager) && isOnTrainingPage && (
              <Button
                onClick={() => trainingId && syncTraining(trainingId)}
                className="bg-[#0A2342] hover:bg-[#14417b] text-white lg:px-6 lg:py-5 px-3 py-1 rounded-3xl md:text-sm text-xs"
                disabled={isSyncing || !trainingId}
              >
                {isSyncing ? 'Syncing...' : 'Sync Training'}
              </Button>
            )}

            {/* Right Side Icons */}
            <div className="flex items-center gap-2">
              {/* Notification Bell */}
              <button
                className="p-3 rounded-full bg-[#cee3ff] transition-colors"
                aria-label="Notifications"
                title="Notifications"
              >
                <div className="relative">
                  <Image
                    src="/bell.svg"
                    alt="Notifications"
                    width={12}
                    height={12}
                    className="lg:w-[14px] lg:h-[14px] w-[10px] h-[10px]"
                  />
                </div>
              </button>

              {/* Profile Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="p-3 rounded-full overflow-hidden border border-gray-200 hover:border-gray-300 transition-colors"
                    aria-label="Open profile menu"
                    title="Profile menu"
                  >
                    <Image
                      src={profilePicture}
                      alt="Profile"
                      width={12}
                      height={12}
                      className="lg:w-[14px] lg:h-[14px] w-[10px] h-[10px] object-cover"
                    />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[300px] p-0 my-5 mx-10"
                  align="start"
                >
                  <div className="space-y-3">
                    {/* Profile Header */}
                    <div className="px-6">
                      <div className="flex items-center gap-4 py-3">
                        <div className="w-14 h-14  shrink-0 rounded-full overflow-hidden border border-gray-200 flex items-center justify-center">
                          <Image
                            src={profilePicture}
                            alt="Profile"
                            width={24}
                            height={24}
                            className=" object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-lg text-gray-900 break-words">
                            {isIcogAdmin
                              ? "iCog Admin"
                              : isCompanyAdmin
                              ? `${decoded?.firstName} ${decoded?.lastName}`
                              : decoded?.email}
                          </h3>
                          <p className="text-gray-500 font-medium text-sm break-words">
                            {isIcogAdmin
                              ? "iCog Admin"
                              : getDisplayRole(role || "")}
                          </p>
                        </div>
                      </div>
                    </div>

                    <hr className="border-gray-100" />

                    {/* Menu Items */}
                    <div className="space-y-1 py-2">
                      <button
                        className="w-full font-medium text-sm text-left px-6 py-2.5 text-gray-700 hover:bg-gray-50 transition-colors"
                        onClick={() => setIsEditProfileOpen(true)}
                      >
                        Edit Profile
                      </button>

                      <hr className="border-gray-100" />
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-6 py-2.5 hover:bg-gray-50 transition-colors text-gray-700 font-medium text-sm"
                      >
                        Log Out
                      </button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
      />
    </div>
  );
}
