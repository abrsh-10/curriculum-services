"use client"

import { useState, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useTrainingUsersByTrainingId } from "@/lib/hooks/useFetchTrainingUsers"
import { useUserRole } from "@/lib/hooks/useUserRole"
import { TrainingUser } from "@/types/users"
import { Button } from "@/components/ui/button"

type AssessmentType = "PRE_POST" | "CAT"
type DurationType = "Minutes" | "Hours" | "Days"

interface AssessmentSettingsProps {
  assessmentName: string
  setAssessmentName: (name: string) => void
  assessmentType: AssessmentType
  setAssessmentType: (type: AssessmentType) => void
  numberOfAttempts: number
  setNumberOfAttempts: (attempts: number) => void
  timed: boolean
  setTimed: (timed: boolean) => void
  duration: number
  setDuration: (duration: number) => void
  durationType: DurationType
  setDurationType: (type: DurationType) => void
  contentDeveloperEmail: string
  setContentDeveloperEmail: (email: string) => void
  trainingId: string
  isEditMode?: boolean
  onSubmit?: () => void
  onCancel?: () => void
  submitLabel?: string
  isSubmitting?: boolean
}

export function AssessmentSettings({
  assessmentName,
  setAssessmentName,
  assessmentType,
  setAssessmentType,
  numberOfAttempts,
  setNumberOfAttempts,
  timed,
  setTimed,
  duration,
  setDuration,
  durationType,
  setDurationType,
  contentDeveloperEmail,
  setContentDeveloperEmail,
  trainingId,
  isEditMode = false,
  onSubmit,
  onCancel,
  submitLabel,
  isSubmitting
}: AssessmentSettingsProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [showUserList, setShowUserList] = useState(false)
  const [selectedUser, setSelectedUser] = useState<TrainingUser | null>(null)

  // Role-based gating
  const { isCompanyAdmin, isProjectManager, isCurriculumAdmin, isContentDeveloper, isLoading: isRoleLoading } = useUserRole()

  // Only PM and Company Admin can fetch users; never fetch on edit mode
  const canFetchUsers = (isCompanyAdmin || isProjectManager) && !isEditMode && !isRoleLoading

  // Fetch training users and filter for content developers when allowed
  const { data: usersData } = useTrainingUsersByTrainingId(trainingId, { enabled: !!trainingId && canFetchUsers })

  const contentDevelopers = useMemo(() => {
    if (!usersData?.users) return []
    return usersData.users.filter(user => 
      user.role.name.toLowerCase() === "content_developer" || 
      user.role.name.toLowerCase() === "content developer"
    )
  }, [usersData?.users])

  const filteredUsers = useMemo(() => {
    if (!contentDevelopers.length || !searchQuery.trim()) return []
    return contentDevelopers.filter(user => 
      user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [contentDevelopers, searchQuery])

  const handleUserSearch = (value: string) => {
    setSearchQuery(value)
    setShowUserList(value.trim().length > 0)
    setSelectedUser(null)
  }

  const handleUserSelect = (user: TrainingUser) => {
    setSelectedUser(user)
    setContentDeveloperEmail(user.email)
    setShowUserList(false)
    setSearchQuery("")
  }

  const handleClearUser = () => {
    setSelectedUser(null)
    setContentDeveloperEmail("")
    setSearchQuery("")
  }

  const isAttemptsValid = numberOfAttempts > 0
  return (
    <div className="space-y-6">
      {/* Assessment Name */}
      <div>
        <Label htmlFor="assessmentName" className="text-sm font-medium text-gray-700">
          Assessment Name
        </Label>
        <Input
          id="assessmentName"
          value={assessmentName}
          onChange={(e) => setAssessmentName(e.target.value)}
          placeholder="Enter assessment name"
          className="mt-2"
          disabled={isEditMode}
        />
      </div>

      {/* Type of Assessment */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Type of Assessment
        </Label>
        <div className="grid grid-cols-2 gap-4">
          {/* Pre and Post Training Assessment */}
                  <div
                    className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all",
                      assessmentType === "PRE_POST"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => !isEditMode && setAssessmentType("PRE_POST")}
                  >
                    <h3 className="font-medium text-gray-900 mb-1 text-sm">
                      Pre and Post Training Assessment
                    </h3>
                    <p className="text-xs text-gray-500">
                      add a brief description about this section
                    </p>
                  </div>

                  {/* CAT */}
                  <div
                    className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all",
                      assessmentType === "CAT"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => !isEditMode && setAssessmentType("CAT")}
                  >
                    <h3 className="font-medium text-gray-900 mb-1 text-sm">CAT</h3>
                    <p className="text-xs text-gray-500">
                      add a brief description about this section
                    </p>
                  </div>
        </div>
      </div>

      {/* Number of attempts */}
      <div>
        <Label htmlFor="numberOfAttempts" className="text-sm font-medium text-gray-700">
          Number of attempts
        </Label>
        <Input
          id="numberOfAttempts"
          type="number"
          min={1}
          value={numberOfAttempts}
          onChange={(e) => setNumberOfAttempts(Number(e.target.value))}
          className={cn(
            "mt-2",
            !isAttemptsValid && "border-red-500 focus:border-red-500 focus:ring-red-500"
          )}
          disabled={isEditMode}
        />
        {!isAttemptsValid && (
          <p className="text-sm text-red-600 mt-1">Number of attempts must be greater than 0</p>
        )}
      </div>

      {/* Is this a timed assessment? */}
      <div>
        <Label className="text-sm font-medium text-gray-700 mb-3 block">
          Is this a timed assessment?
        </Label>
        <div className="flex gap-6">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="timed"
              checked={timed === true}
              onChange={() => !isEditMode && setTimed(true)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              disabled={isEditMode}
            />
            <span className="ml-2 text-sm text-gray-700">Yes</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              name="timed"
              checked={timed === false}
              onChange={() => !isEditMode && setTimed(false)}
              className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              disabled={isEditMode}
            />
            <span className="ml-2 text-sm text-gray-700">No</span>
          </label>
        </div>
      </div>

      {/* Duration and Duration Type - only show when timed is true */}
      {timed && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
              Duration
            </Label>
            <Input
              id="duration"
              type="number"
              min={1}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-2"
              disabled={isEditMode}
            />
          </div>
          <div>
            <Label htmlFor="durationType" className="text-sm font-medium text-gray-700">
              Duration Type
            </Label>
            <Select
              value={durationType}
              onValueChange={(value) => setDurationType(value as DurationType)}
              disabled={isEditMode}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Minutes">Minutes</SelectItem>
                <SelectItem value="Hours">Hours</SelectItem>
                <SelectItem value="Days">Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Assign Content Developer (role-gated; hidden for content developers; manual for curriculum admin; search for PM/Company Admin) */}
      {!isEditMode && !isContentDeveloper && (
        <div className="relative">
          <Label className="text-sm font-medium text-gray-700 mb-3 block">
            Assign Content Developer
          </Label>
          {(isCompanyAdmin || isProjectManager) ? (
            // PM/Company Admin: search and pick from list (fetch enabled above)
            selectedUser || (contentDeveloperEmail && !searchQuery) ? (
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  {selectedUser 
                    ? (selectedUser.firstName?.[0] || selectedUser.email[0]).toUpperCase()
                    : contentDeveloperEmail.charAt(0).toUpperCase()
                  }
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {selectedUser 
                      ? `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || selectedUser.email.split('@')[0]
                      : contentDeveloperEmail.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    {selectedUser ? selectedUser.email : contentDeveloperEmail}
                  </p>
                </div>
                <button 
                  onClick={handleClearUser}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleUserSearch(e.target.value)}
                  placeholder="Search for content developer or enter email (optional)"
                  onBlur={() => {
                    if (searchQuery.includes('@') && !selectedUser) {
                      setContentDeveloperEmail(searchQuery)
                      setSearchQuery("")
                      setShowUserList(false)
                    }
                  }}
                />
                {showUserList && filteredUsers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleUserSelect(user)}
                      >
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0]}
                          </p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          <p className="text-xs text-blue-600">{user.role.name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {showUserList && searchQuery.trim() && filteredUsers.length === 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg p-3">
                    <p className="text-sm text-gray-500">
                      No content developers found. You can enter an email directly.
                    </p>
                  </div>
                )}
              </div>
            )
          ) : (
            // Curriculum Admin (and other roles): manual email entry only, no fetch
            <div className="relative">
              <Input
                type="email"
                value={contentDeveloperEmail}
                onChange={(e) => setContentDeveloperEmail(e.target.value)}
                placeholder="Enter content developer email"
              />
            </div>
          )}
        </div>
      )}
      
      {/* Action Buttons */}
      {onSubmit && (
        <div className="pt-2 flex items-center gap-2">
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={!!isSubmitting}
            >
              Cancel
            </Button>
          )}
          <Button
            onClick={onSubmit}
            disabled={!!isSubmitting}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isSubmitting ? (submitLabel ? submitLabel.replace("Update", "Updating...") : "Saving...") : (submitLabel || "Save")}
          </Button>
        </div>
      )}
    </div>
  )
}
