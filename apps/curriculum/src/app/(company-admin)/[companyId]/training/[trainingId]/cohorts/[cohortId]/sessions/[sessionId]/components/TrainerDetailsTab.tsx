'use client'

import React from 'react'
import { useSessionTrainers, Trainer } from '@/lib/hooks/useSession'
import { Loading } from '@/components/ui/loading'
import { 
  AlertCircle, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Tag 
} from 'lucide-react'

interface TrainerDetailsTabProps {
  sessionId: string
  trainerType: 'MAIN' | 'ASSISTANT'
}

interface TrainerDetailItemProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string | undefined
  className?: string
}

const TrainerDetailItem: React.FC<TrainerDetailItemProps> = ({ 
  icon: Icon, 
  label, 
  value,
  className = ""
}) => (
  <div className={`flex items-start gap-3 ${className}`}>
    <Icon className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-sm text-gray-600 break-words">{value || 'Not provided'}</p>
    </div>
  </div>
)

export function TrainerDetailsTab({ sessionId, trainerType }: TrainerDetailsTabProps) {
  const { data: trainers, isLoading, error } = useSessionTrainers(sessionId, trainerType)

  const title = trainerType === 'MAIN' ? 'Main Trainer' : 'Assistant Trainer'

  if (isLoading) {
    return <Loading />
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center text-red-600">
        <AlertCircle className="h-10 w-10 mb-4" />
        <h3 className="text-lg font-medium mb-2">Error Loading {title} Details</h3>
        <p className="text-sm">{error.message}</p>
      </div>
    )
  }

  if (!trainers || trainers.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-gray-500">No {title} assigned to this session yet.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {trainers.map((trainer: Trainer) => (
        <div 
          key={trainer.id} 
          className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          {/* Header section */}
          <div className="flex items-center gap-4 p-6 border-b border-gray-100">
            {/* Placeholder for image/icon */}
            <div className="bg-blue-100 p-4 rounded-full">
              <User className="h-7 w-7 text-blue-700" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {trainer.firstName} {trainer.lastName}
              </h3>
              <p className="text-sm text-blue-600 font-medium">{title}</p> 
            </div>
          </div>

          {/* Details section */}
          <div className="p-6 space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Personal Information
              </h4>
              <div className="grid grid-cols-1 gap-4">
                <TrainerDetailItem 
                  icon={Mail} 
                  label="Email" 
                  value={trainer.email}
                />
                <TrainerDetailItem 
                  icon={Phone} 
                  label="Phone" 
                  value={trainer.phoneNumber}
                />
                {trainer.gender && (
                  <TrainerDetailItem 
                    icon={User} 
                    label="Gender" 
                    value={trainer.gender}
                  />
                )}
                {trainer.dateOfBirth && (
                  <TrainerDetailItem 
                    icon={Calendar} 
                    label="Date of Birth" 
                    value={new Date(trainer.dateOfBirth).toLocaleDateString()}
                  />
                )}
                {trainer.location && (
                  <TrainerDetailItem 
                    icon={MapPin} 
                    label="Location" 
                    value={trainer.location}
                  />
                )}
              </div>
            </div>

            {/* Professional Information */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Professional Information
              </h4>
              <div className="grid grid-cols-1 gap-4">
                {trainer.language && (
                  <TrainerDetailItem 
                    icon={Tag} 
                    label="Language" 
                    value={trainer.language.name}
                  />
                )}
                {trainer.academicLevel && (
                  <TrainerDetailItem 
                    icon={Tag} 
                    label="Academic Level" 
                    value={trainer.academicLevel.name}
                  />
                )}
                {trainer.experienceYears && (
                  <TrainerDetailItem 
                    icon={Tag} 
                    label="Experience Years" 
                    value={trainer.experienceYears.toString()}
                  />
                )}
              </div>
            </div>

            {/* Training Tags */}
            {trainer.trainingTags && trainer.trainingTags.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                  Training Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {trainer.trainingTags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium"
                    >
                      <Tag className="h-3 w-3" />
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 