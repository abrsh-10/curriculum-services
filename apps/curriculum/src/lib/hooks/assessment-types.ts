import { Cohort } from "./useCohorts";

// ============================================================================
// Assessment API Payloads (for mutations)
// ============================================================================

export interface Choice {
  choice: string;
  choiceImage: string;
  choiceImageFile?: File; // For multipart uploads
  isCorrect: boolean;
}

export interface AssessmentEntry {
  question: string;
  questionImage: string;
  questionImageFile?: File; // For multipart uploads
  questionType: "RADIO" | "CHECKBOX";
  choices: Choice[];
  weight: number;
}

export interface AssessmentSection {
  title: string;
  description: string;
  assessmentEntries: AssessmentEntry[];
}

export interface CreateAssessmentPayload {
  name: string;
  type: "PRE_POST";
  description: string;
  duration: number;
  maxAttempts: number;
  contentDeveloperEmail: string;
  sections: AssessmentSection[];
  timed: boolean;
}

export interface UpdateAssessmentPayload {
  name: string;
  type: "PRE_POST";
  description: string;
  duration: number;
  maxAttempts: number;
  contentDeveloperEmail: string;
  timed: boolean;
}

export interface CreateAnswerLinkPayload {
  cohortIds: string[];
  traineeIds: string[];
  linkType: "PRE_ASSESSMENT" | "POST_ASSESSMENT";
  expiryMinutes: number;
}

export interface ExtendAnswerLinkPayload {
  expiryMinutes: number;
}

export interface UpdateAssessmentSectionPayload {
  title: string;
  description: string;
  sectionOrder: number;
}

export interface ApiErrorResponse {
  message: string;
  [key: string]: unknown;
}

// ============================================================================
// Assessment GET API Response Interfaces
// ============================================================================

export interface AssessmentChoice {
  id: string;
  choiceText: string;
  choiceImageUrl: string | null;
  isCorrect: boolean;
}

export interface AssessmentQuestion {
  id: string;
  questionNumber: number;
  question: string;
  questionType: "RADIO" | "CHECKBOX";
  questionImageUrl: string | null;
  choices: AssessmentChoice[];
  weight: number;
}

export interface AssessmentSectionDetail {
  id: string;
  title: string;
  description: string;
  sectionNumber: number;
  questions: AssessmentQuestion[];
}

interface ContentDeveloperRef {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: { name: string; colorCode?: string };
  profilePictureUrl: string | null;
}

export interface AssessmentSummary {
  id: string;
  name: string;
  type: "PRE_POST";
  description: string;
  duration: number;
  maxAttempts: number;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  contentDeveloper: ContentDeveloperRef | null;
  cohorts: Cohort[];
  sectionCount: number;
  timed: boolean;
}

export interface AssessmentDetail {
  id: string;
  name: string;
  type: "PRE_POST";
  description: string;
  duration: number;
  maxAttempts: number;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  contentDeveloper: ContentDeveloperRef | null;
  cohorts: string[];
  sections: AssessmentSectionDetail[];
  timed: boolean;
}

// API Response Wrappers
export interface AssessmentsResponse {
  assessments: AssessmentSummary[];
  code: string;
  message: string;
}

export interface AssessmentDetailResponse {
  assessment: AssessmentDetail;
  code: string;
  message: string;
}

export interface AssessmentSectionsResponse {
  code: string;
  message: string;
  sections: AssessmentSectionDetail[];
}

export interface AssessmentSectionResponse {
  code: string;
  section: AssessmentSectionDetail;
  message: string;
}

// ============================================================================
// Query Keys
// ============================================================================

export const assessmentQueryKeys = {
  all: ['assessments'] as const,
  training: (trainingId: string) => ['assessments', 'training', trainingId] as const,
  detail: (assessmentId: string) => ['assessments', 'detail', assessmentId] as const,
  sections: (assessmentId: string) => ['assessments', 'sections', assessmentId] as const,
  section: (sectionId: string) => ['assessments', 'section', sectionId] as const,
};

