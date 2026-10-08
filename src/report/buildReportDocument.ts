/**
 * PB CivilLab — Canonical Report Document Builder
 * Author: Prokash Biswas | Calculate Smarter. Build Better.
 */

import {
  CalculationResult,
  ReportProjectMeta,
  ReportSectionOptions,
  DEFAULT_REPORT_SECTIONS,
} from '../types';
import { APP_NAME, APP_TAGLINE, APP_AUTHOR } from '../constants/version';
import { ReportDocumentModel, ReportLayoutOptions, ReportSignOffMember } from './ReportDocumentModel';

export interface BuildReportOptions {
  projectMeta?: ReportProjectMeta;
  sectionOptions?: Partial<ReportSectionOptions>;
  orientation?: 'portrait' | 'landscape';
  marginProfile?: 'normal' | 'compact';
  customTitle?: string;
  revision?: string;
  revisionDescription?: string;
}

const STANDARD_ENGINEERING_DISCLAIMER =
  'This technical document is prepared using PB CivilLab computational engines according to user-selected standards, parameters, and boundary conditions. It does not supersede verified architectural/structural drawings, project specifications, geotechnical site investigation reports, or certified professional engineering oversight.';

export function buildReportDocument(
  result: CalculationResult,
  options: BuildReportOptions = {}
): ReportDocumentModel {
  const {
    projectMeta,
    sectionOptions,
    orientation = 'portrait',
    marginProfile = 'normal',
    customTitle,
    revision = 'R0',
    revisionDescription = 'Initial Calculation Sheet',
  } = options;

  const sections: ReportSectionOptions = {
    ...DEFAULT_REPORT_SECTIONS,
    ...(sectionOptions || {}),
  };

  const marginMm = marginProfile === 'compact' ? 10 : 15;
  const layout: ReportLayoutOptions = {
    orientation,
    marginProfile,
    pageSize: 'A4',
    marginsMm: {
      top: marginMm,
      bottom: marginMm,
      left: marginMm,
      right: marginMm,
    },
    showProjectInfo: sections.showProjectInfo,
    showInputs: sections.showInputs,
    showPrimaryResult: sections.showPrimaryResult,
    showSecondaryResults: sections.showSecondaryResults,
    showCalculationTrace: sections.showCalculationTrace,
    showEngineeringBasis: sections.showEngineeringBasis,
    showEngineeringNotes: sections.showEngineeringNotes,
    showDetailedTables: sections.showDetailedTables,
    showVerification: sections.showVerification,
    showEmptyMetadataRows: Boolean(projectMeta?.showEmptyFields),
  };

  const documentNumber =
    projectMeta?.documentNumber ||
    result.documentId ||
    `PBCL-${new Date().getFullYear()}-0001`;

  const reportStatus = projectMeta?.reportStatus || (result.isPreliminary ? 'Draft' : 'Draft');
  const dateStr =
    projectMeta?.date ||
    new Date().toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  // 1. Sign-off members (Strictly un-fabricated: if empty, show dash or role)
  const signOff: ReportSignOffMember[] = [
    {
      role: 'PREPARED BY',
      name: projectMeta?.preparedBy?.trim() || '—',
      title: projectMeta?.preparedBy ? 'Design / Site Engineer' : 'Signature & Date',
      date: projectMeta?.preparedBy ? dateStr : undefined,
    },
    {
      role: 'CHECKED BY',
      name: projectMeta?.checkedBy?.trim() || '—',
      title: projectMeta?.checkedBy ? 'Lead Reviewer / Consultant' : 'Signature & Date',
      date: projectMeta?.checkedBy ? dateStr : undefined,
    },
    {
      role: 'APPROVED BY',
      name: projectMeta?.approvedBy?.trim() || '—',
      title: projectMeta?.approvedBy ? 'Project Director / EIC' : 'Signature & Date',
      date: projectMeta?.approvedBy ? dateStr : undefined,
    },
  ];

  // 2. Calculation trace rows
  const trace = (result.calculationTrace || []).map((t, idx) => ({
    stepNumber: idx + 1,
    label: t.label,
    formula: t.formula,
    expression: t.expression,
    result: t.result,
  }));

  // 3. Inputs formatting
  const inputs = (result.inputsSummary || []).map(inp => ({
    label: inp.label,
    value: inp.value,
    unit: inp.unit,
  }));

  // 4. Secondary outputs formatting
  const outputs = (result.secondaryValues || []).map(sec => ({
    label: sec.label,
    value: sec.value,
    unit: sec.unit,
    category: sec.category,
  }));

  return {
    id: result.documentId || documentNumber,
    title: customTitle?.trim() || result.title,
    status: result.status || 'valid',
    validationIssues: result.validationIssues,
    warnings: result.warnings,
    header: {
      appName: APP_NAME,
      appTagline: APP_TAGLINE,
      authorCredit: APP_AUTHOR,
      documentNumber,
      revision,
      revisionDescription,
      reportStatus,
      date: dateStr,
      printedAt: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    },
    project: {
      projectName: projectMeta?.projectName,
      projectId: projectMeta?.projectId,
      client: projectMeta?.client,
      consultant: projectMeta?.consultant,
      contractor: projectMeta?.contractor,
      location: projectMeta?.location,
      drawingNumber: projectMeta?.drawingNumber,
      drawingRevision: projectMeta?.drawingRevision,
      calculationReference: projectMeta?.calculationReference,
      preparedBy: projectMeta?.preparedBy,
      checkedBy: projectMeta?.checkedBy,
      approvedBy: projectMeta?.approvedBy,
    },
    layout,
    primaryResult: {
      label: 'AUTHORITATIVE CALCULATION OUTPUT',
      value: result.primaryValue,
      unit: result.primaryUnit,
      statusBadge: result.status === 'invalid' ? 'VALIDATION ERROR' : undefined,
    },
    inputs,
    outputs,
    formula: result.formula || '',
    substitutedFormula: result.substitutedFormula || '',
    trace,
    breakdown: result.breakdown || [],
    assumptions: result.assumptions || [],
    basis: result.engineeringBasis,
    engineeringNotes: result.engineeringNotes,
    signOff,
    disclaimer: STANDARD_ENGINEERING_DISCLAIMER,
  };
}
