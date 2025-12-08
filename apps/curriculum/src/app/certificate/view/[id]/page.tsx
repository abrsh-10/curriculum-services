"use client"

import { useParams } from "next/navigation"
import { useState, useEffect } from "react"
import { useGetCertificateById } from "@/lib/hooks/useCertificate"
import { Loading } from "@/components/ui/loading"
import { CheckCircle2, XCircle, Download, Calendar, User, Phone, BookOpen, FileText, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF.js worker - using explicit HTTPS for reliability
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

export default function CertificateViewPage() {
  const params = useParams()
  const certificateId = params?.id as string
  const [numPages, setNumPages] = useState<number>(0)
  const [pageNumber, setPageNumber] = useState(1)
  const [pdfError, setPdfError] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [iframeError, setIframeError] = useState(false)

  const { data, isLoading, error } = useGetCertificateById(certificateId)

  // Detect mobile device after mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      const isMobileDevice = window.innerWidth < 1024 // Use 1024px (lg breakpoint)
      setIsMobile(isMobileDevice)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPageNumber(1) // Reset to first page when new document loads
    setPdfError(false)
  }

  function onDocumentLoadError() {
    setPdfError(true)
    setPageNumber(1) // Reset page number on error as well
  }

  // Loading state
  if (isLoading) {
    return <Loading />
  }

  // Error state
  if (error || !data || data.code !== "OK") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Certificate Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The certificate you are looking for does not exist or has been removed.
          </p>
          <p className="text-sm text-gray-500">
            Certificate ID: {certificateId}
          </p>
        </div>
      </div>
    )
  }

  const { certificate } = data

  // Success state - Certificate found
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7 text-green-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Valid Certificate
                </h1>
                <p className="text-sm text-gray-600">
                  This certificate is authentic and verified
                </p>
              </div>
            </div>
            <Button
              onClick={() => window.open(certificate.fileUrl, '_blank')}
              className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Download Certificate
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Certificate Details Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-[#0B75FF] to-blue-600 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">
              Certificate Details
            </h2>
          </div>

          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Trainee Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#0B75FF]" />
                  Trainee Information
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Full Name</label>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {certificate.traineeName}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Contact Phone</label>
                    <p className="text-base text-gray-900 mt-1 flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-500" />
                      {certificate.traineeContactPhone}
                    </p>
                  </div>

           
                </div>
              </div>  

              {/* Training Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-[#0B75FF]" />
                  Training Information
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Training Title</label>
                    <p className="text-base font-semibold text-gray-900 mt-1">
                      {certificate.trainingTitle}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-600">Issue Date</label>
                    <p className="text-base text-gray-900 mt-1 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      {format(new Date(certificate.issueDate), 'MMMM dd, yyyy')}
                    </p>
                  </div>

         
                </div>
              </div>
            </div>

            {/* Certificate ID */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Certificate ID</label>
                  <p className="text-sm text-gray-900 mt-1 font-mono">
                    {certificate.id}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="font-medium">Verified & Authentic</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Certificate Preview */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-8 py-6">
            <h2 className="text-2xl font-bold text-white">
              Certificate Preview
            </h2>
          </div>

          <div className="p-4 md:p-8">
            {/* PDF Preview - Hybrid approach: iframe for desktop (faster), react-pdf for mobile (better compatibility) */}
            <div className="w-full bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200">
              {/* Desktop: Always use iframe (hidden on mobile after mount) */}
              <div className={mounted && isMobile ? 'hidden' : 'block'}>
                <div className="w-full min-h-[600px] lg:min-h-[800px] relative">
                  {!iframeError ? (
                    <iframe
                      src={certificate.fileUrl}
                      className="w-full h-[600px] lg:h-[800px]"
                      title="Certificate Preview"
                      onError={() => setIframeError(true)}
                    />
                  ) : (
                    // Error fallback for iframe
                    <div className="flex flex-col items-center justify-center h-[600px] lg:h-[800px] px-6 text-center bg-gradient-to-br from-red-50 via-white to-orange-50">
                      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <XCircle className="w-12 h-12 text-red-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Unable to Display Certificate
                      </h3>
                      <p className="text-sm text-gray-600 mb-6">
                        Your browser cannot display this PDF. Please download it to view.
                      </p>
                      <Button
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = certificate.fileUrl
                          link.download = `certificate-${certificate.id}.pdf`
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }}
                        className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Certificate
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Mobile: Use react-pdf (only shown after mount to avoid hydration mismatch) */}
              {mounted && isMobile && (
                <Document
                  file={certificate.fileUrl}
                  onLoadSuccess={onDocumentLoadSuccess}
                  onLoadError={onDocumentLoadError}
                  loading={
                    <div className="flex items-center justify-center py-32 px-4 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
                      <div className="text-center">
                        <div className="relative w-24 h-24 mx-auto mb-6">
                          {/* Outer spinning ring */}
                          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
                          <div className="absolute inset-0 rounded-full border-4 border-[#0B75FF] border-t-transparent animate-spin"></div>
                          {/* Inner icon */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <FileText className="w-10 h-10 text-[#0B75FF]" />
                          </div>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          Loading Certificate
                        </h3>
                        <p className="text-sm text-gray-600">
                          Please wait while we prepare your certificate...
                        </p>
                        <div className="mt-4 flex justify-center gap-1">
                          <div className="w-2 h-2 bg-[#0B75FF] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-[#0B75FF] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-[#0B75FF] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  }
                  error={
                    <div className="flex flex-col items-center justify-center py-32 px-6 text-center bg-gradient-to-br from-red-50 via-white to-orange-50">
                      <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-4">
                        <XCircle className="w-12 h-12 text-red-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Unable to Load Certificate
                      </h3>
                      <p className="text-sm text-gray-600 mb-6">
                        There was an error loading the PDF. Please try downloading it instead.
                      </p>
                      <Button
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = certificate.fileUrl
                          link.download = `certificate-${certificate.id}.pdf`
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }}
                        className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download Certificate
                      </Button>
                    </div>
                  }
                  className="flex justify-center items-center bg-gray-50"
                >
                  <div className="relative py-6">
                    <Page
                      pageNumber={pageNumber}
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="shadow-2xl"
                      width={typeof window !== 'undefined' ? Math.min(window.innerWidth - 96, 800) : 800}
                      scale={1.0}
                    />
                    
                    {/* Page navigation for multi-page certificates */}
                    {numPages > 1 && (
                      <div className="flex items-center justify-center gap-4 mt-6 bg-white py-3 px-6 rounded-full shadow-lg border border-gray-200">
                        <Button
                          onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
                          disabled={pageNumber <= 1}
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm font-medium text-gray-700 px-2">
                          Page {pageNumber} of {numPages}
                        </span>
                        <Button
                          onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
                          disabled={pageNumber >= numPages}
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </Document>
              )}
            </div>
            
            
            {/* Download button */}
            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => {
                  const link = document.createElement('a')
                  link.href = certificate.fileUrl
                  link.download = `certificate-${certificate.id}.pdf`
                  document.body.appendChild(link)
                  link.click()
                  document.body.removeChild(link)
                }}
                size="lg"
                className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white w-full md:w-auto"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Certificate
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}