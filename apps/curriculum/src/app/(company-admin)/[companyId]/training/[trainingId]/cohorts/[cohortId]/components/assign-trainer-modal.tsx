"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { useTrainers } from "@/lib/hooks/useTrainers"
import { useAssignTrainerToSession } from "@/lib/hooks/useSession"
import { Session } from "@/lib/hooks/useSession"
import { Loader2, Search, User } from "lucide-react"

interface AssignTrainerModalProps {
  isOpen: boolean
  onClose: () => void
  sessions: Session[]
  onSuccess?: () => void
}

export function AssignTrainerModal({ isOpen, onClose, sessions, onSuccess }: AssignTrainerModalProps) {
  const [selectedSessionIds, setSelectedSessionIds] = useState<string[]>([])
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>("")
  const [assignmentType, setAssignmentType] = useState<"MAIN" | "ASSISTANT">("MAIN")
  const [searchQuery, setSearchQuery] = useState("")

  const { data: trainersData, isLoading: loadingTrainers } = useTrainers(1, 100)
  const { assignTrainer, isLoading: isAssigning } = useAssignTrainerToSession()

  const trainers = trainersData?.trainers || []

  // Filter trainers based on search
  const filteredTrainers = trainers.filter(trainer =>
    `${trainer.firstName} ${trainer.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    trainer.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedSessionIds([])
      setSelectedTrainerId("")
      setAssignmentType("MAIN")
      setSearchQuery("")
    }
  }, [isOpen])

  const handleSessionToggle = (sessionId: string) => {
    setSelectedSessionIds(prev =>
      prev.includes(sessionId)
        ? prev.filter(id => id !== sessionId)
        : [...prev, sessionId]
    )
  }

  const handleSelectAllSessions = () => {
    if (selectedSessionIds.length === sessions.length) {
      setSelectedSessionIds([])
    } else {
      setSelectedSessionIds(sessions.map(s => s.id))
    }
  }

  const handleAssign = async () => {
    if (selectedSessionIds.length === 0 || !selectedTrainerId) {
      return
    }

    assignTrainer(
      {
        assignmentType,
        sessionIds: selectedSessionIds,
        trainerId: selectedTrainerId,
      },
      {
        onSuccess: () => {
          onSuccess?.()
          onClose()
        },
      }
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle>Assign Trainer to Session(s)</DialogTitle>
          <DialogDescription>
            Select one or more sessions and assign a trainer as main or assistant
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto flex flex-col gap-6 px-6 py-4">
          {/* Assignment Type Selection */}
          <div className="space-y-2">
            <Label>Trainer Type</Label>
            <RadioGroup
              value={assignmentType}
              onValueChange={(value) => setAssignmentType(value as "MAIN" | "ASSISTANT")}
              className="flex gap-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="MAIN" id="main" />
                <Label htmlFor="main" className="font-normal cursor-pointer">Main Trainer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="ASSISTANT" id="assistant" />
                <Label htmlFor="assistant" className="font-normal cursor-pointer">Assistant Trainer</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Sessions Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Select Sessions ({selectedSessionIds.length} selected)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleSelectAllSessions}
                className="h-8 text-xs"
              >
                {selectedSessionIds.length === sessions.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            <div className="border rounded-md max-h-[200px] overflow-y-auto">
              <div className="p-3 space-y-2">
                {sessions.map((session) => (
                  <div key={session.id} className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded">
                    <Checkbox
                      id={`session-${session.id}`}
                      checked={selectedSessionIds.includes(session.id)}
                      onCheckedChange={() => handleSessionToggle(session.id)}
                    />
                    <label
                      htmlFor={`session-${session.id}`}
                      className="text-sm flex-1 cursor-pointer"
                    >
                      {session.name}
                      <span className="text-xs text-gray-500 ml-2">
                        ({new Date(session.startDate).toLocaleDateString()})
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trainer Selection */}
          <div className="space-y-3">
            <Label>Select Trainer</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search trainers by name or email..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="border rounded-md max-h-[250px] overflow-y-auto">
              {loadingTrainers ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : filteredTrainers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center p-4">
                  <p className="text-sm text-gray-500">No trainers found</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {filteredTrainers.map((trainer) => (
                    <div
                      key={trainer.id}
                      className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors ${
                        selectedTrainerId === trainer.id
                          ? "bg-blue-50 border border-blue-200"
                          : "hover:bg-gray-50 border border-transparent"
                      }`}
                      onClick={() => setSelectedTrainerId(trainer.id)}
                    >
                      <div className="bg-gray-100 p-2 rounded-full">
                        <User className="h-4 w-4 text-gray-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {trainer.firstName} {trainer.lastName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{trainer.email}</p>
                      </div>
                      {selectedTrainerId === trainer.id && (
                        <div className="h-2 w-2 rounded-full bg-blue-600"></div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-white">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isAssigning}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleAssign}
            disabled={selectedSessionIds.length === 0 || !selectedTrainerId || isAssigning}
            className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white"
          >
            {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Assign Trainer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}


