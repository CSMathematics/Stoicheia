import { useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { AstNode, GeometryDiagnostic, ResolvedViewport, useEditorStore } from '../store';
import { logPerformance, nowMs } from '../performanceMetrics';

interface ParseTimings {
  parseMs?: number;
  geometryMs?: number;
  viewportMs?: number;
  totalMs?: number;
  nodeCount?: number;
  resolvedPointCount?: number;
}

interface ParseResult {
  nodes?: AstNode[];
  resolved_points?: Record<string, { x: number; y: number }>;
  geometry_complete?: boolean;
  viewport?: ResolvedViewport | null;
  renderScene?: {
    points?: Record<string, { x: number; y: number }>;
    viewBox?: string | null;
    geometryComplete?: boolean;
    diagnostics?: GeometryDiagnostic[];
  };
  timings?: ParseTimings;
}

interface CompileResult {
  success: boolean;
  svg?: string | null;
  error_log?: string | null;
}

export function useDocumentPipeline() {
  const source = useEditorStore(state => state.source);
  const previewMode = useEditorStore(state => state.previewMode);
  const latexCompiler = useEditorStore(state => state.settings.latexCompiler);
  const latexEnginePaths = useEditorStore(state => state.settings.latexEnginePaths);
  const latexEnginePathsKey = `${latexEnginePaths.lualatex}\n${latexEnginePaths.pdflatex}\n${latexEnginePaths.xelatex}`;
  const parseTimerRef = useRef<number | null>(null);
  const compileTimerRef = useRef<number | null>(null);
  const parseRequestRef = useRef(0);
  const compileRequestRef = useRef(0);

  useEffect(() => {
    const requestId = ++parseRequestRef.current;
    if (parseTimerRef.current) window.clearTimeout(parseTimerRef.current);

    parseTimerRef.current = window.setTimeout(async () => {
      try {
        const startedAt = nowMs();
        const result = await invoke<ParseResult>('parse_tikz', { source });
        const parseRoundTripMs = nowMs() - startedAt;
        if (requestId === parseRequestRef.current) {
          const store = useEditorStore.getState();
          const scene = result.renderScene;
          const geometryComplete = scene?.geometryComplete ?? Boolean(result.geometry_complete);
          const scenePoints = scene?.points ?? result.resolved_points;
          const resolvedPoints = scenePoints ?? (geometryComplete ? {} : null);
          const resolvedViewport = geometryComplete
            ? scene?.viewBox ? { viewBox: scene.viewBox } : result.viewport ?? null
            : null;
          const geometryDiagnostics = scene?.diagnostics ?? [];
          store.setParsedDocument(
            result.nodes || [],
            resolvedPoints,
            resolvedViewport,
            source,
            geometryDiagnostics,
          );
          const metrics = {
            parseMs: result.timings?.parseMs,
            geometryMs: result.timings?.geometryMs,
            viewportMs: result.timings?.viewportMs,
            rustTotalMs: result.timings?.totalMs,
            parseRoundTripMs,
            nodeCount: result.timings?.nodeCount ?? result.nodes?.length ?? 0,
            resolvedPointCount: result.timings?.resolvedPointCount ?? (resolvedPoints ? Object.keys(resolvedPoints).length : 0),
            geometryComplete,
          };
          store.setPerformanceMetrics(metrics);
          logPerformance('parse', metrics);
        }
      } catch (error) {
        if (requestId === parseRequestRef.current) {
          console.error('Parse error:', error);
        }
      }
    }, 50);

    return () => {
      if (parseTimerRef.current) window.clearTimeout(parseTimerRef.current);
    };
  }, [source]);

  useEffect(() => {
    const requestId = ++compileRequestRef.current;
    if (compileTimerRef.current) {
      window.clearTimeout(compileTimerRef.current);
      compileTimerRef.current = null;
    }

    if (previewMode !== 'latex') {
      useEditorStore.getState().setIsCompiling(false);
      return () => {
        if (compileTimerRef.current) {
          window.clearTimeout(compileTimerRef.current);
          compileTimerRef.current = null;
        }
      };
    }

    compileTimerRef.current = window.setTimeout(async () => {
      compileTimerRef.current = null;
      const store = useEditorStore.getState();
      store.setIsCompiling(true);
      try {
        const startedAt = nowMs();
        const result = await invoke<CompileResult>('compile_latex', { source, compiler: latexCompiler, enginePaths: latexEnginePaths });
        const compileRoundTripMs = nowMs() - startedAt;
        if (requestId !== compileRequestRef.current) return;
        store.setPerformanceMetrics({ compileRoundTripMs });
        logPerformance('compile', { compileRoundTripMs });

        if (result.success && result.svg) {
          store.setSvgOutput(result.svg);
          store.setCompiledSource(source);
          store.setErrorLog(null);
        } else {
          store.setErrorLog(result.error_log || 'Unknown LaTeX compilation error');
        }
      } catch (error) {
        if (requestId === compileRequestRef.current) {
          store.setErrorLog(String(error));
        }
      } finally {
        if (requestId === compileRequestRef.current) {
          useEditorStore.getState().setIsCompiling(false);
        }
      }
    }, 1500);

    return () => {
      if (compileTimerRef.current) {
        window.clearTimeout(compileTimerRef.current);
        compileTimerRef.current = null;
      }
    };
  }, [source, previewMode, latexCompiler, latexEnginePathsKey]);
}
