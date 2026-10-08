/**
 * PB CivilLab — Canonical Report Document Model
 * Author: Prokash Biswas | Calculate Smarter. Build Better.
 *
 * Single Source of Truth for Technical Reports, Calculation Sheets & QA Audit Documents.
 * Consumed identically by Preview, Browser Print, and Vector PDF exports.
 */

import { CalculationStatus, ReportStatus, ValidationIssue } from '../types';

export interface ReportMetaHeader {
  appName: string;
  appTagline: string;
  authorCredit: string;
  documentNumber: string;
  revision: string;
  revisionDescription?: string;
  reportStatus: ReportStatus;
  date: string;
  printedAt?: string;
}

export interface ReportProjectInfo {
  projectName?: string;
  projectId?: string;
  client?: string;
  consultant?: string;
  contractor?: string;
  location?: string;
  drawingNumber?: string;
  drawingRevision?: string;
  calculationReference?: string;
  preparedBy?: string;
  checkedBy?: string;
  approvedBy?: string;
}

export interface ReportParameterRow {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
  category?: string;
  notes?: string;
}

export interface ReportTraceRow {
  stepNumber: number;
  label: string;
  formula?: string;
  expression: string;
  result: string;
}

export interface ReportEngineeringBasis {
  standardCode?: string;
  referenceClause?: string;
  calculationBasis: string;
  formulaMethod: string;
  materialAssumption: string;
  densityConstants: string;
  toleranceNote?: string;
  engineeringNotes?: string;
}

export interface ReportSignOffMember {
  role: 'PREPARED BY' | 'CHECKED BY' | 'APPROVED BY';
  name: string;
  title?: string;
  date?: string;
  statusText?: string;
}

export interface ReportLayoutOptions {
  orientation: 'portrait' | 'landscape';
  marginProfile: 'normal' | 'compact';
  pageSize: 'A4';
  marginsMm: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  showProjectInfo: boolean;
  showInputs: boolean;
  showPrimaryResult: boolean;
  showSecondaryResults: boolean;
  showCalculationTrace: boolean;
  showEngineeringBasis: boolean;
  showEngineeringNotes: boolean;
  showDetailedTables: boolean;
  showVerification: boolean;
  showEmptyMetadataRows: boolean;
}

export interface ReportDocumentModel {
  id: string;
  title: string;
  status: CalculationStatus;
  validationIssues?: ValidationIssue[];
  warnings?: string[];
  header: ReportMetaHeader;
  project: ReportProjectInfo;
  layout: ReportLayoutOptions;
  primaryResult: {
    label: string;
    value: string;
    unit: string;
    statusBadge?: string;
  };
  inputs: ReportParameterRow[];
  outputs: ReportParameterRow[];
  formula: string;
  substitutedFormula: string;
  trace: ReportTraceRow[];
  breakdown: { step: string; expression: string; result: string }[];
  assumptions: { label: string; value: string }[];
  basis?: ReportEngineeringBasis;
  engineeringNotes?: string;
  signOff: ReportSignOffMember[];
  disclaimer: string;
}
