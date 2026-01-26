# Tender Planning Module - Refactored Architecture

## Overview

This directory contains the refactored TenderPlanning component, broken down from a monolithic 1459-line component into a modular, maintainable architecture.

## 📁 Directory Structure

```
tender-planning/
├── README.md                           # This file
├── REFACTORING_SUMMARY.md             # Refactoring details and changes
├── types.ts                            # All TypeScript type definitions
├── index.tsx                           # Main container component (< 300 lines)
│
├── hooks/                              # Custom React hooks
│   ├── index.ts                        # Barrel export for all hooks
│   ├── useTenderState.ts              # Core state management
│   ├── useTenderData.ts               # Data fetching from Supabase
│   ├── useTenderOperations.ts         # CRUD operations
│   ├── useDragDrop.ts                 # Drag & drop functionality
│   ├── useDialogState.ts              # Dialog state management
│   ├── useAIGeneration.ts             # AI generation workflows
│   └── useSaveOperations.ts           # Save logic
│
├── components/                         # UI Components
│   ├── index.ts                        # Barrel export for all components
│   ├── DraggableTaskPopup.tsx         # Task detail popup
│   ├── TaskItem.tsx                   # Task list item
│   ├── GenerationBadge.tsx            # Generation method badge
│   ├── SortableChapterItem.tsx        # Draggable chapter component
│   ├── SortableSectionItem.tsx        # Draggable section component
│   ├── TenderHeader.tsx               # Page header
│   ├── TenderToolbar.tsx              # Action toolbar
│   ├── ChapterList.tsx                # Chapter list container
│   └── TenderDialogs.tsx              # All dialogs container
│
└── utils/                              # Utility functions
    ├── index.ts                        # Barrel export
    └── sectionHelpers.ts              # Section operations helpers
```

## ✅ Key Features

### Hierarchical Structure Management
- **Chapter/Section Tree**: Two-level hierarchy with drag-and-drop support
- **Task Management**: Tasks organized under sections with detailed views
- **Collapsible UI**: Expandable/collapsible chapters and sections

### AI-Powered Generation
- **Structure Generation (WF04)**: Generate entire chapter structure from sources
- **Sub-section Generation (WF10)**: Generate sections within a chapter
- **Task Generation (WF11/WF13)**: Generate functional or content tasks

### CRUD Operations
- Add/edit/delete chapters, sections, and tasks
- Drag-and-drop reordering
- Batch save with deleted item tracking

### Source Selection
- Multi-source selection for AI generation
- Context-aware source filtering
- Integration with project knowledge base

## 🎯 Design Principles

1. **Single Responsibility**: Each hook/component handles one concern
2. **Type Safety**: Full TypeScript coverage with strict typing
3. **Testability**: Hooks and utilities can be tested in isolation
4. **Maintainability**: No file exceeds 200 lines (except index.tsx at ~290 lines)
5. **Performance**: Use of useMemo, useCallback where appropriate

## 📊 Refactoring Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Total Lines | 1459 | ~2000 (distributed) | N/A |
| Largest File | 1459 | 290 (index.tsx) | 80% reduction |
| Number of Files | 1 | 24 | Modularized |
| Testability | Low | High | Isolated units |
| Maintainability | Low | High | Clear separation |

## 🔧 Usage Example

```typescript
import { TenderPlanning } from '@/components/workspace/tender-planning';

function ProjectWorkspace() {
  return (
    <TenderPlanning
      projectId="your-project-id"
      onNextStage={() => console.log('Next')}
      onPrevStage={() => console.log('Previous')}
    />
  );
}
```

## 🧪 Testing Strategy

### Unit Tests
- Test each hook individually
- Test component rendering and interactions
- Test utility functions

### Integration Tests
- Test data flow between hooks
- Test dialog workflows
- Test AI generation flows

### E2E Tests
- Test complete CRUD workflows
- Test drag-and-drop functionality
- Test save/load operations

## 🚀 Performance Optimizations

1. **Memoization**: All callbacks and expensive computations memoized
2. **Lazy Loading**: Dialogs loaded on-demand
3. **Optimistic Updates**: UI updates immediately, syncs to DB later
4. **Virtualization**: (Future) Long lists virtualized for performance

## 🔄 Migration Notes

### Breaking Changes
**None.** This is an internal refactor with no API changes.

### Import Path Changes
```typescript
// Before
import { TenderPlanning } from '@/components/workspace/TenderPlanning';

// After
import { TenderPlanning } from '@/components/workspace/tender-planning';
```

## 🛠️ Development Guidelines

### Adding New Features

1. **Define Types First**: Add interfaces to `types.ts`
2. **Create Hook**: If business logic, create a new hook
3. **Create Component**: If UI-related, create a new component
4. **Keep It Small**: Aim for < 200 lines per file
5. **Document**: Add JSDoc comments to all public APIs

### Code Style

- Use functional components and hooks
- Prefer composition over inheritance
- Use TypeScript strict mode
- Follow existing naming conventions
- Add comments for complex logic

## 📚 Related Documentation

- [ProposalStructureEditor](../proposal-editor/README.md) - Similar refactored component
- [Design System](../../design/README.md) - UI component guidelines
- [Testing Guide](../../../docs/testing.md) - Testing best practices

## 🐛 Known Issues

None currently. This is a fresh refactor with full feature parity.

## 🔮 Future Improvements

1. **Performance**: Add virtualization for large outlines
2. **Offline Support**: Add local-first state management
3. **Undo/Redo**: Implement command pattern for history
4. **Keyboard Shortcuts**: Add power-user keyboard navigation
5. **Accessibility**: Enhance ARIA labels and keyboard navigation

## 📝 Changelog

### v2.0.0 (2026-01-26)
- **BREAKING**: Refactored from monolithic component
- Split into modular architecture (24 files)
- Improved type safety and testability
- Zero functionality loss
- Full backward compatibility

### v1.0.0 (Original)
- Monolithic 1459-line component
- All functionality in single file
