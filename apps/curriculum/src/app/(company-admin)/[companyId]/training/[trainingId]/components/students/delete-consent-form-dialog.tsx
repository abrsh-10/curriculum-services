"use client"

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

interface DeleteConsentFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  onConfirmDelete: () => Promise<void>
  isDeleting: boolean
  studentName?: string
}

export function DeleteConsentFormDialog({
  isOpen,
  onOpenChange,
  onConfirmDelete,
  isDeleting,
  studentName
}: DeleteConsentFormDialogProps) {
  const dialogDescription = studentName
    ? `Are you sure you want to delete the consent form for ${studentName}? This action cannot be undone.`
    : "Are you sure you want to delete this consent form? This action cannot be undone."

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Consent Form</AlertDialogTitle>
          <AlertDialogDescription>
            {dialogDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async (e) => {
              e.preventDefault()
              await onConfirmDelete()
            }}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

