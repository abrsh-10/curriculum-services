"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Content } from "@/lib/hooks/useContent"
import { useAcceptContent, useRejectContent } from "@/lib/hooks/useContent"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, AlertCircle, ExternalLink, CheckCircle, XCircle, BookOpen, FolderOpen, ClipboardCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"


interface ContentApprovalModalProps {
  content: Content
  isOpen: boolean
  onClose: () => void
}

export function ContentApprovalModal({ content, isOpen, onClose }: ContentApprovalModalProps) {
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)
  const { mutateAsync: acceptContent, isPending: isAccepting } = useAcceptContent()
  const { mutateAsync: rejectContent, isPending: isRejecting } = useRejectContent()
  const [reason, setReason] = useState("")
  const [validationError, setValidationError] = useState("")

  const handleAccept = async () => {
    try {
      await acceptContent(content.id)
        // toast.success("Content accepted successfully")
      onClose()
    } catch (error) {
      // toast.error("Failed to accept content")
      // console.error("Error accepting content:", error)
    }
  }

  const handleReject = async () => {
    if (!reason.trim()) {
      setValidationError("Please provide a reason for rejection")
      return
    }
    
    try {
      await rejectContent({ contentId: content.id, reason })
      // toast.success("Content rejected with feedback")
      setShowRejectionDialog(false)
      onClose()
    } catch (error) {
      // toast.error("Failed to reject content")
      // console.error("Error rejecting content:", error)
    }
  }

  // Determine content preview based on type
  const renderContentPreview = () => {
    if (!content.link) return null;
    
    switch(content.contentFileType) {
      case 'PDF':
        return (
          <div className="border rounded-md p-4 bg-gray-50 mb-4">
            <p className="text-sm text-gray-500 mb-2">PDF Preview</p>
            <div className="flex items-center justify-between">
              <span className="truncate max-w-[400px]">{content.link}</span>
              <a 
                href={content.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 flex items-center gap-1 text-sm hover:underline ml-2"
              >
                Open PDF <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        );
      case 'VIDEO':
        return (
          <div className="border rounded-md p-4 bg-gray-50 mb-4">
            <p className="text-sm text-gray-500 mb-2">Video Link</p>
            <div className="flex items-center justify-between">
              <span className="truncate max-w-[400px]">{content.link}</span>
              <a 
                href={content.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 flex items-center gap-1 text-sm hover:underline ml-2"
              >
                Watch Video <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        );
      case 'LINK':
        return (
          <div className="border rounded-md p-4 bg-gray-50 mb-4">
            <p className="text-sm text-gray-500 mb-2">Web Link</p>
            <div className="flex items-center justify-between">
              <span className="truncate max-w-[400px]">{content.link}</span>
              <a 
                href={content.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 flex items-center gap-1 text-sm hover:underline ml-2"
              >
                Visit Link <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Dialog open={isOpen && !showRejectionDialog} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[700px] p-0">
          <DialogHeader className="p-6 border-b">
            <DialogTitle className="text-xl flex items-center gap-2">
              Content Review: {content.name}
            </DialogTitle>
            <DialogDescription className="pt-1">
              Review and approve or reject this content submission
            </DialogDescription>
          </DialogHeader>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
            {/* Content Preview */}
            {renderContentPreview()}
            
            {/* Content Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Content Type</h3>
                <p className="font-medium">{content.contentFileType}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Status</h3>
                <Badge 
                  variant={
                    content.contentStatus === 'PENDING' ? 'pending' :
                    content.contentStatus === 'ACCEPTED' ? 'approved' :
                    'rejected'
                  }
                >
                  {content.contentStatus.charAt(0) + content.contentStatus.slice(1).toLowerCase()}
                </Badge>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Content For</h3>
                <div className="flex items-center gap-2">
                  {content.contentLevel === 'ASSESSMENT' && content.assessmentName ? (
                    <>
                      <ClipboardCheck className="h-4 w-4 text-purple-500" />
                      <div>
                        <p className="font-medium">{content.assessmentName}</p>
                        <p className="text-xs text-gray-500">Assessment</p>
                      </div>
                    </>
                  ) : content.contentLevel === 'LESSON' && content.lessonName ? (
                    <>
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="font-medium">{content.lessonName}</p>
                        <p className="text-xs text-gray-500">Lesson</p>
                      </div>
                    </>
                  ) : content.contentLevel === 'MODULE' && content.moduleName ? (
                    <>
                      <FolderOpen className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium">{content.moduleName}</p>
                        <p className="text-xs text-gray-500">Module</p>
                      </div>
                    </>
                  ) : (
                    <p className="font-medium text-gray-500">Unknown content target</p>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Submitted By</h3>
                <p className="font-medium">{content.contentDeveloper.email}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-sm font-medium text-gray-500 mb-1">Description</h3>
              <p className="text-gray-700">{content.description || "No description provided"}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Content Link</h3>
                {content.link ? (
                  <a 
                    href={content.link} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:underline break-all"
                  >
                    {content.link}
                  </a>
                ) : (
                  <p className="text-gray-500">No link provided</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">Reference</h3>
                {content.referenceLink ? (
                  <a 
                    href={content.referenceLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-500 hover:underline break-all"
                  >
                    {content.referenceLink}
                  </a>
                ) : (
                  <p className="text-gray-500">No reference provided</p>
                )}
              </div>
            </div>
            
            {content.rejectionReason && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-md">
                <h3 className="text-sm font-medium text-red-600 mb-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  Previous Rejection Reason
                </h3>
                <p className="text-red-800">{content.rejectionReason}</p>
              </div>
            )}
          </div>
          
          <DialogFooter className="p-6 border-t bg-gray-50 flex justify-end gap-3">
            <Button
              variant="outline"
              className="border-red-300 text-red-500"
              onClick={() => setShowRejectionDialog(true)}
              disabled={isAccepting}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
            </Button>
            <Button
              onClick={handleAccept}
              disabled={isAccepting}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Accept
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showRejectionDialog} onOpenChange={(open) => {
        setShowRejectionDialog(open)
        if (!open) setValidationError("")
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Rejection Feedback</DialogTitle>
            <DialogDescription>
              Provide feedback to help the content developer understand why the content was rejected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Please explain why you're rejecting this content and what changes are needed..."
              value={reason}
              onChange={(e) => {
                setReason(e.target.value)
                if (validationError) setValidationError("")
              }}
              className="min-h-[150px]"
            />
            {validationError && (
              <p className="text-sm text-red-500">{validationError}</p>
            )}
          </div>
          <DialogFooter className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowRejectionDialog(false)}
              disabled={isRejecting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={isRejecting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Rejection Feedback"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
} 