import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { AppHeader } from './AppHeader';
import { DEFAULT_APP_SETTINGS, useEditorStore } from '../store';

const renderHeader = (props: Partial<Parameters<typeof AppHeader>[0]> = {}) => {
  const defaults = {
    showEditor: true,
    showInspector: true,
    sourcePanelMode: 'source' as const,
    activePage: 'workspace' as const,
    onOpenSettings: vi.fn(),
    onOpenSource: vi.fn(),
    onOpenStyles: vi.fn(),
    onOpenCommandPalette: vi.fn(),
    onToggleEditor: vi.fn(),
    onToggleInspector: vi.fn(),
  };
  return { props: { ...defaults, ...props }, view: render(<AppHeader {...defaults} {...props} />) };
};

const listenerCallCount = (
  spy: { mock: { calls: unknown[][] } },
  eventName: string,
) => spy.mock.calls.filter(call => call[0] === eventName).length;

describe('AppHeader', () => {
  beforeEach(() => {
    useEditorStore.setState({
      settings: { ...DEFAULT_APP_SETTINGS },
      theme: DEFAULT_APP_SETTINGS.theme,
      documentFilename: 'source.tex',
      source: '\\begin{tikzpicture}\n\\tkzDrawSegment(A,B)\n\\end{tikzpicture}',
      sourceHistory: [],
      sourceRedoStack: [],
      autosaveError: null,
      svgOutput: '<svg />',
      previewMode: 'instant',
      showGrid: true,
      snapToGrid: true,
      activeTool: 'cursor',
      selectedPoints: ['A'],
      selectedNode: 'segment_A_B',
      parsedNodes: [{ type: 'Segment', p1: 'A', p2: 'B' }],
    });
  });

  afterEach(() => {
    delete window.showOpenFilePicker;
  });

  it('opens source/style views and toggles canvas options from the View menu', () => {
    const onOpenStyles = vi.fn();
    renderHeader({ onOpenStyles });

    fireEvent.click(screen.getByRole('button', { name: /View/ }));
    const menu = screen.getByRole('menu');
    fireEvent.click(within(menu).getByRole('menuitemcheckbox', { name: /Style manager/ }));
    expect(onOpenStyles).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: /View/ }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: /LaTeX preview/ }));
    expect(useEditorStore.getState().previewMode).toBe('latex');

    fireEvent.click(screen.getByRole('button', { name: /View/ }));
    fireEvent.click(screen.getByRole('menuitemcheckbox', { name: /Canvas grid/ }));
    expect(useEditorStore.getState().showGrid).toBe(false);
  });

  it('selects common tools from Insert and deletes the selected object from Edit', () => {
    renderHeader();

    fireEvent.click(screen.getByRole('button', { name: /Insert/ }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Segment/ }));
    expect(useEditorStore.getState().activeTool).toBe('add_segment');

    fireEvent.click(screen.getByRole('button', { name: /Edit/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Delete selected object/ }));
    expect(useEditorStore.getState().source).not.toContain('\\tkzDrawSegment(A,B)');
    expect(useEditorStore.getState().selectedNode).toBeNull();
  });

  it('undoes and redoes source changes from Edit and keyboard shortcuts', () => {
    renderHeader();
    const initialSource = useEditorStore.getState().source;
    const editedSource = `${initialSource}\n% edit`;

    useEditorStore.getState().setSource(editedSource);

    fireEvent.click(screen.getByRole('button', { name: /Edit/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Undo/ }));
    expect(useEditorStore.getState().source).toBe(initialSource);

    fireEvent.click(screen.getByRole('button', { name: /Edit/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Redo/ }));
    expect(useEditorStore.getState().source).toBe(editedSource);

    fireEvent.keyDown(window, { key: 'z', ctrlKey: true });
    expect(useEditorStore.getState().source).toBe(initialSource);

    fireEvent.keyDown(window, { key: 'Z', ctrlKey: true, shiftKey: true });
    expect(useEditorStore.getState().source).toBe(editedSource);
  });

  it('lets focused editable fields handle undo and redo shortcuts', () => {
    renderHeader();
    const initialSource = useEditorStore.getState().source;
    const editedSource = `${initialSource}\n% edit`;
    useEditorStore.getState().setSource(editedSource);

    const input = document.createElement('input');
    input.value = 'local field text';
    document.body.appendChild(input);
    input.focus();

    expect(fireEvent.keyDown(input, { key: 'z', ctrlKey: true })).toBe(true);
    expect(useEditorStore.getState().source).toBe(editedSource);

    document.body.removeChild(input);
  });

  it('lets Monaco editor targets handle undo and redo shortcuts', () => {
    renderHeader();
    const initialSource = useEditorStore.getState().source;
    const editedSource = `${initialSource}\n% edit`;
    useEditorStore.getState().setSource(editedSource);

    const editor = document.createElement('div');
    editor.className = 'monaco-editor';
    const textarea = document.createElement('textarea');
    editor.appendChild(textarea);
    document.body.appendChild(editor);
    textarea.focus();

    expect(fireEvent.keyDown(textarea, { key: 'z', ctrlKey: true })).toBe(true);
    expect(useEditorStore.getState().source).toBe(editedSource);

    document.body.removeChild(editor);
  });

  it('creates style setup shortcuts from the Styles menu', () => {
    const onOpenStyles = vi.fn();
    renderHeader({ onOpenStyles });

    fireEvent.click(screen.getByRole('button', { name: /Styles/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Enable line defaults/ }));

    expect(useEditorStore.getState().source).toContain('\\tkzSetUpLine');
    expect(onOpenStyles).toHaveBeenCalledOnce();
  });

  it('uses quick header toggles for preview, grid and snap', () => {
    renderHeader();

    fireEvent.click(screen.getByRole('button', { name: 'Switch to LaTeX preview' }));
    expect(useEditorStore.getState().previewMode).toBe('latex');

    fireEvent.click(screen.getByRole('button', { name: 'Toggle canvas grid' }));
    fireEvent.click(screen.getByRole('button', { name: 'Toggle snap to grid' }));
    expect(useEditorStore.getState().showGrid).toBe(false);
    expect(useEditorStore.getState().snapToGrid).toBe(false);
  });

  it('shows autosave failures in the status pill', () => {
    useEditorStore.setState({ autosaveError: 'Local storage quota exceeded' });
    renderHeader();

    expect(screen.getByText('Autosave failed')).toHaveAttribute('title', 'Local storage quota exceeded');
  });

  it('shows a clear dirty indicator when the source has unsaved changes', () => {
    renderHeader();

    act(() => useEditorStore.getState().setSource(`${useEditorStore.getState().source}\n% changed`));

    const filePill = screen.getByLabelText('source.tex unsaved changes');
    expect(filePill).toHaveClass('app-file-pill-dirty');
    expect(filePill).toHaveTextContent('*');
  });

  it('opens a file through the picker and saves back to the same handle', async () => {
    const write = vi.fn().mockResolvedValue(undefined);
    const close = vi.fn().mockResolvedValue(undefined);
    const file = new File(['opened source'], 'opened.tex', { type: 'application/x-tex' });
    const handle = {
      name: 'opened.tex',
      getFile: vi.fn().mockResolvedValue(file),
      createWritable: vi.fn().mockResolvedValue({ write, close }),
    };
    window.showOpenFilePicker = vi.fn().mockResolvedValue([handle]);
    renderHeader();

    fireEvent.click(screen.getByRole('button', { name: /File/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Open/ }));

    expect(await screen.findByText('opened.tex')).toBeInTheDocument();

    act(() => useEditorStore.getState().setSource('changed source'));

    fireEvent.click(screen.getByRole('button', { name: /File/ }));
    fireEvent.click(within(screen.getByRole('menu')).getAllByRole('menuitem', { name: /Save/ })[0]);

    await vi.waitFor(() => expect(write).toHaveBeenCalledWith('changed source'));
    expect(close).toHaveBeenCalledOnce();
  });

  it('opens the command palette from the header and Help menu', () => {
    const onOpenCommandPalette = vi.fn();
    renderHeader({ onOpenCommandPalette });

    fireEvent.click(screen.getByRole('button', { name: /Command/ }));
    expect(onOpenCommandPalette).toHaveBeenCalledOnce();

    fireEvent.click(screen.getByRole('button', { name: /Help/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /Command palette/ }));
    expect(onOpenCommandPalette).toHaveBeenCalledTimes(2);
  });

  it('shows the tkz-euclide compatibility version in About Stoicheia', () => {
    renderHeader();

    fireEvent.click(screen.getByRole('button', { name: /Help/ }));
    fireEvent.click(screen.getByRole('menuitem', { name: /About Stoicheia/ }));

    expect(screen.getByRole('status')).toHaveTextContent('tkz-euclide 5.13c');
  });

  it('does not let an older notification timeout dismiss a newer notification', async () => {
    vi.useFakeTimers();
    try {
      renderHeader();

      fireEvent.click(screen.getByRole('button', { name: /Help/ }));
      fireEvent.click(screen.getByRole('menuitem', { name: /Keyboard shortcuts/ }));
      expect(screen.getByRole('status')).toHaveTextContent('Shortcuts');

      await act(async () => vi.advanceTimersByTimeAsync(4000));

      fireEvent.click(screen.getByRole('button', { name: /Help/ }));
      fireEvent.click(screen.getByRole('menuitem', { name: /About Stoicheia/ }));
      expect(screen.getByRole('status')).toHaveTextContent('tkz-euclide 5.13c');

      await act(async () => vi.advanceTimersByTimeAsync(600));
      expect(screen.getByRole('status')).toHaveTextContent('tkz-euclide 5.13c');
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not reinstall global keyboard listeners when only the source changes', () => {
    const addEventListener = vi.spyOn(window, 'addEventListener');
    const removeEventListener = vi.spyOn(window, 'removeEventListener');
    try {
      renderHeader();
      const initialKeydownAdds = listenerCallCount(addEventListener, 'keydown');
      const initialPointerAdds = listenerCallCount(addEventListener, 'pointerdown');

      act(() => useEditorStore.getState().setSource('changed source'));

      expect(listenerCallCount(addEventListener, 'keydown')).toBe(initialKeydownAdds);
      expect(listenerCallCount(addEventListener, 'pointerdown')).toBe(initialPointerAdds);
      expect(listenerCallCount(removeEventListener, 'keydown')).toBe(0);
      expect(listenerCallCount(removeEventListener, 'pointerdown')).toBe(0);
    } finally {
      addEventListener.mockRestore();
      removeEventListener.mockRestore();
    }
  });
});
