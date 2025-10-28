"use client"

import { useParams } from "next/navigation"
import { useGetCertificateById } from "@/lib/hooks/useCertificate"
import { Loading } from "@/components/ui/loading"
import { CheckCircle2, XCircle, Download, Calendar, User, Phone, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"

export default function CertificateViewPage() {
  const params = useParams()
  const certificateId = params?.id as string

  const { data, isLoading, error } = useGetCertificateById(certificateId)

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

          <div className="p-8">
            <div className="aspect-[1.414/1] w-full bg-gray-100 rounded-lg overflow-hidden shadow-inner">
              <iframe
                src={certificate.fileUrl}
                className="w-full h-full"
                title="Certificate Preview"
              />
            </div>

            <div className="mt-6 flex justify-center">
              <Button
                onClick={() => window.open(certificate.fileUrl, '_blank')}
                size="lg"
                className="bg-[#0B75FF] hover:bg-[#0B75FF]/90 text-white"
              >
                <Download className="w-5 h-5 mr-2" />
                Download Full Certificate
              </Button>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        {/* <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            This certificate can be verified at any time using the certificate ID above.
          </p>
        </div> */}
      </div>
    </div>
  )
}

