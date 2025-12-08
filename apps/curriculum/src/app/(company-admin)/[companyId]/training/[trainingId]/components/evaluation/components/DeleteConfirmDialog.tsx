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
 
 interface DeleteConfirmDialogProps {
   isOpen: boolean
   onClose: () => void
   onConfirm: () => void
   title: string
   description: string
   confirmText?: string
   isDeleting?: boolean
 }
 
 export function DeleteConfirmDialog({
   isOpen,
   onClose,
   onConfirm,
   title,
   description,
   confirmText = "Delete",
   isDeleting = false
 }: DeleteConfirmDialogProps) {
   return (
     <AlertDialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
       <AlertDialogContent>
         <AlertDialogHeader>
           <AlertDialogTitle>{title}</AlertDialogTitle>
           <AlertDialogDescription>
             {description}
           </AlertDialogDescription>
         </AlertDialogHeader>
         <AlertDialogFooter>
           <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
           <AlertDialogAction
             onClick={onConfirm}
             disabled={isDeleting}
             className="bg-red-600 hover:bg-red-700 focus:ring-red-600 text-white"
           >
             {isDeleting ? "Deleting..." : confirmText}
           </AlertDialogAction>
         </AlertDialogFooter>
       </AlertDialogContent>
     </AlertDialog>
   )
 }
 

