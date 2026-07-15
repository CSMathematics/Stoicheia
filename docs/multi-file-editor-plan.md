# Multi-file editor with tabs

## Goal

Add support for multiple open `.tex` documents in editor tabs while keeping every document's source, undo history, save state, diagnostics, and preview isolated.

The first version should be a focused multi-document editor, not a complete TeX project manager. Project trees, cross-file `\\input{}` resolution, split editors, and simultaneous previews can follow later.

## Benefits

- Users can work on several constructions without repeatedly opening and closing files.
- Experiments and alternate versions can live in separate tabs.
- Dirty state, autosave, recent files, and recovery can be tracked per document.
- The model provides a foundation for templates, examples, and full TeX projects later.
- Each tab can keep its own undo/redo history, reducing the risk of accidental data loss.

## Risks and constraints

- The current application state is centered on one source document and one active preview.
- Parser, geometry resolution, object tree, inspector, diagnostics, and canvas must always follow the active tab.
- Undo/redo must be local to each document.
- Save targets and browser/Tauri file handles must not leak between tabs.
- Background parsing of every open file could waste CPU and memory.
- Closing a dirty tab needs an explicit save/discard/cancel flow.

## Proposed document model

```ts
interface OpenDocument {
  id: string
  filename: string
  source: string
  savedSource: string
  sourceHistory: string[]
  sourceRedoStack: string[]
  saveTarget?: SaveTarget
  parsedNodes: AstNode[]
  resolvedPoints: Record<string, Point>
  compiledSource: string
  svgOutput: string | null
  errorLog: string | null
  updatedAt: number
}
```

Application-wide preferences such as theme, language, compiler settings, toolbar layout, and style profiles remain global.

## Implementation phases

### 1. Store migration

- Add `documents: OpenDocument[]` and `activeDocumentId` to the store.
- Make source editing, command insertion, selection, undo, and redo target the active document.
- Add actions for create, open, activate, rename, mark saved, and close document.
- Keep selectors small so components subscribe only to the active fields they use.
- Include a migration path for the current single-document persisted state.

### 2. Editor tabs

- Place a compact tab strip directly above the source editor.
- Show filename, dirty indicator, active state, and close button.
- Add a `New document` icon button and keyboard-accessible tab navigation.
- Use horizontal scrolling when tabs do not fit; keep the editor width stable.
- Prompt with save, discard, and cancel when closing a dirty document.

### 3. File menu integration

- `New` creates and activates a new tab.
- `Open` focuses an already-open file or opens it in a new tab.
- `Save` and `Save As` affect only the active document.
- Recent files focus an existing tab before creating another copy.
- Window title and status bar reflect the active document and dirty state.

### 4. Parser and preview lifecycle

- Parse and render only the active document in the MVP.
- On tab switch, restore cached AST/geometry/diagnostics immediately when available.
- Schedule a refresh only when the source or relevant compiler settings changed.
- Ensure stale asynchronous parser/compiler responses cannot overwrite a newly active tab.
- Object tree, inspector, toolbar actions, and canvas selection always target the active document ID.

### 5. Autosave and recovery

- Store recovery snapshots by stable document ID and normalized file path.
- Restore all recoverable tabs after an unexpected shutdown.
- Remove a recovery snapshot after a successful save or intentional discard.
- Apply retention limits so abandoned untitled documents do not grow storage indefinitely.

### 6. Keyboard and usability

- Add shortcuts for new tab, close tab, next/previous tab, and direct tab selection.
- Keep existing undo/redo shortcuts scoped to the active tab.
- Preserve editor cursor and scroll position per document.
- Display compiler activity and errors on the corresponding tab without interrupting the active one.

### 7. Verification

- Test source and undo/redo isolation between tabs.
- Test create, switch, reorder, and close flows.
- Test dirty indicators and the close confirmation choices.
- Test save targets, recent files, autosave, and recovery per document.
- Test that command insertion modifies only the active document.
- Test stale parser/compiler responses during rapid tab switching.
- Test tab overflow and keyboard navigation at desktop and narrow widths.

## Recommended delivery order

1. Store model and isolated undo/redo.
2. Tab strip and active-document switching.
3. Open/save/recent-file integration.
4. Parser and preview cancellation/caching.
5. Autosave and crash recovery.
6. Keyboard navigation, polish, and accessibility.

## Deferred features

- Full TeX project tree and root-document selection.
- Cross-file dependency tracking for `\\input{}` and `\\include{}`.
- Split editor panes.
- Multiple previews rendered at the same time.
- Session sharing or collaborative editing.

