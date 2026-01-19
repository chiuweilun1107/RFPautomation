/**
 * UI Component Types
 * Type definitions for UI components, props, and state
 */

import type { ReactNode } from 'react';

// Dialog Props
export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: ReactNode;
  title?: string;
  description?: string;
}

// Button Variants
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

// Badge Variants
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

// Alert Variants
export type AlertVariant = 'default' | 'destructive';

// Tab Value
export type TabValue = string;

// Drag Handle Props (from dnd-kit)
export interface DragHandleProps {
  attributes?: Record<string, unknown>;
  listeners?: Record<string, unknown>;
  ref?: React.RefObject<HTMLElement>;
}

// Toast Options
export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
}

// Select Option
export interface SelectOption<T = string> {
  label: string;
  value: T;
  disabled?: boolean;
}

// Table Column Definition
export interface TableColumn<T = unknown> {
  id: string;
  header: string;
  accessor: keyof T | ((row: T) => unknown);
  cell?: (value: unknown, row: T) => ReactNode;
  width?: string | number;
  sortable?: boolean;
  filterable?: boolean;
}

// Pagination State
export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

// Sort State
export interface SortState<T = string> {
  field: T;
  direction: 'asc' | 'desc';
}

// Filter State
export interface FilterState<T = string> {
  field: T;
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
  value: unknown;
}

// Form Field Props
export interface FormFieldProps {
  name: string;
  label?: string;
  placeholder?: string;
  description?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

// Upload File Status
export interface UploadFileStatus {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  id?: string;
}

// Breadcrumb Item
export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ReactNode;
  current?: boolean;
}

// Menu Item
export interface MenuItem {
  id: string;
  label: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  divider?: boolean;
  children?: MenuItem[];
}

// Skeleton Props
export interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  circle?: boolean;
  count?: number;
}

// Tooltip Props
export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
}

// Modal Props
export interface ModalProps extends DialogProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  showCloseButton?: boolean;
}

// Card Props
export interface CardProps {
  title?: string;
  description?: string;
  footer?: ReactNode;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

// Loading State
export interface LoadingState {
  loading: boolean;
  progress?: number;
  message?: string;
}

// Error State
export interface ErrorState {
  error: boolean;
  message?: string;
  code?: string | number;
  details?: unknown;
}

// Editable Field State
export interface EditableFieldState {
  editing: boolean;
  value: string;
  originalValue: string;
}

// Collapsible State
export interface CollapsibleState {
  open: boolean;
  toggle: () => void;
}

// Search State
export interface SearchState {
  query: string;
  results: unknown[];
  loading: boolean;
  error?: string;
}

// Drag and Drop Types
export interface DragEndEvent {
  active: {
    id: string | number;
    data?: Record<string, unknown>;
  };
  over: {
    id: string | number;
    data?: Record<string, unknown>;
  } | null;
  delta: {
    x: number;
    y: number;
  };
}

export interface DragStartEvent {
  active: {
    id: string | number;
    data?: Record<string, unknown>;
  };
}

// Generic Component Props
export interface BaseComponentProps {
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
  id?: string;
  'data-testid'?: string;
}
