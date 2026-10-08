/**
 * PB CivilLab — Export & Report Generator Engine
 * Author: Prokash Biswas | Calculate Smarter. Build Better.
 *
 * CRITICAL RULE:
 * Consumes the authoritative CalculationResult object directly.
 * Never recalculates engineering outputs independently.
 */

import { CalculationResult, ReportProjectMeta, ReportSectionOptions, DEFAULT_REPORT_SECTIONS } from '../types';
export { exportCalculationToPDF } from './pdfExport';
export type { PDFExportOptions } from './pdfExport';

/**
 * Generates clean, engineering-formatted CSV data from CalculationResult.
 * Accurately reflects sections enabled in preview while preserving mandatory branding.
 */
export function generateCSVReport(
  result: CalculationResult,
  projectMeta?: ReportProjectMeta,
  sectionOptions?: Partial<ReportSectionOptions>
): string {
  const sections = { ...DEFAULT_REPORT_SECTIONS, ...(sectionOptions || {}) };
  const lines: string[] = [];

  // Mandatory App Branding & Creator Credits Header (Always included)
  lines.push('PB CivilLab — Civil Engineering Smart Toolkit');
  lines.push('Author: Prokash Biswas | Calculate Smarter. Build Better.');
  lines.push(`Calculation Sheet: "${result.title}"`);
  lines.push(`Document No: "${projectMeta?.documentNumber || result.documentId || 'PBCL-DRAFT'}"`);
  lines.push(`Report Status: "${projectMeta?.reportStatus || 'Draft'}"`);
  lines.push(`Date: "${projectMeta?.date || new Date().toLocaleDateString('en-US')}"`);
  lines.push('');

  // 1. Project Information Section (Optional)
  if (sections.showProjectInfo && projectMeta) {
    const hasAnyField = Boolean(
      projectMeta.projectName ||
      projectMeta.projectId ||
      projectMeta.client ||
      projectMeta.contractor ||
      projectMeta.consultant ||
      projectMeta.location ||
      projectMeta.drawingNumber ||
      projectMeta.drawingRevision ||
      projectMeta.calculationReference
    );

    if (hasAnyField || projectMeta.showEmptyFields) {
      lines.push('--- PROJECT INFORMATION ---');
      if (projectMeta.projectName) lines.push(`Project Name,"${projectMeta.projectName}"`);
      if (projectMeta.projectId) lines.push(`Project ID,"${projectMeta.projectId}"`);
      if (projectMeta.client) lines.push(`Client / Owner,"${projectMeta.client}"`);
      if (projectMeta.contractor) lines.push(`Contractor,"${projectMeta.contractor}"`);
      if (projectMeta.consultant) lines.push(`Consultant,"${projectMeta.consultant}"`);
      if (projectMeta.location) lines.push(`Jobsite Location,"${projectMeta.location}"`);
      if (projectMeta.drawingNumber) lines.push(`Drawing Number,"${projectMeta.drawingNumber}"`);
      if (projectMeta.drawingRevision) lines.push(`Drawing Revision,"${projectMeta.drawingRevision}"`);
      if (projectMeta.calculationReference) lines.push(`Calculation Reference,"${projectMeta.calculationReference}"`);
      lines.push('');
    }
  }

  // 2. Primary Engineering Result (Optional)
  if (sections.showPrimaryResult) {
    lines.push('--- PRIMARY ENGINEERING RESULT ---');
    lines.push(`Parameter,Value,Unit`);
    lines.push(`Primary Output,"${result.primaryValue}","${result.primaryUnit}"`);
    lines.push('');
  }

  // 3. Input Parameters Table (Optional)
  if (sections.showInputs && result.inputsSummary && result.inputsSummary.length > 0) {
    lines.push('--- INPUT PARAMETERS ---');
    lines.push(`Parameter,Specified Value,Unit`);
    result.inputsSummary.forEach(inp => {
      lines.push(`"${inp.label}","${inp.value}","${inp.unit || ''}"`);
    });
    lines.push('');
  }

  // 4. Secondary Calculated Outputs (Optional)
  if (sections.showSecondaryResults && result.secondaryValues && result.secondaryValues.length > 0) {
    lines.push('--- CALCULATED OUTPUTS ---');
    lines.push(`Item,Computed Value,Unit`);
    result.secondaryValues.forEach(sec => {
      lines.push(`"${sec.label}","${sec.value}","${sec.unit || ''}"`);
    });
    lines.push('');
  }

  // 5. Calculation Trace (Optional)
  if (sections.showCalculationTrace && result.calculationTrace && result.calculationTrace.length > 0) {
    lines.push('--- CALCULATION TRACE ---');
    lines.push(`Step,Formula,Expression,Result`);
    result.calculationTrace.forEach(tr => {
      lines.push(`"${tr.label}","${tr.formula || ''}","${tr.expression}","${tr.result}"`);
    });
    lines.push('');
  }

  // 6. Detailed Tables & Step Breakdown (Optional)
  if (sections.showDetailedTables && result.breakdown && result.breakdown.length > 0) {
    lines.push('--- DETAILED BREAKDOWN & STEP SUMMARY ---');
    lines.push(`Step,Expression,Computed Value`);
    result.breakdown.forEach(b => {
      lines.push(`"${b.step}","${b.expression}","${b.result}"`);
    });
    lines.push('');
  }

  // 7. Engineering Basis & Assumptions (Optional)
  if (sections.showEngineeringBasis) {
    lines.push('--- ENGINEERING BASIS & STANDARDS ---');
    if (result.formula) lines.push(`Formula,"${result.formula}"`);
    if (result.substitutedFormula) lines.push(`Substituted,"${result.substitutedFormula}"`);
    if (result.engineeringBasis) {
      lines.push(`Method,"${result.engineeringBasis.calculationBasis}"`);
      lines.push(`Standards,"${result.engineeringBasis.standardCode || 'Standard Theoretical'}"`);
      lines.push(`Material Assumption,"${result.engineeringBasis.materialAssumption}"`);
      lines.push(`Constants,"${result.engineeringBasis.densityConstants}"`);
      if (result.engineeringBasis.toleranceNote) {
        lines.push(`Tolerance Note,"${result.engineeringBasis.toleranceNote}"`);
      }
    }
    if (result.assumptions && result.assumptions.length > 0) {
      result.assumptions.forEach(a => {
        lines.push(`Assumption: ${a.label},"${a.value}"`);
      });
    }
    lines.push('');
  }

  // 8. Engineering & Quality Control Notes (Optional)
  if (sections.showEngineeringNotes && result.engineeringNotes) {
    lines.push('--- ENGINEERING & QUALITY NOTES ---');
    lines.push(`Site Precaution,"${result.engineeringNotes.replace(/"/g, '""')}"`);
    lines.push('');
  }

  // 9. Verification & Approval Sign-Off (Optional)
  if (sections.showVerification) {
    lines.push('--- VERIFICATION & APPROVAL ---');
    lines.push(`Prepared By,"${projectMeta?.preparedBy || 'Not specified'}"`);
    lines.push(`Checked By,"${projectMeta?.checkedBy || 'Not specified'}"`);
    lines.push(`Approved By,"${projectMeta?.approvedBy || 'Not specified'}"`);
    lines.push('');
  }

  // Standard Engineering Disclaimer
  lines.push('--- DISCLAIMER ---');
  lines.push('"Engineering Note: This calculation provides computational assistance based on the inputs, assumptions, units and calculation method selected by the user. It does not replace project specifications, approved drawings, applicable codes and standards, manufacturer data, site verification, or professional engineering judgment."');

  return lines.join('\n');
}

/**
 * Generates an Excel-optimized spreadsheet payload (CSV with UTF-8 BOM).
 * Ensures Microsoft Excel and Numbers render Unicode engineering symbols cleanly.
 */
export function generateExcelReport(
  result: CalculationResult,
  projectMeta?: ReportProjectMeta,
  sectionOptions?: Partial<ReportSectionOptions>
): string {
  const csvBody = generateCSVReport(result, projectMeta, sectionOptions);
  return '\uFEFF' + csvBody;
}

/**
 * Generates a structured JSON calculation export object.
 * Preserves full numerical precision, formulas, and civil engineering metadata
 * while strictly adhering to mandatory PB CivilLab identity and creator attribution.
 */
export function generateJSONExport(
  result: CalculationResult,
  projectMeta?: ReportProjectMeta,
  sectionOptions?: Partial<ReportSectionOptions>
): string {
  const sections = { ...DEFAULT_REPORT_SECTIONS, ...(sectionOptions || {}) };

  const exportPayload: Record<string, any> = {
    app: 'PB CivilLab',
    tagline: 'Calculate Smarter. Build Better.',
    author: 'Prokash Biswas',
    version: '2.1.0',
    format: 'PB_CIVILLAB_ENGINEERING_REPORT_V2',
    exportedAt: new Date().toISOString(),
    documentId: projectMeta?.documentNumber || result.documentId || `PBCL-${Date.now()}`,
    status: projectMeta?.reportStatus || 'Draft',
  };

  if (sections.showProjectInfo && projectMeta) {
    exportPayload.projectMeta = {
      projectName: projectMeta.projectName || '',
      projectId: projectMeta.projectId || '',
      client: projectMeta.client || '',
      contractor: projectMeta.contractor || '',
      consultant: projectMeta.consultant || '',
      location: projectMeta.location || '',
      drawingNumber: projectMeta.drawingNumber || '',
      drawingRevision: projectMeta.drawingRevision || '',
      documentNumber: projectMeta.documentNumber || '',
      calculationReference: projectMeta.calculationReference || '',
      date: projectMeta.date || '',
    };
  }

  exportPayload.calculation = {
    title: result.title,
    category: result.primaryCategory || 'Civil Engineering',
  };

  if (sections.showPrimaryResult) {
    exportPayload.calculation.primaryResult = {
      value: result.primaryValue,
      unit: result.primaryUnit,
    };
  }

  if (sections.showInputs && result.inputsSummary) {
    exportPayload.calculation.inputs = result.inputsSummary;
  }

  if (sections.showSecondaryResults && result.secondaryValues) {
    exportPayload.calculation.secondaryOutputs = result.secondaryValues;
  }

  if (sections.showCalculationTrace) {
    exportPayload.calculation.trace = {
      formula: result.formula || '',
      substitutedFormula: result.substitutedFormula || '',
      steps: result.calculationTrace || [],
    };
  }

  if (sections.showDetailedTables && result.breakdown) {
    exportPayload.calculation.breakdown = result.breakdown;
  }

  if (sections.showEngineeringBasis) {
    exportPayload.calculation.engineeringBasis = {
      basis: result.engineeringBasis,
      assumptions: result.assumptions || [],
    };
  }

  if (sections.showEngineeringNotes && result.engineeringNotes) {
    exportPayload.calculation.engineeringNotes = result.engineeringNotes;
  }

  if (sections.showVerification) {
    exportPayload.verification = {
      preparedBy: projectMeta?.preparedBy || '',
      checkedBy: projectMeta?.checkedBy || '',
      approvedBy: projectMeta?.approvedBy || '',
    };
  }

  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Downloads a string payload as a file in the browser with error recovery.
 */
export function downloadFile(content: string, filename: string, mimeType: string) {
  try {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  } catch (err) {
    console.error('downloadFile error:', err);
    throw new Error(`Failed to download ${filename}: ${(err as Error).message}`);
  }
}
