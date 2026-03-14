"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface DataPoint {
  id: string;
  label: string;
  value: string;
  category: "outcomes" | "volume" | "demographics" | "sector" | "benchmarks";
  selected?: boolean;
}

export interface AnalysisResults {
  dataPoints: DataPoint[];
  insights: string[];
}

export interface BrandKit {
  id?: string;
  brandPrimary: string;
  brandAccent: string;
  brandSuccess: string;
  brandText: string;
  logoUrl: string | null;
  orgDisplayName: string;
  removeCandelaFooter: boolean;
}

export interface GrantsWizardState {
  projectId: string | null;
  runId: string | null;
  rawData: string;
  periodLabel: string;
  sourceType: string;
  brandKit: BrandKit | null;
  analysisResults: AnalysisResults | null;
  selectedDataPoints: DataPoint[];
  editedDataPoints: DataPoint[];
  selectedViews: string[];
  theme: string;
  layout: string;
}

interface GrantsWizardContextValue extends GrantsWizardState {
  setProjectId: (id: string | null) => void;
  setRunId: (id: string | null) => void;
  setRawData: (data: string) => void;
  setPeriodLabel: (label: string) => void;
  setSourceType: (type: string) => void;
  setBrandKit: (kit: BrandKit | null) => void;
  setAnalysisResults: (results: AnalysisResults | null) => void;
  setSelectedDataPoints: (points: DataPoint[]) => void;
  setEditedDataPoints: (points: DataPoint[]) => void;
  setSelectedViews: (views: string[]) => void;
  setTheme: (theme: string) => void;
  setLayout: (layout: string) => void;
  reset: () => void;
}

const initialState: GrantsWizardState = {
  projectId: null,
  runId: null,
  rawData: "",
  periodLabel: "",
  sourceType: "program",
  brandKit: null,
  analysisResults: null,
  selectedDataPoints: [],
  editedDataPoints: [],
  selectedViews: [],
  theme: "candela_classic",
  layout: "constellation",
};

const GrantsWizardContext = createContext<GrantsWizardContextValue | null>(null);

export function GrantsWizardProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GrantsWizardState>(initialState);

  const setProjectId = useCallback((id: string | null) => {
    setState((s) => ({ ...s, projectId: id }));
  }, []);

  const setRunId = useCallback((id: string | null) => {
    setState((s) => ({ ...s, runId: id }));
  }, []);

  const setRawData = useCallback((data: string) => {
    setState((s) => ({ ...s, rawData: data }));
  }, []);

  const setPeriodLabel = useCallback((label: string) => {
    setState((s) => ({ ...s, periodLabel: label }));
  }, []);

  const setSourceType = useCallback((type: string) => {
    setState((s) => ({ ...s, sourceType: type }));
  }, []);

  const setBrandKit = useCallback((kit: BrandKit | null) => {
    setState((s) => ({ ...s, brandKit: kit }));
  }, []);

  const setAnalysisResults = useCallback((results: AnalysisResults | null) => {
    setState((s) => ({ ...s, analysisResults: results }));
  }, []);

  const setSelectedDataPoints = useCallback((points: DataPoint[]) => {
    setState((s) => ({ ...s, selectedDataPoints: points }));
  }, []);

  const setEditedDataPoints = useCallback((points: DataPoint[]) => {
    setState((s) => ({ ...s, editedDataPoints: points }));
  }, []);

  const setSelectedViews = useCallback((views: string[]) => {
    setState((s) => ({ ...s, selectedViews: views }));
  }, []);

  const setTheme = useCallback((theme: string) => {
    setState((s) => ({ ...s, theme }));
  }, []);

  const setLayout = useCallback((layout: string) => {
    setState((s) => ({ ...s, layout }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <GrantsWizardContext.Provider
      value={{
        ...state,
        setProjectId,
        setRunId,
        setRawData,
        setPeriodLabel,
        setSourceType,
        setBrandKit,
        setAnalysisResults,
        setSelectedDataPoints,
        setEditedDataPoints,
        setSelectedViews,
        setTheme,
        setLayout,
        reset,
      }}
    >
      {children}
    </GrantsWizardContext.Provider>
  );
}

export function useGrantsWizard() {
  const ctx = useContext(GrantsWizardContext);
  if (!ctx) {
    throw new Error("useGrantsWizard must be used within GrantsWizardProvider");
  }
  return ctx;
}
