"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useCheckAssessmentLinkValidity, useStartAssessment, useSaveAssessmentAnswers, useSubmitAssessment, type AssessmentAnswer, type AssessmentAttempt } from "@/lib/hooks/useAssessmentLink";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Timer } from "@/components/Timer";
import { QuestionCard } from "@/components/QuestionCard";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Clock, User, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { clsx } from "clsx";

export default function AssessmentAnswerPage() {
  const params = useParams();
  const router = useRouter();
  const linkId = params.linkId as string;

  const [assessmentAttempt, setAssessmentAttempt] = useState<AssessmentAttempt | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AssessmentAnswer>>({});
  const [isStarted, setIsStarted] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Hooks
  const { data: validityData, isLoading: checkingValidity, error: validityError } = useCheckAssessmentLinkValidity(linkId);
  const startAssessmentMutation = useStartAssessment();
  const saveAnswersMutation = useSaveAssessmentAnswers();
  const submitAssessmentMutation = useSubmitAssessment();

  const assessmentLink = validityData?.assessmentLink;
  const assessment = assessmentLink?.assessment;
  const isValid = assessmentLink?.valid;
  const isExpired = !isValid && validityError;

  // Calculate progress
  const totalQuestions = assessment?.sections.reduce((acc, section) => acc + section.questions.length, 0) || 0;
  const answeredQuestions = Object.keys(answers).length;
  const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;
  const allQuestionsAnswered = answeredQuestions === totalQuestions && totalQuestions > 0;

  // Get current section and question
  const currentSection = assessment?.sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];

  const handleSubmit = useCallback(async () => {
    try {
      await submitAssessmentMutation.mutateAsync(linkId);
      router.push('/');
    } catch (error) {
      console.error("Failed to submit assessment:", error);
    }
  }, [submitAssessmentMutation, linkId, router]);

  useEffect(() => {
    if (assessmentAttempt?.startedAt && assessment?.timed && !isTimeUp) {
      const startTime = new Date(assessmentAttempt.startedAt).getTime();
      const durationMs = assessment.duration * 60 * 1000; // Convert minutes to milliseconds
      const endTime = startTime + durationMs;
      
      const updateTimer = () => {
        const now = Date.now();
        const remaining = Math.max(0, endTime - now);
        setTimeRemaining(Math.ceil(remaining / 1000)); // Convert to seconds
        
        if (remaining <= 0 && !isTimeUp) {
          setIsTimeUp(true);
          toast.error("Time is up! Assessment time has expired.");
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      
      return () => clearInterval(interval);
    }
  }, [assessmentAttempt, assessment, isTimeUp]);

  const handleStartAssessment = async () => {
    try {
      const result = await startAssessmentMutation.mutateAsync(linkId);
      setAssessmentAttempt(result.assessmentAttempt);
      
      // Restore previously saved answers if they exist
      if (result.assessmentAttempt.assessmentAnswers && result.assessmentAttempt.assessmentAnswers.length > 0) {
        const restoredAnswers: Record<string, AssessmentAnswer> = {};
        result.assessmentAttempt.assessmentAnswers.forEach((answer: {
          assessmentEntryId: string;
          selectedChoices?: Array<{ id: string; choiceText: string; choiceImageUrl: string | null; isCorrect: boolean | null }>;
          textAnswer?: string | null;
        }) => {
          // Transform backend format to frontend format
          // Backend returns: { selectedChoices: [{ id, choiceText, ... }], textAnswer }
          // Frontend expects: { selectedChoiceIds: [id1, id2, ...], textAnswer }
          restoredAnswers[answer.assessmentEntryId] = {
            assessmentEntryId: answer.assessmentEntryId,
            selectedChoiceIds: answer.selectedChoices?.map((choice) => choice.id) || [],
            textAnswer: answer.textAnswer || undefined
          };
        });
        setAnswers(restoredAnswers);
        toast.info(`Restored ${result.assessmentAttempt.assessmentAnswers.length} saved answer${result.assessmentAttempt.assessmentAnswers.length === 1 ? '' : 's'}`);
      }
      
      setIsStarted(true);
      toast.success(result.assessmentAttempt.attemptStatus === 'IN_PROGRESS' ? "Continuing assessment..." : "Assessment started!");
    } catch (error) {
      console.error("Failed to start assessment:", error);
    }
  };

  const handleAnswerChange = async (questionId: string, answer: AssessmentAnswer) => {
    // Don't allow answers when time is up
    if (isTimeUp) {
      toast.warning("Time is up! You can no longer modify your answers.");
      return;
    }

    const updatedAnswers = { ...answers, [questionId]: answer };
    setAnswers(updatedAnswers);

    // Auto-save answers - only send valid/complete answers
    try {
      // Filter out incomplete answers (empty selectedChoiceIds for RADIO/CHECKBOX, empty/undefined textAnswer for TEXT)
      const validAnswers = Object.values(updatedAnswers).filter(ans => {
        // TEXT questions must have textAnswer
        if (ans.textAnswer !== undefined && ans.textAnswer !== null) {
          return ans.textAnswer.trim().length > 0;
        }
        // RADIO/CHECKBOX questions must have at least one choice selected
        return ans.selectedChoiceIds && ans.selectedChoiceIds.length > 0;
      });

      if (validAnswers.length > 0) {
        await saveAnswersMutation.mutateAsync({
          linkId,
          assessmentAnswers: validAnswers
        });
      }
    } catch (error) {
      console.error("Failed to auto-save answers:", error);
    }
  };

  const navigateToQuestion = (sectionIndex: number, questionIndex: number) => {
    if (isTimeUp) {
      toast.warning("Time is up! Navigation is no longer available.");
      return;
    }
    setCurrentSectionIndex(sectionIndex);
    setCurrentQuestionIndex(questionIndex);
  };

  const handleNext = () => {
    if (!currentSection || isTimeUp) return;
    
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else if (currentSectionIndex < (assessment?.sections.length || 0) - 1) {
      setCurrentSectionIndex(currentSectionIndex + 1);
      setCurrentQuestionIndex(0);
    }
  };

  const handlePrevious = () => {
    if (isTimeUp) return;
    
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (currentSectionIndex > 0) {
      setCurrentSectionIndex(currentSectionIndex - 1);
      setCurrentQuestionIndex((assessment?.sections[currentSectionIndex - 1].questions.length || 1) - 1);
    }
  };


  // Loading state
  if (checkingValidity) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking assessment link validity...</p>
        </div>
      </div>
    );
  }

  // Error or invalid link
  if (!isValid || isExpired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="max-w-md mx-auto shadow-lg">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Assessment Link Invalid</h2>
            <p className="text-muted-foreground mb-6">
              {validityError ? "This assessment link has expired or is no longer valid." : "Unable to access this assessment."}
            </p>
            <Button onClick={() => router.push('/')} variant="outline">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pre-assessment screen
  if (!isStarted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl w-full mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground mb-2">Assessment Portal</p>
              <CardTitle className="text-3xl font-bold text-foreground">{assessment?.name}</CardTitle>
              {assessment?.description && (
                <p className="text-muted-foreground mt-2">{assessment.description}</p>
              )}
            </CardHeader>
            <CardContent className="space-y-6 px-8 pb-8">
              <div className="bg-muted p-6 rounded-lg border">
                <h3 className="font-semibold text-lg mb-4 text-center text-foreground">Assessment Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-card p-3 rounded-md flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Student</p>
                      <p className="font-medium text-foreground">{assessmentLink?.traineeName}</p>
                    </div>
                  </div>
                  <div className="bg-card p-3 rounded-md flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Duration</p>
                      <p className="font-medium text-foreground">
                        {assessment?.timed ? `${assessment.duration} minutes` : "No time limit"}
                      </p>
                    </div>
                  </div>
                  <div className="bg-card p-3 rounded-md flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Type</p>
                      <p className="font-medium text-foreground">{assessmentLink?.linkType.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <div className="bg-card p-3 rounded-md flex items-center gap-3">
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-muted-foreground">{totalQuestions}</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide">Questions</p>
                      <p className="font-medium text-foreground">{totalQuestions} Total</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-accent p-6 rounded-lg border">
                <h4 className="font-semibold text-lg text-foreground mb-4 text-center">📋 Instructions</h4>
                <ul className="text-muted-foreground space-y-3">
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                    <span>Read each question carefully before answering</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                    <span>Your answers will be automatically saved as you progress</span>
                  </li>
                  {assessment?.timed && (
                    <li className="flex items-start gap-3">
                      <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">⏰</span>
                      <span>The timer will start once you begin - manage your time wisely</span>
                    </li>
                  )}
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                    <span>Navigate between questions using the sidebar or navigation buttons</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span>
                    <span>Click &quot;Submit Assessment&quot; when you&apos;re ready to finish</span>
                  </li>
                </ul>
              </div>

              <div className="flex justify-center pt-4">
                <Button 
                  onClick={handleStartAssessment}
                  disabled={startAssessmentMutation.isPending}
                  size="lg"
                  className="px-12 py-3"
                >
                  {startAssessmentMutation.isPending ? "Loading..." : "🚀 Start Assessment"}
                </Button>
              </div>
              
              <p className="text-center text-sm text-muted-foreground mt-3">
                💡 Your progress is automatically saved. You can safely refresh the page anytime.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Time up screen
  if (isTimeUp) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-2xl w-full mx-auto">
          <Card className="shadow-lg border-destructive/20">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <Clock className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-3xl font-bold text-destructive">Time is Up!</CardTitle>
              <p className="text-muted-foreground mt-2">
                The assessment time has expired. You can no longer modify your answers.
              </p>
            </CardHeader>
            <CardContent className="space-y-6 px-8 pb-8">
              <div className="bg-muted/50 p-6 rounded-lg border text-center">
                <h3 className="font-semibold text-lg mb-4 text-foreground">Assessment Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-card p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Questions Answered</p>
                    <p className="text-2xl font-bold text-primary/70">{answeredQuestions}/{totalQuestions}</p>
                  </div>
                  <div className="bg-card p-3 rounded-md">
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <p className="text-2xl font-bold text-primary/70">{Math.round(progressPercentage)}%</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-center">
                <p className="text-amber-800 font-medium mb-2">⚠️ Important Notice</p>
                <p className="text-amber-700 text-sm">
                  Time has expired for this assessment. If you wish to submit your current answers, 
                  you must do so through your instructor or assessment administrator.
                </p>
              </div>

              <div className="flex justify-center pt-4">
                <Button 
                  onClick={() => router.push('/')}
                  variant="outline"
                  size="lg"
                  className="px-12 py-3"
                >
                  Exit Assessment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Assessment in progress
  return (
    <div className="min-h-screen bg-background">
      {/* Header - Mobile Responsive */}
      <div className="bg-card shadow-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
          {/* Top Row: Exit button, Title, and Timer (mobile: stacked) */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
            {/* Left: Exit + Title */}
            <div className="flex items-start gap-2 sm:gap-4 flex-1 min-w-0">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.push('/')}
                className="flex-shrink-0"
              >
                <ArrowLeft className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Exit</span>
              </Button>
              <div className="flex-1 min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-foreground line-clamp-2">{assessment?.name}</h1>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium truncate">{assessmentLink?.traineeName}</p>
              </div>
            </div>
            
            {/* Right: Timer and Progress (mobile: row below, desktop: side by side) */}
            <div className="flex flex-row sm:flex-row items-center gap-3 sm:gap-4 flex-shrink-0">
              {assessment?.timed && timeRemaining !== null && (
                <div className="flex-shrink-0">
                  <Timer timeRemaining={timeRemaining} />
                </div>
              )}
              <div className="text-center sm:text-right bg-muted px-3 sm:px-4 py-2 rounded-lg border flex-shrink-0">
                <p className="text-xs sm:text-sm font-medium text-foreground">Progress</p>
                <p className="text-base sm:text-lg font-bold text-primary/70">{answeredQuestions}/{totalQuestions}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">questions answered</p>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs sm:text-sm">
              <span className="font-medium text-foreground">Overall Progress</span>
              <span className="font-bold text-primary/70">{Math.round(progressPercentage)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2 sm:h-3 [&>div]:bg-primary/60" />
          </div>
        </div>
      </div>

      {/* Banner: Please finish all questions - Mobile Responsive */}
      {!allQuestionsAnswered && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-3">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <span className="text-amber-600 text-base sm:text-lg">⚠️</span>
                <p className="text-amber-800 font-medium text-xs sm:text-sm text-center sm:text-left">
                  Please answer all questions before submitting
                </p>
              </div>
              <div className="bg-amber-100 px-2 sm:px-3 py-1 rounded-full">
                <span className="text-amber-900 text-[10px] sm:text-xs font-semibold">
                  {totalQuestions - answeredQuestions} question{totalQuestions - answeredQuestions !== 1 ? 's' : ''} remaining
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-3 sm:p-6">
        <div className="grid lg:grid-cols-4 gap-4 lg:gap-8">
          {/* Assessment Navigation Sidebar - Hidden on mobile, collapsible */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-card rounded-lg border shadow-sm sticky top-6">
              <div className="p-3 sm:p-4 border-b">
                <h3 className="font-semibold text-sm sm:text-base text-foreground">Assessment Structure</h3>
              </div>
              
              <div className="p-3 sm:p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Assessment Info */}
                <div className="p-3 rounded-lg bg-muted border">
                  <div className="flex items-center gap-2">
                    <span className="text-primary">📋</span>
                    <span className="font-medium text-sm text-foreground">Assessment Progress</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {answeredQuestions}/{totalQuestions} questions completed
                  </p>
                </div>

                {/* Sections */}
                {assessment?.sections.map((section, sectionIndex) => (
                  <div key={section.id} className="bg-accent rounded-lg border">
                    <div className="p-3 border-b border-border">
                      <div className="flex items-center gap-2">
                        <span className="text-primary text-lg">📁</span>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm text-foreground">
                            {section.title}
                          </h4>
                          {section.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {section.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-2 space-y-1">
                      {section.questions.map((question, questionIndex) => {
                        const isAnswered = answers[question.id];
                        const isCurrent = sectionIndex === currentSectionIndex && questionIndex === currentQuestionIndex;
                        
                        return (
                          <div
                            key={question.id}
                            className={clsx(
                              "p-2 rounded cursor-pointer transition-all",
                              {
                                "bg-primary/10 border border-primary shadow-sm": isCurrent,
                                "bg-primary/5": isAnswered && !isCurrent,
                                "hover:bg-primary/5": !isCurrent,
                              }
                            )}
                            onClick={() => navigateToQuestion(sectionIndex, questionIndex)}
                          >
                            <div className="flex items-center gap-2">
                              <img 
                                src={`/question-type-${question.questionType.toLowerCase()}.svg`}
                                alt={`${question.questionType} icon`}
                                className="w-4 h-4"
                                onError={(e) => {
                                  e.currentTarget.src = question.questionType === 'RADIO' ? '/question-type-radio.svg' : '/question-type-checkbox.svg'
                                }}
                              />
                              <span className="text-sm font-medium text-foreground">
                                Q{questionIndex + 1}
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                Weight: {question.weight}
                              </span>
                              {isAnswered && (
                                <div className="w-2 h-2 bg-primary rounded-full ml-auto"></div>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {question.question || 'Untitled question'}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Question Area - Mobile Responsive */}
          <div className="lg:col-span-3 space-y-4 sm:space-y-6">
            {currentSection && currentQuestion && (
              <>
                {/* Section Info - Exam Paper Style - Mobile Responsive */}
                <div className="mb-4 sm:mb-6 border-b-2 border-dashed border-muted-foreground/20 pb-3 sm:pb-4">
                  <div className="bg-white/50 backdrop-blur-sm rounded-lg p-3 sm:p-4 border-l-4 border-primary/20 shadow-sm">
                    <div className="text-center mb-2 sm:mb-3">
                      <h1 className="text-lg sm:text-2xl font-bold text-foreground uppercase tracking-wide">
                        SECTION {currentSection.sectionNumber}
                      </h1>
                      <div className="w-12 sm:w-16 h-0.5 bg-primary/40 mx-auto mt-1 rounded"></div>
                    </div>
                    
                    <div className="text-center space-y-2">
                      <h2 className="text-base sm:text-lg font-semibold text-foreground">
                        {currentSection.title}
                      </h2>
                      
                      {currentSection.description && (
                        <div className="bg-muted/30 p-2 sm:p-3 rounded border-l-2 border-primary/20">
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed italic">
                            &quot;{currentSection.description}&quot;
                          </p>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-6 mt-3 sm:mt-4 text-[10px] sm:text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-primary/60 rounded-full"></div>
                          <span>Question {currentQuestionIndex + 1} of {currentSection.questions.length}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full"></div>
                          <span>Weight: {currentQuestion.weight} points</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Question Card */}
                <div className="flex justify-center">
                  <div className="w-full max-w-4xl">
                    <QuestionCard
                      question={currentQuestion}
                      value={answers[currentQuestion.id]}
                      onChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
                      disabled={isTimeUp}
                    />
                  </div>
                </div>

                {/* Navigation - Mobile Responsive */}
                <div className="mt-6 sm:mt-12 mb-4 sm:mb-8">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 py-4 sm:py-6">
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={(currentSectionIndex === 0 && currentQuestionIndex === 0) || isTimeUp}
                      size="lg"
                      className="w-full sm:w-auto px-6 sm:px-8 py-3 text-sm sm:text-base"
                    >
                      ← Previous
                    </Button>
                    
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                      {/* Show Next if not last question */}
                      {!(currentSectionIndex === (assessment?.sections.length || 0) - 1 && 
                        currentQuestionIndex === (currentSection?.questions.length || 0) - 1) && (
                        <Button 
                          onClick={handleNext}
                          disabled={isTimeUp}
                          size="lg"
                          className="w-full sm:w-auto px-6 sm:px-8 py-3 text-sm sm:text-base"
                        >
                          Next →
                        </Button>
                      )}
                      
                        {/* Always show submit button */}
                        <Button
                          onClick={handleSubmit}
                          disabled={submitAssessmentMutation.isPending || isTimeUp || !allQuestionsAnswered}
                          variant={allQuestionsAnswered ? "default" : "outline"}
                          size="lg"
                          className="w-full sm:w-auto px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold"
                        >
                          {isTimeUp 
                            ? "Time Expired" 
                            : submitAssessmentMutation.isPending 
                            ? "Submitting..." 
                            : !allQuestionsAnswered
                            ? `Answer All (${totalQuestions - answeredQuestions} left)`
                            : "Submit Assessment"
                          }
                        </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
