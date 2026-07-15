import { act, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_APP_SETTINGS, useEditorStore } from '../store';
import { useDocumentPipeline } from './useDocumentPipeline';

const invokeMock = vi.hoisted(() => vi.fn());

vi.mock('@tauri-apps/api/core', () => ({
  invoke: invokeMock,
}));

function PipelineHarness() {
  useDocumentPipeline();
  return null;
}

describe('useDocumentPipeline', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    invokeMock.mockReset();
    useEditorStore.setState({
      source: 'source A',
      settings: { ...DEFAULT_APP_SETTINGS },
      previewMode: DEFAULT_APP_SETTINGS.previewMode,
      parsedNodes: [],
      parsedSource: '',
      resolvedPoints: null,
      resolvedViewport: null,
      geometryDiagnostics: [],
      performanceMetrics: null,
      svgOutput: null,
      compiledSource: null,
      errorLog: null,
      isCompiling: false,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('parses quickly and compiles the same source after the longer debounce', async () => {
    useEditorStore.setState({ previewMode: 'latex' });
    invokeMock.mockImplementation((command: string) => {
      if (command === 'parse_tikz') {
        return Promise.resolve({
          nodes: [{ type: 'Point', name: 'A', x: 1, y: 2 }],
          resolved_points: { A: { x: 1, y: 2 } },
          geometry_complete: true,
          viewport: { viewBox: '0 0 10 10' },
          timings: {
            parseMs: 0.2,
            geometryMs: 0.3,
            viewportMs: 0.1,
            totalMs: 0.7,
            nodeCount: 1,
            resolvedPointCount: 1,
          },
        });
      }
      return Promise.resolve({ success: true, svg: '<svg viewBox="0 0 10 10"></svg>' });
    });

    render(<PipelineHarness />);

    await act(async () => vi.advanceTimersByTimeAsync(50));
    expect(useEditorStore.getState().parsedNodes).toEqual([{ type: 'Point', name: 'A', x: 1, y: 2 }]);
    expect(useEditorStore.getState().parsedSource).toBe('source A');
    expect(useEditorStore.getState().resolvedPoints).toEqual({ A: { x: 1, y: 2 } });
    expect(useEditorStore.getState().resolvedViewport).toEqual({ viewBox: '0 0 10 10' });
    expect(useEditorStore.getState().performanceMetrics).toMatchObject({
      parseMs: 0.2,
      geometryMs: 0.3,
      viewportMs: 0.1,
      rustTotalMs: 0.7,
      nodeCount: 1,
      resolvedPointCount: 1,
      geometryComplete: true,
    });
    expect(useEditorStore.getState().performanceMetrics?.parseRoundTripMs).toBeGreaterThanOrEqual(0);
    expect(invokeMock).toHaveBeenCalledWith('parse_tikz', { source: 'source A' });

    await act(async () => vi.advanceTimersByTimeAsync(1450));
    expect(invokeMock).toHaveBeenCalledWith('compile_latex', { source: 'source A', compiler: 'lualatex', enginePaths: DEFAULT_APP_SETTINGS.latexEnginePaths });
    expect(useEditorStore.getState().compiledSource).toBe('source A');
    expect(useEditorStore.getState().svgOutput).toContain('<svg');
    expect(useEditorStore.getState().isCompiling).toBe(false);
    expect(useEditorStore.getState().performanceMetrics?.compileRoundTripMs).toBeGreaterThanOrEqual(0);
  });

  it('skips LaTeX compilation while instant preview is active', async () => {
    invokeMock.mockImplementation((command: string) => {
      if (command === 'parse_tikz') {
        return Promise.resolve({ nodes: [], geometry_complete: true });
      }
      return Promise.resolve({ success: true, svg: '<svg />' });
    });

    render(<PipelineHarness />);

    await act(async () => vi.advanceTimersByTimeAsync(50));
    await act(async () => vi.advanceTimersByTimeAsync(1500));

    expect(invokeMock).toHaveBeenCalledWith('parse_tikz', { source: 'source A' });
    expect(invokeMock).not.toHaveBeenCalledWith('compile_latex', expect.anything());
    expect(useEditorStore.getState().compiledSource).toBeNull();
    expect(useEditorStore.getState().isCompiling).toBe(false);
  });

  it('prefers the Rust renderScene payload over legacy geometry fields', async () => {
    invokeMock.mockImplementation((command: string) => {
      if (command === 'parse_tikz') {
        return Promise.resolve({
          nodes: [{ type: 'Point', name: 'A', x: 1, y: 2 }],
          resolved_points: { stale: { x: 0, y: 0 } },
          geometry_complete: false,
          viewport: { viewBox: 'stale' },
          renderScene: {
            points: { A: { x: 1, y: 2 } },
            viewBox: '0 0 10 10',
            geometryComplete: true,
          },
        });
      }
      return Promise.resolve({ success: true, svg: '<svg />' });
    });

    render(<PipelineHarness />);
    await act(async () => vi.advanceTimersByTimeAsync(50));

    expect(useEditorStore.getState().resolvedPoints).toEqual({ A: { x: 1, y: 2 } });
    expect(useEditorStore.getState().resolvedViewport).toEqual({ viewBox: '0 0 10 10' });
    expect(useEditorStore.getState().performanceMetrics).toMatchObject({ geometryComplete: true });
  });

  it('keeps partial Rust points and diagnostics when geometry is incomplete', async () => {
    invokeMock.mockImplementation((command: string) => {
      if (command === 'parse_tikz') {
        return Promise.resolve({
          nodes: [
            { type: 'Point', name: 'A', x: 1, y: 2 },
            { type: 'MidPoint', p1: 'A', p2: 'B', name: 'M' },
          ],
          renderScene: {
            points: { A: { x: 1, y: 2 } },
            geometryComplete: false,
            diagnostics: [{
              severity: 'warning',
              message: 'Could not resolve target M for MidPoint',
              nodeIndex: 1,
              nodeType: 'MidPoint',
              targets: ['M'],
            }],
          },
        });
      }
      return Promise.resolve({ success: true, svg: '<svg />' });
    });

    render(<PipelineHarness />);
    await act(async () => vi.advanceTimersByTimeAsync(50));

    expect(useEditorStore.getState().resolvedPoints).toEqual({ A: { x: 1, y: 2 } });
    expect(useEditorStore.getState().resolvedViewport).toBeNull();
    expect(useEditorStore.getState().geometryDiagnostics).toEqual([expect.objectContaining({
      nodeType: 'MidPoint',
      targets: ['M'],
    })]);
    expect(useEditorStore.getState().performanceMetrics).toMatchObject({
      geometryComplete: false,
      resolvedPointCount: 1,
    });
  });

  it('ignores an in-flight compile result after switching back to instant preview', async () => {
    useEditorStore.setState({ previewMode: 'latex' });
    let resolveCompile: ((value: unknown) => void) | undefined;
    invokeMock.mockImplementation((command: string) => {
      if (command === 'parse_tikz') return Promise.resolve({ nodes: [], geometry_complete: true });
      return new Promise(resolve => { resolveCompile = resolve; });
    });

    render(<PipelineHarness />);

    await act(async () => vi.advanceTimersByTimeAsync(1550));
    expect(useEditorStore.getState().isCompiling).toBe(true);

    act(() => useEditorStore.getState().setPreviewMode('instant'));
    expect(useEditorStore.getState().isCompiling).toBe(false);

    await act(async () => resolveCompile?.({ success: true, svg: '<svg>stale</svg>' }));

    expect(useEditorStore.getState().compiledSource).toBeNull();
    expect(useEditorStore.getState().svgOutput).toBeNull();
    expect(useEditorStore.getState().isCompiling).toBe(false);
  });

  it('ignores an older parse response after the source changes', async () => {
    let resolveFirst: ((value: unknown) => void) | undefined;
    invokeMock.mockImplementation((command: string, payload: { source: string }) => {
      if (command !== 'parse_tikz') return Promise.resolve({ success: true, svg: '<svg />' });
      if (payload.source === 'source A') {
        return new Promise(resolve => { resolveFirst = resolve; });
      }
      return Promise.resolve({ nodes: [{ type: 'Point', name: 'B', x: 3, y: 4 }] });
    });

    render(<PipelineHarness />);
    await act(async () => vi.advanceTimersByTimeAsync(50));

    act(() => useEditorStore.getState().setSource('source B'));
    await act(async () => vi.advanceTimersByTimeAsync(50));
    expect(useEditorStore.getState().parsedNodes[0]).toMatchObject({ name: 'B' });

    await act(async () => resolveFirst?.({ nodes: [{ type: 'Point', name: 'A', x: 1, y: 2 }] }));
    expect(useEditorStore.getState().parsedNodes[0]).toMatchObject({ name: 'B' });
  });
});
