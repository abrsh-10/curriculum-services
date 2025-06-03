/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Content, useDeleteContentLink } from "@/lib/hooks/useContent"
import { ContentApprovalModal } from "./content-approval-modal"
import { Eye, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ContentActionCell({ row }: { row: any }) {
  const content = row.original as Content
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const { mutateAsync: deleteContent, isPending: isDeleting } = useDeleteContentLink()

  const handleDelete = async () => {
    try {
      await deleteContent(content.id)
      toast.success("Content deleted successfully")
      setShowDeleteDialog(false)
    } catch (error) {
      toast.error("Failed to delete content")
      console.error("Error deleting content:", error)
    }
  }

  // Determine if actions should be disabled
  const isAccepted = content.contentStatus === 'ACCEPTED'
  const isDisabled = isDeleting

  return (
    <>
      <div className="flex gap-2 justify-end">
        <Button 
          variant="outline" 
          size="sm"
          className="h-8 px-3 border-blue-200 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
          onClick={() => setShowApprovalModal(true)}
          disabled={isDisabled}
        >
          <Eye className="h-4 w-4 mr-1" />
          View
        </Button>
        
        <Button 
          variant="outline" 
          size="sm"
          className="h-8 px-3 border-red-200 text-red-500 hover:text-red-600 hover:bg-red-50"
          onClick={() => setShowDeleteDialog(true)}
          disabled={isDisabled || isAccepted}
          title={isAccepted ? "Cannot delete accepted content" : "Delete content"}
        >
          {isDeleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* View/Approval Modal */}
      <ContentApprovalModal
        content={content}
        isOpen={showApprovalModal}
        onClose={() => setShowApprovalModal(false)}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this content?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium text-gray-800">{content.name}</p>
            <p className="text-sm text-gray-500 mt-1">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 