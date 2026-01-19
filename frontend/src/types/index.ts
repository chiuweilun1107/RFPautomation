/**
 * Type Definitions Index
 * Central export point for all type definitions
 */

// API Types
export type {
  ApiResponse,
  ApiError,
  PaginatedResponse,
  N8nWorkflowResponse,
  ChatMessage,
  ChatStreamResponse,
  SourceReference,
  RagGenerationResponse,
  DocumentGenerationResponse,
  CreateSourceRequest,
  SourceSummaryResponse,
  SourceSearchResult,
  WebhookResponse,
  ChapterIntegrationResponse,
  ImageGenerationResponse,
  ContentGenerationResponse,
  ExportRequest,
  TemplateStructureResponse,
  TemplateSection as ApiTemplateSection,
} from './api';

// Template Types
export type {
  DocumentFormat,
  TextRun,
  DocumentParagraph,
  TableColumn as DocumentTableColumn,
  TableCell,
  TableRow,
  DocumentTable,
  DocumentImage,
  DocumentSection,
  PageBreak,
  Template,
  TemplateStructure,
  TemplateStructureSection,
  DesignConfig,
  TemplateComponent,
  EditableParagraphProps,
  EditableTableProps,
  PropertyPanelProps,
  TemplateFolder,
  TemplateUploadMode,
} from './template';

// Content Types
export type {
  PageContent,
  PageMetadata,
  TableData,
  ImageData,
  SourceWithPages,
  SourceMetadata,
  HighlightText,
  Citation,
  Evidence,
  ParsedContent,
  ContentSection,
  AISearchResult,
  AssessmentContent,
  ContentWithCitations,
  CleanedPageContent,
} from './content';

// UI Types
export type {
  DialogProps,
  ButtonVariant,
  ButtonSize,
  BadgeVariant,
  AlertVariant,
  TabValue,
  DragHandleProps,
  ToastOptions,
  SelectOption,
  TableColumn,
  PaginationState,
  SortState,
  FilterState,
  FormFieldProps,
  UploadFileStatus,
  BreadcrumbItem,
  MenuItem,
  SkeletonProps,
  TooltipProps,
  ModalProps,
  CardProps,
  LoadingState,
  ErrorState,
  EditableFieldState,
  CollapsibleState,
  SearchState,
  DragEndEvent,
  DragStartEvent,
  BaseComponentProps,
} from './ui';

// Supabase Database Types
export * from './supabase';
