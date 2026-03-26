import { create } from 'zustand';

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  line?: number;
  code: string;
  message: string;
}

interface ValidationState {
  issues: ValidationIssue[];
  isValidating: boolean;
  setIssues: (issues: ValidationIssue[]) => void;
  setIsValidating: (isValidating: boolean) => void;
}

export const useValidationStore = create<ValidationState>((set) => ({
  issues: [],
  isValidating: false,
  setIssues: (issues) => set({ issues }),
  setIsValidating: (isValidating) => set({ isValidating }),
}));
