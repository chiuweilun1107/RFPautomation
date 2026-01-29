import { Card, CardContent } from '@/components/ui/card';
import { Evidence } from './CitationBadge';
import { SourceDetailPanel } from './SourceDetailPanel';
import {
  Loader2,
  AlertCircle,
  Sparkles,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { RecursiveAssessmentRenderer } from './RecursiveAssessmentRenderer';
import { createPortal } from 'react-dom';
import { useDraggableDialog } from '@/hooks';
import { useAssessmentState } from './hooks/useAssessmentState';

interface AssessmentTableProps {
  projectId: string;
  onNextStage?: () => void;
}

/**
 * AssessmentTable - Displays project assessment with AI analysis capabilities
 *
 * Features:
 * - Tabbed navigation for different assessment sections
 * - Citation/evidence tracking with draggable detail panel
 * - Real-time updates via Supabase subscription
 * - AI analysis workflow triggering
 */
export function AssessmentTable({ projectId, onNextStage }: AssessmentTableProps) {
  // Assessment state management
  const {
    data,
    evidences,
    selectedEvidence,
    selectedSource,
    error,
    isAnalyzing,
    activeTab,
    isHeaderExpanded,
    displayKeys,
    setActiveTab,
    setIsHeaderExpanded,
    handleStartAnalysis,
    handleCitationClick,
    closeEvidencePanel,
  } = useAssessmentState(projectId);

  // Draggable dialog for citation details
  const {
    isDragging,
    handleMouseDown,
    dialogStyle,
    setPosition,
  } = useDraggableDialog({
    initialPosition: { x: 40, y: 150 },
    dialogWidth: 580,
    handleHeight: 24,
  });

  // Handle citation click with position reset
  const onCitationClick = async (evidence: Evidence) => {
    await handleCitationClick(evidence);
    setPosition({ x: 40, y: 150 });
  };

  // Error state
  if (error) {
    return (
      <div className="border border-red-600 p-8 flex flex-col items-center justify-center space-y-4 bg-red-50 dark:bg-red-950/20 font-mono">
        <AlertCircle className="h-8 w-8 text-red-600" />
        <div className="text-center">
          <p className="text-red-600 font-black uppercase tracking-tighter">
            System_Error: Connection_Failed
          </p>
          <p className="text-[10px] opacity-60 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state - no assessment data
  if (!data) {
    return (
      <EmptyState
        isAnalyzing={isAnalyzing}
        onStartAnalysis={handleStartAnalysis}
      />
    );
  }

  return (
    <>
      <div className="h-full w-full">
        <div className="flex w-full min-h-full gap-8 relative font-mono text-black dark:text-white pb-20">
          {/* Main Content Area */}
          <div className="flex-1">
            {/* Sticky Header Container */}
            <AssessmentHeader
              isHeaderExpanded={isHeaderExpanded}
              setIsHeaderExpanded={setIsHeaderExpanded}
              isAnalyzing={isAnalyzing}
              onStartAnalysis={handleStartAnalysis}
              onNextStage={onNextStage}
              displayKeys={displayKeys}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              data={data}
            />

            {/* Content Area with Single Focused Card */}
            {displayKeys.map((key) => {
              if (activeTab !== key) return null;
              return (
                <div
                  key={key}
                  className="mt-0 outline-none animate-in fade-in slide-in-from-bottom-2 duration-300"
                >
                  <Card className="rounded-none border-0 bg-transparent shadow-none">
                    <CardContent className="pt-12 pb-16 px-0 md:px-4">
                      <div className="max-w-4xl mx-auto">
                        {isAnalyzing && <AnalyzingIndicator />}
                        <div className="h-full w-full">
                          <RecursiveAssessmentRenderer
                            data={
                              (data[key] as Record<string, unknown> | undefined)
                                ?.content || data[key]
                            }
                            evidences={evidences}
                            onCitationClick={onCitationClick}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Draggable Non-modal Dialog for Citation Details */}
      {selectedEvidence &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed z-[9999] pointer-events-none"
            style={dialogStyle}
          >
            <div className="pointer-events-auto border-2 border-black dark:border-white rounded-none bg-white dark:bg-black font-mono shadow-[24px_24px_0px_0px_rgba(0,0,0,1)] dark:shadow-[24px_24px_0px_0px_rgba(255,255,255,0.2)] w-[580px] h-[80vh] flex flex-col shadow-xl">
              <div
                className="bg-[#FA4028] h-4 cursor-move hover:h-6 transition-all flex items-center justify-center border-b-2 border-black dark:border-white shrink-0"
                onMouseDown={handleMouseDown}
              >
                <div className="flex gap-1.5">
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                  <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                </div>
              </div>
              <div className="flex-1 min-h-0 overflow-hidden">
                <SourceDetailPanel
                  evidence={selectedEvidence}
                  source={selectedSource}
                  onClose={closeEvidencePanel}
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

interface EmptyStateProps {
  isAnalyzing: boolean;
  onStartAnalysis: () => Promise<void>;
}

/**
 * Empty state shown when no assessment data exists
 */
function EmptyState({ isAnalyzing, onStartAnalysis }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] border border-black dark:border-white bg-white dark:bg-black p-12 text-center font-mono relative overflow-hidden group">
      {/* Decorative Grid Background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />

      {/* Visual Asset */}
      <div className="relative w-72 h-72 mb-12 grayscale hover:grayscale-0 transition-all duration-700 ease-in-out">
        <div className="absolute inset-0 border border-black/10 dark:border-white/10 -m-4 group-hover:m-0 transition-all duration-500" />
        <Image
          src="/carousel-2-analysis-retro.png"
          fill
          sizes="288px"
          className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
          alt="AI Analysis Engine"
        />
      </div>

      <h3 className="text-4xl font-black uppercase tracking-tighter mb-4 italic flex items-center gap-3">
        <Sparkles className="h-8 w-8 text-[#FA4028]" />
        Ready_for_Intelligence
      </h3>

      <p className="text-[10px] text-muted-foreground uppercase tracking-[0.3em] leading-loose max-w-md mb-8">
        System_Status: Awaiting_Data_Ingestion
        <br />
        No active assessment sequence detected for this project identifier.
        <br />
        The AI engine is primed and ready to deconstruct your documentation.
      </p>

      <Button
        onClick={onStartAnalysis}
        disabled={isAnalyzing}
        className="rounded-none bg-[#FA4028] hover:bg-black text-white px-12 py-7 font-black italic text-lg tracking-tighter transition-all hover:scale-105 active:scale-95 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="mr-2 h-6 w-6 animate-spin" />
            ANALYZING...
          </>
        ) : (
          'START_AI_DECONSTRUCTION'
        )}
      </Button>

      <div className="mt-8 text-[8px] opacity-30 uppercase tracking-widest font-mono">
        Protocol: WF02-EVALUATION // Auth: Verified
      </div>
    </div>
  );
}

interface AssessmentHeaderProps {
  isHeaderExpanded: boolean;
  setIsHeaderExpanded: (expanded: boolean) => void;
  isAnalyzing: boolean;
  onStartAnalysis: () => Promise<void>;
  onNextStage?: () => void;
  displayKeys: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  data: Record<string, unknown>;
}

/**
 * Sticky header with title, navigation, and tabs
 */
function AssessmentHeader({
  isHeaderExpanded,
  setIsHeaderExpanded,
  isAnalyzing,
  onStartAnalysis,
  onNextStage,
  displayKeys,
  activeTab,
  setActiveTab,
  data,
}: AssessmentHeaderProps) {
  return (
    <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-4 pb-0 mb-4 border-b border-black/5 dark:border-white/5 transition-all duration-300">
      {/* Collapse Toggle Button */}
      <div className="absolute top-4 right-8 z-30">
        <button
          onClick={() => setIsHeaderExpanded(!isHeaderExpanded)}
          className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
        >
          {isHeaderExpanded ? (
            <ChevronUp className="w-5 h-5 text-black/40 dark:text-white/40" />
          ) : (
            <ChevronDown className="w-5 h-5 text-black/40 dark:text-white/40" />
          )}
        </button>
      </div>

      {/* Collapsible Title Area */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isHeaderExpanded
            ? 'max-h-[200px] opacity-100 mb-8'
            : 'max-h-0 opacity-0 mb-0'
        }`}
      >
        <div className="flex flex-col items-center">
          <div className="relative inline-flex items-center">
            {/* Re-analyze Button (Left) */}
            <div className="absolute -left-20 top-1/2 -translate-y-1/2">
              <button
                onClick={onStartAnalysis}
                disabled={isAnalyzing}
                title="RE-ANALYZE"
                className="group relative w-12 h-12 border-2 border-black dark:border-white bg-white dark:bg-black transition-all hover:translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 shadow-[-4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[-4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[-8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[-8px_8px_0px_0px_rgba(255,255,255,1)] active:shadow-none flex items-center justify-center overflow-hidden"
              >
                {isAnalyzing ? (
                  <Loader2 className="w-5 h-5 animate-spin text-black dark:text-white" />
                ) : (
                  <Sparkles className="w-6 h-6 text-black dark:text-white transition-transform group-hover:scale-110" />
                )}
                <div className="absolute inset-0 bg-[#FA4028] translate-y-full group-hover:translate-y-0 transition-transform duration-300 -z-10 opacity-10" />
              </button>
            </div>

            {/* Title Block */}
            <div className="bg-[#FA4028] text-white px-10 py-4 flex flex-col items-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] dark:shadow-[6px_6px_0px_0px_rgba(255,255,255,0.2)]">
              <h2 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
                PROJECT_ASSESSMENT
              </h2>
            </div>

            {/* Next Navigation Arrow */}
            {onNextStage && (
              <div className="absolute -right-20 top-1/2 -translate-y-1/2">
                <button
                  onClick={onNextStage}
                  className="group relative w-12 h-12 border-2 border-black dark:border-white bg-white dark:bg-black transition-all hover:-translate-x-1 hover:-translate-y-1 active:translate-x-0 active:translate-y-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] dark:shadow-[4px_4px_0px_0px_rgba(255,255,255,1)] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:hover:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] active:shadow-none flex items-center justify-center overflow-hidden"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-6 h-6 fill-none stroke-black dark:stroke-white stroke-[3] transition-transform group-hover:translate-x-1"
                  >
                    <path
                      d="M5 12h14M12 5l7 7-7 7"
                      strokeLinecap="square"
                      strokeLinejoin="miter"
                    />
                  </svg>
                  <div className="absolute inset-0 bg-[#FA4028] translate-y-full group-hover:translate-y-0 transition-transform duration-300 -z-10 opacity-10" />
                </button>
              </div>
            )}
          </div>
          <p className="mt-4 text-[10px] uppercase tracking-[0.2em] font-bold opacity-50">
            Stage 01 // Requirement Analysis & Strategy
          </p>
        </div>
      </div>

      {/* Centered Tabs List - Always Visible */}
      <div className="flex justify-center w-full overflow-x-auto pb-2">
        <div className="h-auto bg-transparent rounded-none p-0 gap-10 flex">
          {displayKeys.map((key) => {
            const tabData = data[key] as Record<string, unknown> | undefined;
            const label =
              (tabData?.label as string) || key.replace(/_/g, ' ').toUpperCase();
            const displayLabel = label.split('_')[0];
            const isActive = activeTab === key;

            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`
                  rounded-none border-b-2 px-1 py-4 text-[11px] font-black uppercase tracking-[0.2em] transition-all bg-transparent shadow-none italic
                  ${
                    isActive
                      ? 'border-[#FA4028] text-[#FA4028] opacity-100'
                      : 'border-transparent text-foreground hover:text-[#FA4028] opacity-60'
                  }
                `}
              >
                {displayLabel}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Analyzing indicator shown during AI analysis
 */
function AnalyzingIndicator() {
  return (
    <div className="mb-8 p-4 bg-[#FA4028]/5 border-l-4 border-[#FA4028] flex items-center gap-3 animate-pulse">
      <Loader2 className="w-4 h-4 animate-spin text-[#FA4028]" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#FA4028]">
        Analysis in Progress // background sequence active
      </span>
    </div>
  );
}
