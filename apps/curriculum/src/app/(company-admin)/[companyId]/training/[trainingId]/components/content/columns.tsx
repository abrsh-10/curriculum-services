"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Content } from "@/lib/hooks/useContent"
import { Badge } from "@/components/ui/badge"
import { useState } from "react"
import { ContentModal } from "@/components/modals/content-modal"
import { useAddContentLink } from "@/lib/hooks/useContent"
import { Button } from "@/components/ui/button"
import { ViewLinksModal } from "@/components/modals/view-links-modal"
import { ContentApprovalModal } from "./content-approval-modal"
import { useUserRole } from "@/lib/hooks/useUserRole"
import { BookOpen, FolderOpen, ClipboardCheck, FileText } from "lucide-react"

function ContentLinkCell({ content }: { content: Content }) {
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const { mutate: addLink, isPending } = useAddContentLink()
  
  const { isContentDeveloper, isIcogAdmin } = useUserRole()
  const canOnlyView = isContentDeveloper || isIcogAdmin

  const handleAddLink = (data: { link: string; referenceLink: string }) => {
    addLink({ contentId: content.id, ...data })
    setShowLinkModal(false)
  }

  if (content.link) {
    return (
      <>
        <Button
          variant="ghost" 
          className="flex items-center gap-2 text-blue-500 p-0 hover:text-brand hover:bg-transparent"
          onClick={() => canOnlyView ? setShowViewModal(true) : setShowApprovalModal(true)}
        >
          {/* <img src="/modulePlus.svg" alt="View" className="w-4 h-4" /> */}

          <span>View Link</span>
        </Button>

        {canOnlyView ? (
          <ViewLinksModal
            content={content}
            isOpen={showViewModal}
            onClose={() => setShowViewModal(false)}
            showActions={isContentDeveloper}
          />
        ) : (
          <ContentApprovalModal
            content={content}
            isOpen={showApprovalModal}
            onClose={() => setShowApprovalModal(false)}
          />
        )}
      </>
    )
  }

  if (isContentDeveloper) {
    return (
      <>
        <Button 
          variant="ghost"
          className="flex items-center gap-2 text-blue-500 p-0 hover:text-brand hover:bg-transparent"
          onClick={() => setShowLinkModal(true)}
          disabled={isPending}
        >
          <img src="/modulePlus.svg" alt="Add" className="w-4 h-4" />
          <span>Add Link</span>
        </Button>

        <ContentModal
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          onSave={handleAddLink}
        />
      </>
    )
  }

  return <span className="text-gray-500">Awaiting Link</span>
}

export const columns: ColumnDef<Content>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({row}) =>{
      const name = row.original
      return name.name || "Name not given"
    }
  },
  {
    accessorKey: "contentFor",
    header: "Content For",
    cell: ({ row }) => {
      const content = row.original
      
      // Determine the content type and display appropriate information
      if (content.contentLevel === 'ASSESSMENT' && content.assessmentName) {
        return (
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-purple-500" />
            <div>
              <div className="font-medium">{content.assessmentName}</div>
              <div className="text-xs text-gray-500">Assessment</div>
            </div>
          </div>
        )
      }
      
      if (content.contentLevel === 'LESSON' && content.lessonName) {
        return (
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-500" />
            <div>
              <div className="font-medium">{content.lessonName}</div>
              <div className="text-xs text-gray-500">Lesson</div>
            </div>
          </div>
        )
      }
      
      if (content.contentLevel === 'MODULE' && content.moduleName) {
        return (
          <div className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4 text-green-500" />
            <div>
              <div className="font-medium">{content.moduleName}</div>
              <div className="text-xs text-gray-500">Module</div>
            </div>
          </div>
        )
      }
      
      // Fallback for any other cases
      return (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-gray-500" />
          <div>
            <div className="font-medium">{content.moduleName || content.lessonName || content.assessmentName || 'Unknown'}</div>
            <div className="text-xs text-gray-500">{content.contentLevel}</div>
          </div>
        </div>
      )
    }
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "contentLevel",
    header: "Content Level",
    cell: ({ row }) => {
      const level = row.original.contentLevel
      
      return (
        <Badge 
          variant="secondary"
          className={
            level === 'ASSESSMENT' ? 'border-purple-200 text-purple-700 bg-purple-50' :
            level === 'LESSON' ? 'border-blue-200 text-blue-700 bg-blue-50' :
            level === 'MODULE' ? 'border-green-200 text-green-700 bg-green-50' :
            'border-gray-200 text-gray-700 bg-gray-50'
          }
        >
          {level.charAt(0) + level.slice(1).toLowerCase()}
        </Badge>
      )
    }
  },
  {
    accessorKey: "contentDeveloper",
    header: "Assigned To",
    cell: ({ row }) => row.original.contentDeveloper.email
  },
  {
    accessorKey: "contentFileType",
    header: "File Type",
  },
  {
    accessorKey: "link",
    header: "Content Link",
    cell: ({ row }) => <ContentLinkCell content={row.original} />
  },
  {
    accessorKey: "contentStatus",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.contentStatus
      
      return (
        <Badge 
          variant={
            status === 'PENDING' ? 'pending' :
            status === 'ACCEPTED' ? 'approved' :
            'rejected'
          }
        >
          {status.charAt(0) + status.slice(1).toLowerCase()}
        </Badge>
      )
    }
  },
] 