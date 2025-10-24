"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit2, FileImage, Upload, Check, X } from "lucide-react"
import { useSubmitStudentId, ID_TYPES } from "@/lib/hooks/useAttendance"
import { useUploadConsentForm } from "@/lib/hooks/useStudents"
import Image from "next/image"

interface IdUploadModalProps {
  studentId: string
  studentName: string
  idType?: string | null
  frontIdUrl?: string | null
  backIdUrl?: string | null
  signatureUrl?: string | null
  consentFormUrl?: string | null
  trigger: React.ReactNode
}

export function IdUploadModal({
  studentId,
  studentName,
  idType: existingIdType,
  frontIdUrl,
  backIdUrl,
  signatureUrl,
  consentFormUrl,
  trigger
}: IdUploadModalProps) {
  const [selectedIdType, setSelectedIdType] = useState<string>(existingIdType?.toLowerCase() || "")
  const [frontIdFile, setFrontIdFile] = useState<File | null>(null)
  const [backIdFile, setBackIdFile] = useState<File | null>(null)
  const [frontIdPreview, setFrontIdPreview] = useState<string | null>(frontIdUrl || null)
  const [backIdPreview, setBackIdPreview] = useState<string | null>(backIdUrl || null)
  const [consentFile, setConsentFile] = useState<File | null>(null)
  const [consentPreview, setConsentPreview] = useState<string | null>(consentFormUrl || null)
  const [error, setError] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  
  const { mutate: submitStudentId, isPending } = useSubmitStudentId()
  const { mutate: uploadConsent, isPending: isUploadingConsent } = useUploadConsentForm()
  
  // Check if the selected ID type requires a back image
  const requiresBack = ID_TYPES.find(type => type.id === selectedIdType)?.requiresBack || false
  
  // Handle file selection for front ID
  const handleFrontIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG and PNG files are allowed')
      return
    }
    
    setFrontIdFile(file)
    setFrontIdPreview(URL.createObjectURL(file))
  }
  
  // Handle file selection for back ID
  const handleBackIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    
    const file = e.target.files?.[0]
    if (!file) return
    
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG and PNG files are allowed')
      return
    }
    
    setBackIdFile(file)
    setBackIdPreview(URL.createObjectURL(file))
  }

  // Handle file selection for consent form (image or PDF)
  const handleConsentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null)
    const file = e.target.files?.[0]
    if (!file) return
    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }
    // Allow common image types and PDF
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      setError('Only JPEG, PNG or PDF files are allowed')
      return
    }
    setConsentFile(file)
    // For images, generate preview; for PDFs, keep URL for link
    if (file.type.startsWith('image/')) {
      setConsentPreview(URL.createObjectURL(file))
    } else {
      setConsentPreview(file.name)
    }
  }
  
  // Reset form
  const resetForm = () => {
    // Keep existing ID type and previews
    if (!existingIdType) {
      setSelectedIdType("")
    }
    
    setFrontIdFile(null)
    setBackIdFile(null)
    if (!frontIdUrl) setFrontIdPreview(null)
    if (!backIdUrl) setBackIdPreview(null)
    if (!consentFormUrl) setConsentPreview(null)
    setConsentFile(null)
    setError(null)
  }
  
  // Handle form submission
  const handleSubmit = () => {
    setError(null)
    
    // Validate selection
    if (!selectedIdType) {
      setError('Please select an ID type')
      return
    }
    
    // Consent upload flow
    if (selectedIdType === 'consent_form') {
      if (!consentFile && !consentFormUrl) {
        setError('Please upload the consent form')
        return
      }
      if (!consentFile) {
        // No change; close if already exists
        setIsOpen(false)
        resetForm()
        return
      }
      uploadConsent({ id: studentId, consentFormFile: consentFile }, {
        onSuccess: () => {
          setIsOpen(false)
          resetForm()
        }
      })
      return
    }
    
    // ID upload flow
    if (!frontIdFile && !frontIdUrl) {
      setError('Please upload the front of your ID')
      return
    }
    if (requiresBack && !backIdFile && !backIdUrl) {
      setError('Please upload the back of your ID')
      return
    }
    submitStudentId({
      pendingTraineeId: studentId,
      idType: selectedIdType.toUpperCase(),
      idFrontFile: frontIdFile as File,
      ...(requiresBack && backIdFile ? { idBackFile: backIdFile } : {}),
    }, {
      onSuccess: () => {
        setIsOpen(false)
        resetForm()
      }
    })
  }
  
  const getIdTypeLabel = (id: string): string => {
    return ID_TYPES.find(type => type.id === id)?.name || id
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {existingIdType ? "Update ID Document" : "Upload ID Document"} - {studentName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4 overflow-y-auto flex-1 pr-1">
          {/* ID Type Select */}
          <div className="space-y-2">
            <Label htmlFor="id-type">ID Type</Label>
              <Select
              value={selectedIdType}
              onValueChange={(value) => {
                setSelectedIdType(value)
                // If changing ID type, reset files if they require different fields
                if (requiresBack !== ID_TYPES.find(type => type.id === value)?.requiresBack) {
                  setBackIdFile(null)
                  if (!backIdUrl) setBackIdPreview(null)
                }
                  if (value !== 'consent_form') {
                    setConsentFile(null)
                    if (!consentFormUrl) setConsentPreview(null)
                  }
              }}
              disabled={false}
            >
              <SelectTrigger id="id-type" className="w-full">
                <SelectValue placeholder="Select ID type" />
              </SelectTrigger>
              <SelectContent>
                {ID_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name} {type.requiresBack && "(Requires back image)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>
          
          {/* Consent Form Upload */}
          {selectedIdType === 'consent_form' && (
            <div className="space-y-2">
              <Label>Consent Form</Label>
              <div className="flex flex-col items-center justify-center border rounded-md p-4 gap-2 w-full">
                {consentPreview ? (
                  consentPreview.startsWith('http') || consentPreview.endsWith('.pdf') ? (
                    <a
                      href={consentPreview}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      View uploaded consent form
                    </a>
                  ) : (
                    <div className="relative w-full h-40 bg-muted rounded-md overflow-hidden">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Image 
                          src={consentPreview}
                          alt="Consent form preview"
                          layout="fill"
                          objectFit="contain"
                        />
                      </div>
                    </div>
                  )
                ) : (
                  <>
                    <FileImage size={48} className="text-muted-foreground" />
                    <input
                      type="file"
                      id="consent-upload"
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg,application/pdf"
                      onChange={handleConsentChange}
                    />
                    <label
                      htmlFor="consent-upload"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md cursor-pointer"
                    >
                      <Upload size={14} />
                      Upload Consent
                    </label>
                  </>
                )}
                {/* Change button when preview exists */}
                {consentPreview && (
                  <div>
                    <input
                      type="file"
                      id="consent-upload"
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg,application/pdf"
                      onChange={handleConsentChange}
                    />
                    <label
                      htmlFor="consent-upload"
                      className="mt-2 inline-flex items-center justify-center gap-2 px-3 py-1.5 bg-white border rounded-md cursor-pointer text-sm"
                    >
                      <Edit2 size={14} /> Change file
                    </label>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Front ID Upload */}
          {selectedIdType !== 'consent_form' && (
          <div className="space-y-2">
            <Label>Front of ID</Label>
            <div className="flex flex-col items-center justify-center border rounded-md p-4 gap-2">
              {frontIdPreview ? (
                <div className="relative w-full h-40 bg-muted rounded-md overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image 
                      src={frontIdPreview}
                      alt="Front ID preview"
                      layout="fill"
                      objectFit="contain"
                    />
                  </div>
                  <div className="absolute top-2 right-2">
                    <input
                      type="file"
                      id="front-id-upload"
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleFrontIdChange}
                    />
                    <label
                      htmlFor="front-id-upload"
                      className="p-2 bg-white/80 rounded-full cursor-pointer hover:bg-white shadow-sm flex items-center justify-center"
                    >
                      <Edit2 size={14} />
                    </label>
                  </div>
                </div>
              ) : (
                <>
                  <FileImage size={48} className="text-muted-foreground" />
                  <input
                    type="file"
                    id="front-id-upload"
                    className="hidden"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFrontIdChange}
                  />
                  <label
                    htmlFor="front-id-upload"
                    className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md cursor-pointer"
                  >
                    <Upload size={14} />
                    Upload Front
                  </label>
                </>
              )}
            </div>
          </div>
          )}
          
          {/* Back ID Upload (only if required) */}
          {selectedIdType !== 'consent_form' && requiresBack && (
            <div className="space-y-2">
              <Label>Back of ID</Label>
              <div className="flex flex-col items-center justify-center border rounded-md p-4 gap-2">
                {backIdPreview ? (
                  <div className="relative w-full h-40 bg-muted rounded-md overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Image 
                        src={backIdPreview}
                        alt="Back ID preview"
                        layout="fill"
                        objectFit="contain"
                      />
                    </div>
                    <div className="absolute top-2 right-2">
                      <input
                        type="file"
                        id="back-id-upload"
                        className="hidden"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleBackIdChange}
                      />
                      <label
                        htmlFor="back-id-upload"
                        className="p-2 bg-white/80 rounded-full cursor-pointer hover:bg-white shadow-sm flex items-center justify-center"
                      >
                        <Edit2 size={14} />
                      </label>
                    </div>
                  </div>
                ) : (
                  <>
                    <FileImage size={48} className="text-muted-foreground" />
                    <input
                      type="file"
                      id="back-id-upload"
                      className="hidden"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleBackIdChange}
                    />
                    <label
                      htmlFor="back-id-upload"
                      className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md cursor-pointer"
                    >
                      <Upload size={14} />
                      Upload Back
                    </label>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Signature Display (if exists) */}
          {signatureUrl && (
            <div className="space-y-2">
              <Label>Digital Signature</Label>
              <div className="flex items-center justify-between border rounded-md p-3 bg-green-50">
                <div className="flex items-center gap-2">
                  <Check size={16} className="text-green-600" />
                  <span className="text-sm text-green-700">Signature available</span>
                </div>
                <a
                  href={signatureUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                >
                  ✍️ View Signature
                </a>
              </div>
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <X size={14} />
              {error}
            </div>
          )}
          
          {/* Success message if ID exists */}
          {selectedIdType !== 'consent_form' && existingIdType && frontIdUrl && (!requiresBack || backIdUrl) && !frontIdFile && !backIdFile && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <Check size={14} />
              ID documents already uploaded: {getIdTypeLabel(existingIdType)}
            </div>
          )}
          {selectedIdType === 'consent_form' && consentFormUrl && !consentFile && (
            <div className="flex items-center gap-2 text-green-600 text-sm">
              <Check size={14} />
              Consent form already uploaded
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex justify-between pt-2 mt-2 border-t">
          <DialogClose asChild>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleSubmit}
            disabled={
              (selectedIdType === 'consent_form' 
                ? (isUploadingConsent || (!consentFile && !!consentFormUrl))
                : (isPending || (!frontIdFile && !backIdFile && !!existingIdType && !!frontIdUrl))
              )
            }
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            {isPending ? (
              <>
                <span className="animate-spin mr-2">⏳</span> Uploading...
              </>
            ) : selectedIdType === 'consent_form' ? (
              consentFormUrl ? (consentFile ? 'Update Consent' : 'Close') : 'Upload Consent'
            ) : !!existingIdType && !!frontIdUrl && (!requiresBack || !!backIdUrl) ? (
              (frontIdFile || backIdFile) ? "Update ID" : "Close"
            ) : (
              "Upload ID"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}