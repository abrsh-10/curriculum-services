/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { DeleteDialog } from "./delete-dialog"
import { AddDataDialog } from "../add-data-dialog"
import { AddAlternateNameDialog } from "./add-alternate-name-dialog"
import { BaseData } from "../columns"
import { useBaseData } from "@/lib/hooks/useBaseData"
import { BaseDataType, LOCALIZABLE_TYPES } from "@/types/base-data"

// Constants
const ICON_PATHS = {
  EDIT: "/edit.svg",
  DELETE: "/delete.svg",
};

interface ExtendedBaseData extends BaseData {
  countryId?: string;
  range?: string;
  technologicalRequirementType?: string;
  assessmentSubType?: string;
}

export function ActionCell({ row, activeTab }: { row: any; activeTab: string }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const item = row.original as ExtendedBaseData
  const { 
    update, 
    remove, 
    addAlternateName,
    isUpdateLoading, 
    isDeleteLoading,
    isAddingAlternateName,
    canLocalize 
  } = useBaseData(activeTab as BaseDataType)

  const handleUpdate = async (data: { 
    name: string; 
    description: string; 
    countryId?: string;
    range?: string;
    technologicalRequirementType?: string;
    assessmentSubType?: string;
  }) => {
    await update({ id: item.id, data });
    setShowEditDialog(false);
  }

  const handleDelete = async () => {
    await remove(item.id);
    setShowDeleteDialog(false);
  }

  const handleAddAlternateName = (data: { itemId: string; languageData: { languageCode: string; otherLanguageName: string } }, onSuccess?: () => void) => {
    addAlternateName(data, {
      onSuccess: () => {
        onSuccess?.();
      },
      onError: (error) => {
        console.error('Failed to add alternate name:', error);
        // Modal stays open on error so user can retry
      }
    });
  }

  const existingLanguages = item.alternateNames ? Object.keys(item.alternateNames) : [];
  const existingAlternateNames = item.alternateNames || {};

  return (
    <>
      <div className="flex justify-end gap-1">
        {canLocalize && (
          <AddAlternateNameDialog
            itemId={item.id}
            itemName={item.name}
            type={activeTab as BaseDataType}
            onAddAlternateName={handleAddAlternateName}
            isLoading={isAddingAlternateName}
            existingLanguages={existingLanguages}
            existingAlternateNames={existingAlternateNames}
          />
        )}
        <Button 
          variant="ghost" 
          className="h-8 w-8 p-0"
          onClick={() => setShowEditDialog(true)}
        >
          <span className="sr-only">Edit</span>
          <img src={ICON_PATHS.EDIT} alt="Edit" className="h-6 w-6" />
        </Button>
        <Button 
          variant="ghost" 
          className="h-8 w-8 p-0 text-red-500"
          onClick={() => setShowDeleteDialog(true)}
        >
          <span className="sr-only">Delete</span>
          <img src={ICON_PATHS.DELETE} alt="Delete" className="h-6 w-6" />
        </Button>
      </div>

      <DeleteDialog 
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        loading={isDeleteLoading}
      />

      <AddDataDialog 
        mode="edit"
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        initialData={item}
        onUpdateData={handleUpdate}
        isLoading={isUpdateLoading}
        type={activeTab as BaseDataType}
      />
    </>
  )
} 